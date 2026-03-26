import { NextRequest } from "next/server";
import { POST } from "@/app/api/user/seen-welcome/route";

jest.mock("@/lib/firebase/admin", () => ({
  adminDb: {
    collection: jest.fn(),
  },
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

import { adminDb } from "@/lib/firebase/admin";

function makeRequest(uid?: string) {
  const req = new NextRequest("http://localhost:3000/api/user/seen-welcome", {
    method: "POST",
  });
  if (uid) req.cookies.set("nfm_uid", uid);
  return req;
}

function setupFirestoreChain() {
  const mockUpdate = jest.fn().mockResolvedValue(undefined);
  const mockDocFn = jest.fn().mockReturnValue({ update: mockUpdate });
  (adminDb.collection as jest.Mock).mockReturnValue({ doc: mockDocFn });
  return { mockUpdate, mockDocFn };
}

// ──────────────────────────────────────────────────────────────────────────────

describe("POST /api/user/seen-welcome", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when the nfm_uid cookie is absent", async () => {
    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 200 with { ok: true } when the cookie is present", async () => {
    setupFirestoreChain();

    const res = await POST(makeRequest("uid-123"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true });
  });

  it("calls adminDb.collection('users').doc(uid).update({ hasSeenWelcome: true })", async () => {
    const { mockUpdate, mockDocFn } = setupFirestoreChain();

    await POST(makeRequest("uid-123"));

    expect(adminDb.collection).toHaveBeenCalledWith("users");
    expect(mockDocFn).toHaveBeenCalledWith("uid-123");
    expect(mockUpdate).toHaveBeenCalledWith({ hasSeenWelcome: true });
  });

  it("does not call Firestore when cookie is missing", async () => {
    await POST(makeRequest());

    expect(adminDb.collection).not.toHaveBeenCalled();
  });
});
