import { NextRequest } from "next/server";
import { POST } from "@/app/api/checkout/route";
import { purchasesRepository } from "@/lib/firebase/repositories/purchases.repository";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

// ── Stripe mock ────────────────────────────────────────────────────────────────
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
  }));
});

// ── MercadoPago mock ───────────────────────────────────────────────────────────
jest.mock("mercadopago", () => ({
  MercadoPagoConfig: jest.fn(),
  Preference: jest.fn().mockImplementation(() => ({
    create: jest.fn(),
  })),
}));

// ── purchasesRepository mock ───────────────────────────────────────────────────
jest.mock("@/lib/firebase/repositories/purchases.repository", () => ({
  purchasesRepository: {
    create: jest.fn(),
    findPaidByEmail: jest.fn(),
  },
}));

// ── adminAuth + adminDb mock ───────────────────────────────────────────────────
const mockDocUpdate = jest.fn();

jest.mock("@/lib/firebase/admin", () => ({
  adminAuth: {
    getUserByEmail: jest.fn(),
  },
  adminDb: {
    collection: jest.fn(),
  },
}));

/** Simulates the happy-path auth check: user not found → proceed to payment */
function mockAuthUserNotFound() {
  const err = Object.assign(new Error("auth/user-not-found"), {
    code: "auth/user-not-found",
  });
  jest.mocked(adminAuth.getUserByEmail).mockRejectedValue(err);
}

import Stripe from "stripe";
import { Preference } from "mercadopago";

// ── Global fetch mock (Turnstile + dolarapi.com) ──────────────────────────────
const mockFetch = jest.fn();
global.fetch = mockFetch;

/** Turnstile always passes; no dolarapi mock (use for Stripe tests). */
function mockTurnstileSuccess() {
  mockFetch.mockImplementation((url: string) => {
    if (url.includes("challenges.cloudflare.com")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
    }
    return Promise.reject(new Error(`Unexpected fetch to: ${url}`));
  });
}

/** Turnstile passes + dolarapi returns the given rate (use for MercadoPago tests). */
function mockBlueRate(rate: number) {
  mockFetch.mockImplementation((url: string) => {
    if (url.includes("challenges.cloudflare.com")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
    }
    if (url.includes("dolarapi.com")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ venta: rate }) });
    }
    return Promise.reject(new Error(`Unexpected fetch to: ${url}`));
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const getStripeInstance = () => (Stripe as unknown as jest.Mock).mock.results[0].value;

function makeRequest(body: object) {
  return new NextRequest("http://localhost:3000/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json", host: "localhost:3000" },
    body: JSON.stringify({ turnstileToken: "valid-token", ...body }),
  });
}

function setupAdminDbChain() {
  (adminDb.collection as jest.Mock).mockReturnValue({
    doc: jest.fn().mockReturnValue({ update: mockDocUpdate }),
  });
  mockDocUpdate.mockResolvedValue(undefined);
}

// ──────────────────────────────────────────────────────────────────────────────

