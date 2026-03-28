import { NextRequest } from "next/server";
import { middleware } from "../middleware";

function makeRequest(path: string, cookieMap: Record<string, string> = {}) {
  const req = new NextRequest(`http://localhost${path}`);
  Object.entries(cookieMap).forEach(([name, value]) => req.cookies.set(name, value));
  return req;
}

describe("middleware", () => {
  it("allows request through on /login", () => {
    const res = middleware(makeRequest("/login"));
    expect(res.status).toBe(200);
  });

  it("allows request through on /register", () => {
    const res = middleware(makeRequest("/register"));
    expect(res.status).toBe(200);
  });

  it("allows request through on /api/auth/login", () => {
    const res = middleware(makeRequest("/api/auth/login"));
    expect(res.status).toBe(200);
  });

  it("allows request through on /session-displaced", () => {
    const res = middleware(makeRequest("/session-displaced"));
    expect(res.status).toBe(200);
  });

  it("allows request through on /forgot-password", () => {
    const res = middleware(makeRequest("/forgot-password"));
    expect(res.status).toBe(200);
  });

  it("allows request through on /set-password", () => {
    const res = middleware(makeRequest("/set-password"));
    expect(res.status).toBe(200);
  });

  it("redirects to /login when both cookies are absent on a protected path", () => {
    const res = middleware(makeRequest("/dashboard"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("redirects to /login when only nfm_uid cookie is present", () => {
    const res = middleware(makeRequest("/dashboard", { nfm_uid: "uid-123" }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("allows request through when both cookies are present on a protected path", () => {
    const res = middleware(
      makeRequest("/dashboard", { nfm_session: "some-token", nfm_uid: "uid-123" })
    );
    expect(res.status).toBe(200);
  });
});
