const mockGet = jest.fn();

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

// next/navigation redirect throws a special error internally — we simulate that
jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

jest.mock("@/lib/firebase/admin", () => ({
  adminDb: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({ get: mockGet })),
    })),
  },
}));

import { cookies } from "next/headers";
import { validateSession } from "../session.server";

function mockCookies(values: Record<string, string>) {
  (cookies as jest.Mock).mockReturnValue({
    get: (name: string) =>
      values[name] !== undefined ? { value: values[name] } : undefined,
  });
}

describe("validateSession", () => {
  beforeEach(() => jest.clearAllMocks());

  it("redirects to /login when cookies are missing", async () => {
    mockCookies({});

    await expect(validateSession()).rejects.toThrow("REDIRECT:/login");
  });

  it("redirects to /login when only one cookie is present", async () => {
    mockCookies({ nfm_uid: "uid-123" }); // nfm_session missing

    await expect(validateSession()).rejects.toThrow("REDIRECT:/login");
  });

  it("redirects to /session-displaced when token does not match Firestore", async () => {
    mockCookies({ nfm_session: "token-old", nfm_uid: "uid-123" });
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ sessionToken: "token-different" }),
    });

    await expect(validateSession()).rejects.toThrow("REDIRECT:/session-displaced");
  });

  it("redirects to /session-displaced when session document does not exist", async () => {
    mockCookies({ nfm_session: "token-abc", nfm_uid: "uid-123" });
    mockGet.mockResolvedValue({ exists: false, data: () => null });

    await expect(validateSession()).rejects.toThrow("REDIRECT:/session-displaced");
  });

  it("returns uid when session is valid", async () => {
    mockCookies({ nfm_session: "valid-token", nfm_uid: "uid-123" });
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ sessionToken: "valid-token" }),
    });

    const uid = await validateSession();

    expect(uid).toBe("uid-123");
  });
});