describe("POST /api/checkout — validation", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 400 when email is missing", async () => {
    const res = await POST(makeRequest({ paymentProvider: "stripe" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.title).toMatch(/email/i);
  });

  it("returns 400 when paymentProvider is missing", async () => {
    const res = await POST(makeRequest({ email: "a@b.com" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.title).toMatch(/paymentProvider/i);
  });

  it("returns 400 for an unknown paymentProvider value", async () => {
    const res = await POST(makeRequest({ email: "a@b.com", paymentProvider: "paypal" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.title).toMatch(/paymentProvider/i);
  });
});

describe("POST /api/checkout — Stripe", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = "sk_test_key";
    mockAuthUserNotFound();
    mockTurnstileSuccess();
    jest.mocked(purchasesRepository.findPaidByEmail).mockResolvedValue(null);
    setupAdminDbChain();
    jest.mocked(purchasesRepository.create).mockResolvedValue("purchase-id-1");
    (Stripe as unknown as jest.Mock).mockImplementation(() => ({
      checkout: {
        sessions: {
          create: jest.fn().mockResolvedValue({
            id: "cs_test_abc",
            url: "https://stripe.com/pay/abc",
          }),
        },
      },
    }));
  });

  it("creates the purchase document before the Stripe session", async () => {
    const callOrder: string[] = [];
    jest.mocked(purchasesRepository.create).mockImplementation(async () => {
      callOrder.push("create");
      return "purchase-id-1";
    });
    const stripeSessionCreate = jest.fn().mockImplementation(async () => {
      callOrder.push("session");
      return { id: "cs_test_abc", url: "https://stripe.com/pay/abc" };
    });
    (Stripe as unknown as jest.Mock).mockImplementation(() => ({
      checkout: { sessions: { create: stripeSessionCreate } },
    }));

    await POST(makeRequest({ email: "user@test.com", paymentProvider: "stripe" }));

    expect(callOrder).toEqual(["create", "session"]);
  });

  it("creates a purchase document with status 'pending', provider 'stripe', and placeholder paymentId", async () => {
    await POST(makeRequest({ email: "user@test.com", paymentProvider: "stripe" }));

    expect(purchasesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "user@test.com",
        provider: "stripe",
        status: "pending",
        paymentId: "pending_stripe",
        amount: 120,
        currency: "USD",
      })
    );
  });

  it("creates a Stripe session with the correct product details and inline purchaseId metadata", async () => {
    await POST(makeRequest({ email: "user@test.com", paymentProvider: "stripe" }));

    const stripeInstance = getStripeInstance();
    expect(stripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_email: "user@test.com",
        mode: "payment",
        metadata: { purchaseId: "purchase-id-1" },
        line_items: expect.arrayContaining([
          expect.objectContaining({
            price_data: expect.objectContaining({
              currency: "usd",
              unit_amount: 12000,
            }),
          }),
        ]),
      })
    );
  });

  it("success_url points to /checkout/success without extra params", async () => {
    await POST(makeRequest({ email: "user@test.com", paymentProvider: "stripe" }));

    const stripeInstance = getStripeInstance();
    const createCall = stripeInstance.checkout.sessions.create.mock.calls[0][0];
    expect(createCall.success_url).toMatch(/\/checkout\/success$/);
  });

  it("updates the purchase doc with the real Stripe session id", async () => {
    await POST(makeRequest({ email: "user@test.com", paymentProvider: "stripe" }));

    expect(mockDocUpdate).toHaveBeenCalledWith({ paymentId: "cs_test_abc" });
  });

  it("returns the Stripe session URL as redirectUrl", async () => {
    const res = await POST(makeRequest({ email: "user@test.com", paymentProvider: "stripe" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.redirectUrl).toBe("https://stripe.com/pay/abc");
  });
});

