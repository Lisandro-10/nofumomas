import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/resend-activation/route";

jest.mock("@/lib/firebase/admin", () => ({
  adminDb: {
    collection: jest.fn(),
  },
}));

jest.mock("@/lib/email/activation-token", () => ({
  signActivationToken: jest.fn().mockResolvedValue("mock-token"),
}));

jest.mock("@/lib/email/brevo.service", () => ({
  sendActivationEmail: jest.fn().mockResolvedValue(undefined),
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

import { adminDb } from "@/lib/firebase/admin";
import { signActivationToken } from "@/lib/email/activation-token";
import { sendActivationEmail } from "@/lib/email/brevo.service";

function makeRequest(body: object) {
  return new NextRequest("http://localhost:3000/api/auth/resend-activation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mockFirestoreQuery(docs: Array<{ id: string; data: object }>) {
  const mockGet = jest.fn().mockResolvedValue({
    docs: docs.map((d) => ({ id: d.id, data: () => d.data })),
  });
  const mockWhere = jest.fn().mockReturnValue({ get: mockGet });
  (adminDb.collection as jest.Mock).mockReturnValue({ where: mockWhere });
  return { mockGet, mockWhere };
}

// ──────────────────────────────────────────────────────────────────────────────

describe("POST /api/auth/resend-activation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  });

  it("always returns 200 with { ok: true }", async () => {
    mockFirestoreQuery([]);

    const res = await POST(makeRequest({ email: "user@test.com" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true });
  });

  it("returns 200 without querying Firestore when email is missing", async () => {
    const res = await POST(makeRequest({}));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(adminDb.collection).not.toHaveBeenCalled();
  });

  it("sends activation email when a 'paid' purchase exists for the email", async () => {
    mockFirestoreQuery([
      { id: "purchase-abc", data: { email: "user@test.com", status: "paid" } },
    ]);

    await POST(makeRequest({ email: "user@test.com" }));

    expect(signActivationToken).toHaveBeenCalledWith("purchase-abc", "user@test.com");
    expect(sendActivationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@test.com",
        activationUrl: expect.stringContaining("mock-token"),
      })
    );
  });

  it("does not send email when no 'paid' purchase exists for the email", async () => {
    mockFirestoreQuery([
      { id: "purchase-abc", data: { email: "user@test.com", status: "activated" } },
    ]);

    await POST(makeRequest({ email: "user@test.com" }));

    expect(sendActivationEmail).not.toHaveBeenCalled();
  });

  it("returns 200 even when Firestore throws", async () => {
    (adminDb.collection as jest.Mock).mockImplementation(() => {
      throw new Error("Firestore error");
    });

    const res = await POST(makeRequest({ email: "user@test.com" }));

    expect(res.status).toBe(200);
    expect(sendActivationEmail).not.toHaveBeenCalled();
  });

  it("queries purchases by the provided email", async () => {
    const { mockWhere } = mockFirestoreQuery([]);

    await POST(makeRequest({ email: "user@test.com" }));

    expect(mockWhere).toHaveBeenCalledWith("email", "==", "user@test.com");
  });
});
