jest.mock("@/lib/firebase/admin", () => ({
  adminAuth: { verifyIdToken: jest.fn() },
  adminDb: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({ set: jest.fn() })),
    })),
  },
}));

import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { POST } from "../route";

function makeRequest(body: object) {
  return new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 400 if idToken is missing", async () => {
    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
  });

  it("returns 401 if idToken is invalid", async () => {
    (adminAuth.verifyIdToken as jest.Mock).mockRejectedValue(new Error("invalid token"));

    const res = await POST(makeRequest({ idToken: "bad-token" }));

    expect(res.status).toBe(401);
  });

  it("returns 200 and writes session to Firestore on valid token", async () => {
    const mockSet = jest.fn().mockResolvedValue(undefined);
    (adminAuth.verifyIdToken as jest.Mock).mockResolvedValue({ uid: "uid-123" });
    (adminDb.collection as jest.Mock).mockReturnValue({
      doc: jest.fn().mockReturnValue({ set: mockSet }),
    });

    const res = await POST(makeRequest({ idToken: "valid-token" }));

    expect(res.status).toBe(200);
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "uid-123", sessionToken: expect.any(String) })
    );
  });

  it("sets nfm_session and nfm_uid cookies on valid token", async () => {
    (adminAuth.verifyIdToken as jest.Mock).mockResolvedValue({ uid: "uid-123" });
    (adminDb.collection as jest.Mock).mockReturnValue({
      doc: jest.fn().mockReturnValue({ set: jest.fn().mockResolvedValue(undefined) }),
    });

    const res = await POST(makeRequest({ idToken: "valid-token" }));

    const cookieNames = res.headers.getSetCookie().map((c) => c.split("=")[0]);
    expect(cookieNames).toContain("nfm_session");
    expect(cookieNames).toContain("nfm_uid");
  });
});