describe("POST /api/checkout — MercadoPago", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST-token";
    delete process.env.MERCADOPAGO_NOTIFICATION_URL;
    mockAuthUserNotFound();
    jest.mocked(purchasesRepository.findPaidByEmail).mockResolvedValue(null);
    setupAdminDbChain();
    jest.mocked(purchasesRepository.create).mockResolvedValue("purchase-id-mp");
  });

  it("creates a purchase document before the MP preference (to use as external_reference)", async () => {
    mockBlueRate(1450);
    (Preference as unknown as jest.Mock).mockImplementation(() => ({
      create: jest.fn().mockResolvedValue({
        id: "pref_123",
        init_point: "https://mp.com/pay",
        sandbox_init_point: "https://sandbox.mp.com/pay",
      }),
    }));

    await POST(makeRequest({ email: "user@test.com", paymentProvider: "mercadopago" }));

    expect(purchasesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "user@test.com",
        provider: "mercadopago",
        status: "pending",
      })
    );
  });

  it("creates a MP preference with currency_id ARS and unit_price calculated from blue rate", async () => {
    mockBlueRate(1450);
    const mockPrefCreate = jest.fn().mockResolvedValue({
      id: "pref_123",
      init_point: "https://mp.com/pay",
      sandbox_init_point: "https://sandbox.mp.com/pay",
    });
    (Preference as unknown as jest.Mock).mockImplementation(() => ({
      create: mockPrefCreate,
    }));

    await POST(makeRequest({ email: "user@test.com", paymentProvider: "mercadopago" }));

    expect(mockPrefCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              currency_id: "ARS",
              unit_price: 120 * 1450,
            }),
          ]),
          external_reference: "purchase-id-mp",
          payer: { email: "user@test.com" },
        }),
      })
    );
  });

  it("stores amountArs and exchangeRate in the purchase document", async () => {
    mockBlueRate(1450);
    (Preference as unknown as jest.Mock).mockImplementation(() => ({
      create: jest.fn().mockResolvedValue({
        id: "pref_123",
        init_point: "https://mp.com/pay",
        sandbox_init_point: "https://sandbox.mp.com/pay",
      }),
    }));

    await POST(makeRequest({ email: "user@test.com", paymentProvider: "mercadopago" }));

    expect(purchasesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amountArs: 120 * 1450,
        exchangeRate: 1450,
        currency: "ARS",
      })
    );
  });

  it("patches the purchase doc with the real preference ID", async () => {
    mockBlueRate(1450);
    (Preference as unknown as jest.Mock).mockImplementation(() => ({
      create: jest.fn().mockResolvedValue({
        id: "pref_123",
        init_point: "https://mp.com/pay",
        sandbox_init_point: "https://sandbox.mp.com/pay",
      }),
    }));

    await POST(makeRequest({ email: "user@test.com", paymentProvider: "mercadopago" }));

    expect(mockDocUpdate).toHaveBeenCalledWith({ paymentId: "pref_123" });
  });

  it("returns init_point as redirectUrl", async () => {
    mockBlueRate(1450);
    (Preference as unknown as jest.Mock).mockImplementation(() => ({
      create: jest.fn().mockResolvedValue({
        id: "pref_123",
        init_point: "https://mp.com/pay",
        sandbox_init_point: "https://sandbox.mp.com/pay",
      }),
    }));

    const res = await POST(makeRequest({ email: "user@test.com", paymentProvider: "mercadopago" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.redirectUrl).toBe("https://mp.com/pay");
  });

  it("omits auto_return when back_urls point to localhost", async () => {
    mockBlueRate(1450);
    const mockPrefCreate = jest.fn().mockResolvedValue({
      id: "pref_123",
      init_point: "https://mp.com/pay",
      sandbox_init_point: "https://sandbox.mp.com/pay",
    });
    (Preference as unknown as jest.Mock).mockImplementation(() => ({
      create: mockPrefCreate,
    }));

    await POST(makeRequest({ email: "user@test.com", paymentProvider: "mercadopago" }));

    const callBody = mockPrefCreate.mock.calls[0][0].body;
    expect(callBody).not.toHaveProperty("auto_return");
  });

  it("includes auto_return: 'approved' when MERCADOPAGO_NOTIFICATION_URL is a public URL", async () => {
    process.env.MERCADOPAGO_NOTIFICATION_URL =
      "https://my-app.vercel.app/api/webhooks/mercadopago";
    mockBlueRate(1450);
    const mockPrefCreate = jest.fn().mockResolvedValue({
      id: "pref_123",
      init_point: "https://mp.com/pay",
      sandbox_init_point: "https://sandbox.mp.com/pay",
    });
    (Preference as unknown as jest.Mock).mockImplementation(() => ({
      create: mockPrefCreate,
    }));

    await POST(makeRequest({ email: "user@test.com", paymentProvider: "mercadopago" }));

    const callBody = mockPrefCreate.mock.calls[0][0].body;
    expect(callBody.auto_return).toBe("approved");
  });

  it("uses MERCADOPAGO_NOTIFICATION_URL origin for back_urls when set", async () => {
    process.env.MERCADOPAGO_NOTIFICATION_URL =
      "https://my-app.vercel.app/api/webhooks/mercadopago";
    mockBlueRate(1450);
    const mockPrefCreate = jest.fn().mockResolvedValue({
      id: "pref_123",
      init_point: "https://mp.com/pay",
      sandbox_init_point: "https://sandbox.mp.com/pay",
    });
    (Preference as unknown as jest.Mock).mockImplementation(() => ({
      create: mockPrefCreate,
    }));

    await POST(makeRequest({ email: "user@test.com", paymentProvider: "mercadopago" }));

    const callBody = mockPrefCreate.mock.calls[0][0].body;
    expect(callBody.back_urls.success).toBe("https://my-app.vercel.app/checkout/success");
    expect(callBody.back_urls.failure).toBe("https://my-app.vercel.app/checkout/cancel");
    expect(callBody.back_urls.pending).toBe("https://my-app.vercel.app/checkout/pending");
  });

  it("back_urls.pending points to /checkout/pending (separate from success)", async () => {
    mockBlueRate(1450);
    const mockPrefCreate = jest.fn().mockResolvedValue({
      id: "pref_123",
      init_point: "https://mp.com/pay",
      sandbox_init_point: "https://sandbox.mp.com/pay",
    });
    (Preference as unknown as jest.Mock).mockImplementation(() => ({
      create: mockPrefCreate,
    }));

    await POST(makeRequest({ email: "user@test.com", paymentProvider: "mercadopago" }));

    const { back_urls } = mockPrefCreate.mock.calls[0][0].body;
    expect(back_urls.success).toMatch(/\/checkout\/success$/);
    expect(back_urls.pending).toMatch(/\/checkout\/pending$/);
    expect(back_urls.pending).not.toBe(back_urls.success);
  });
});

