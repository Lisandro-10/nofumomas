import { NextRequest } from "next/server";
import { POST } from "../route";

const mockDelete = jest.fn();

jest.mock("@/lib/firebase/admin", () => ({
  adminDb: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({ delete: mockDelete })),
    })),
  },
}));

function makeRequest(cookieMap: Record<string, string> = {}) {
  const req = new NextRequest("http://localhost/api/auth/logout", { method: "POST" });
  Object.entries(cookieMap).forEach(([name, value]) => req.cookies.set(name, value));
  return req;
}

describe("POST /api/auth/logout", () => {
  beforeEach(() => jest.clearAllMocks());

  it("deletes the session from Firestore when uid cookie is present", async () => {
    mockDelete.mockResolvedValue(undefined);

    const res = await POST(makeRequest({ nfm_uid: "uid-123", nfm_session: "token-abc" }));

    expect(res.status).toBe(200);
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it("returns 200 without hitting Firestore when uid cookie is missing", async () => {
    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("clears nfm_session and nfm_uid cookies", async () => {
    mockDelete.mockResolvedValue(undefined);

    const res = await POST(makeRequest({ nfm_uid: "uid-123" }));

    const cookieHeader = res.headers.getSetCookie();
    const cookieNames = cookieHeader.map((c) => c.split("=")[0]);
    expect(cookieNames).toContain("nfm_session");
    expect(cookieNames).toContain("nfm_uid");
  });
});
