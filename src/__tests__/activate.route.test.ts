import { NextRequest } from "next/server";
import { GET } from "@/app/api/auth/activate/route";

jest.mock("@/lib/email/activation-token", () => ({
  verifyActivationToken: jest.fn(),
}));

jest.mock("@/lib/firebase/repositories/purchases.repository", () => ({
  purchasesRepository: {
    findById: jest.fn(),
    activate: jest.fn(),
  },
}));

jest.mock("@/lib/firebase/admin", () => ({
  adminAuth: {
    getUserByEmail: jest.fn(),
    createUser: jest.fn(),
    generatePasswordResetLink: jest.fn(),
  },
  adminDb: {
    collection: jest.fn(),
  },
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

import { verifyActivationToken } from "@/lib/email/activation-token";
import { purchasesRepository } from "@/lib/firebase/repositories/purchases.repository";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

function makeRequest(token?: string) {
  const url = token
    ? `http://localhost:3000/api/auth/activate?token=${token}`
    : "http://localhost:3000/api/auth/activate";
  return new NextRequest(url, { method: "GET" });
}

const BASE_PURCHASE = {
  id: "purchase-abc",
  email: "user@test.com",
  provider: "stripe" as const,
  paymentId: "cs_test",
  status: "paid" as const,
  amount: 120,
  currency: "USD",
};

function setupFirestoreChain() {
  const mockSet = jest.fn().mockResolvedValue(undefined);
  const mockGet = jest.fn().mockResolvedValue({ exists: true });
  const mockDocRef = { set: mockSet, get: mockGet };
  const mockDocFn = jest.fn().mockReturnValue(mockDocRef);
  (adminDb.collection as jest.Mock).mockReturnValue({ doc: mockDocFn });
  return { mockSet, mockGet, mockDocFn };
}

// ──────────────────────────────────────────────────────────────────────────────

describe("GET /api/auth/activate — token validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects to /?error=token-missing when no token is provided", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=token-missing");
  });

  it("redirects to /?error=invalid-token when token verification fails", async () => {
    jest.mocked(verifyActivationToken).mockRejectedValue(new Error("bad token"));

    const res = await GET(makeRequest("bad-token"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=invalid-token");
  });

  it("redirects to /?error=invalid-token when purchase is not found", async () => {
    jest.mocked(verifyActivationToken).mockResolvedValue({
      purchaseId: "missing-id",
      email: "user@test.com",
    });
    jest.mocked(purchasesRepository.findById).mockResolvedValue(null);

    const res = await GET(makeRequest("valid-token"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=invalid-token");
  });
});

describe("GET /api/auth/activate — purchase status checks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(verifyActivationToken).mockResolvedValue({
      purchaseId: "purchase-abc",
      email: "user@test.com",
    });
  });

  it("redirects to /?info=already-activated when purchase is already activated", async () => {
    jest.mocked(purchasesRepository.findById).mockResolvedValue({
      ...BASE_PURCHASE,
      status: "activated",
    });

    const res = await GET(makeRequest("token"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("info=already-activated");
  });

  it("redirects to /?error=purchase-not-paid when purchase is in 'failed' state", async () => {
    jest.mocked(purchasesRepository.findById).mockResolvedValue({
      ...BASE_PURCHASE,
      status: "failed",
    });

    const res = await GET(makeRequest("token"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=purchase-not-paid");
  });
});

describe("GET /api/auth/activate — new user flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(verifyActivationToken).mockResolvedValue({
      purchaseId: "purchase-abc",
      email: "user@test.com",
    });
    jest.mocked(purchasesRepository.findById).mockResolvedValue(BASE_PURCHASE);
    jest.mocked(purchasesRepository.activate).mockResolvedValue(undefined);
  });

  it("creates a new Firebase user when the email does not exist", async () => {
    const notFound = Object.assign(new Error("not found"), {
      code: "auth/user-not-found",
    });
    jest.mocked(adminAuth.getUserByEmail).mockRejectedValue(notFound);
    jest.mocked(adminAuth.createUser).mockResolvedValue({ uid: "new-uid" } as never);
    jest.mocked(adminAuth.generatePasswordResetLink).mockResolvedValue(
      "https://firebase.example.com/__/auth/action?mode=resetPassword&oobCode=abc123"
    );
    setupFirestoreChain();

    const res = await GET(makeRequest("token"));

    expect(adminAuth.createUser).toHaveBeenCalledWith({ email: "user@test.com" });
    expect(purchasesRepository.activate).toHaveBeenCalledWith("purchase-abc", "new-uid");
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/set-password");
    expect(res.headers.get("location")).toContain("oobCode=abc123");
    expect(res.headers.get("location")).toContain("mode=activation");
  });

  it("creates Firestore user profile when it does not exist", async () => {
    const notFound = Object.assign(new Error("not found"), {
      code: "auth/user-not-found",
    });
    jest.mocked(adminAuth.getUserByEmail).mockRejectedValue(notFound);
    jest.mocked(adminAuth.createUser).mockResolvedValue({ uid: "new-uid" } as never);
    jest.mocked(adminAuth.generatePasswordResetLink).mockResolvedValue(
      "https://firebase.example.com/__/auth/action?oobCode=xyz"
    );

    const { mockSet, mockGet } = setupFirestoreChain();
    mockGet.mockResolvedValue({ exists: false });

    await GET(makeRequest("token"));

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ uid: "new-uid", email: "user@test.com", hasSeenWelcome: false })
    );
  });

  it("redirects to /?error=auth-error when createUser fails", async () => {
    const notFound = Object.assign(new Error("not found"), {
      code: "auth/user-not-found",
    });
    jest.mocked(adminAuth.getUserByEmail).mockRejectedValue(notFound);
    jest.mocked(adminAuth.createUser).mockRejectedValue(new Error("create failed"));

    const res = await GET(makeRequest("token"));
    expect(res.headers.get("location")).toContain("error=auth-error");
  });
});

describe("GET /api/auth/activate — existing user flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(verifyActivationToken).mockResolvedValue({
      purchaseId: "purchase-abc",
      email: "user@test.com",
    });
    jest.mocked(purchasesRepository.findById).mockResolvedValue(BASE_PURCHASE);
    jest.mocked(purchasesRepository.activate).mockResolvedValue(undefined);
    jest.mocked(adminAuth.getUserByEmail).mockResolvedValue({ uid: "existing-uid" } as never);
    setupFirestoreChain();
  });

  it("redirects to /set-password with firstTime=false for existing users", async () => {
    const res = await GET(makeRequest("token"));

    expect(adminAuth.createUser).not.toHaveBeenCalled();
    expect(adminAuth.generatePasswordResetLink).not.toHaveBeenCalled();
    expect(res.status).toBe(307);
    const location = res.headers.get("location") ?? "";
    expect(location).toContain("/set-password");
    expect(location).toContain("firstTime=false");
    expect(location).toContain("mode=activation");
    expect(location).not.toContain("oobCode");
  });

  it("activates purchase with the existing user's uid", async () => {
    await GET(makeRequest("token"));

    expect(purchasesRepository.activate).toHaveBeenCalledWith("purchase-abc", "existing-uid");
  });
});