describe("POST /api/checkout — error handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthUserNotFound();
    jest.mocked(purchasesRepository.findPaidByEmail).mockResolvedValue(null);
  });

  it("returns 500 when Stripe throws an unexpected error", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_key";
    mockTurnstileSuccess();
    jest.mocked(purchasesRepository.create).mockResolvedValue("purchase-id-1");
    setupAdminDbChain();
    (Stripe as unknown as jest.Mock).mockImplementation(() => ({
      checkout: {
        sessions: {
          create: jest.fn().mockRejectedValue(new Error("Stripe network error")),
        },
      },
    }));

    const res = await POST(makeRequest({ email: "a@b.com", paymentProvider: "stripe" }));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.title).toBeDefined();
  });

  it("returns 500 when dolarapi.com returns a non-ok response", async () => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST-token";
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("challenges.cloudflare.com")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
      }
      return Promise.resolve({ ok: false, status: 503 });
    });

    const res = await POST(makeRequest({ email: "a@b.com", paymentProvider: "mercadopago" }));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.title).toBeDefined();
  });

  it("returns 500 when dolarapi.com fetch throws a network error", async () => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST-token";
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("challenges.cloudflare.com")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
      }
      return Promise.reject(new Error("Network error"));
    });

    const res = await POST(makeRequest({ email: "a@b.com", paymentProvider: "mercadopago" }));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.title).toBeDefined();
  });
});

describe("POST /api/checkout — Turnstile validation", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 400 when turnstileToken is missing", async () => {
    const res = await POST(
      new NextRequest("http://localhost:3000/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", host: "localhost:3000" },
        body: JSON.stringify({ email: "a@b.com", paymentProvider: "stripe" }),
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.title).toMatch(/turnstile/i);
  });

  it("returns 400 when Cloudflare returns success: false", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ success: false }) })
    );
    const res = await POST(makeRequest({ email: "a@b.com", paymentProvider: "stripe" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.title).toMatch(/turnstile/i);
  });

  it("returns 500 when Cloudflare fetch throws a network error", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    const res = await POST(makeRequest({ email: "a@b.com", paymentProvider: "stripe" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.title).toBeDefined();
  });
});
