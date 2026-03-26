import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/forgot-password/route";

jest.mock("@/lib/firebase/admin", () => ({
  adminAuth: {
    generatePasswordResetLink: jest.fn(),
  },
}));

jest.mock("@/lib/email/brevo.service", () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

import { adminAuth } from "@/lib/firebase/admin";
import { sendPasswordResetEmail } from "@/lib/email/brevo.service";

function makeRequest(body: object) {
  return new NextRequest("http://localhost:3000/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ──────────────────────────────────────────────────────────────────────────────

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  });

  it("always returns 200 with { ok: true }", async () => {
    jest.mocked(adminAuth.generatePasswordResetLink).mockResolvedValue(
      "https://firebase.example.com/__/auth/action?oobCode=code123"
    );

    const res = await POST(makeRequest({ email: "user@test.com" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true });
  });

  it("returns 200 even when email is missing from the request body", async () => {
    const res = await POST(makeRequest({}));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(adminAuth.generatePasswordResetLink).not.toHaveBeenCalled();
  });

  it("returns 200 even when Firebase throws (user not found)", async () => {
    jest.mocked(adminAuth.generatePasswordResetLink).mockRejectedValue(
      new Error("auth/user-not-found")
    );

    const res = await POST(makeRequest({ email: "unknown@test.com" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("sends a password reset email with the oobCode extracted from Firebase link", async () => {
    jest.mocked(adminAuth.generatePasswordResetLink).mockResolvedValue(
      "https://firebase.example.com/__/auth/action?oobCode=my-oob-code&mode=resetPassword"
    );

    await POST(makeRequest({ email: "user@test.com" }));

    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@test.com",
        resetUrl: expect.stringContaining("oobCode=my-oob-code"),
      })
    );
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        resetUrl: expect.stringContaining("/set-password"),
      })
    );
  });

  it("trims whitespace from the email before processing", async () => {
    jest.mocked(adminAuth.generatePasswordResetLink).mockResolvedValue(
      "https://firebase.example.com/__/auth/action?oobCode=abc"
    );

    await POST(makeRequest({ email: "  user@test.com  " }));

    expect(adminAuth.generatePasswordResetLink).toHaveBeenCalledWith("user@test.com");
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "user@test.com" })
    );
  });
});
