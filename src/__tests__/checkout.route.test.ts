import { NextRequest } from "next/server";
import { POST } from "@/app/api/checkout/route";
import { purchasesRepository } from "@/lib/firebase/repositories/purchases.repository";
import { adminDb } from "@/lib/firebase/admin";

// ── Stripe mock ────────────────────────────────────────────────────────────────
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn(),
        update: jest.fn(),
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
  },
}));

// ── adminDb mock ───────────────────────────────────────────────────────────────
const mockDocUpdate = jest.fn();

jest.mock("@/lib/firebase/admin", () => ({
  adminDb: {
    collection: jest.fn(),
  },
}));

import Stripe from "stripe";
import { Preference } from "mercadopago";

// ── Global fetch mock (dolarapi.com) ───────────────────────────────────────────
const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockBlueRate(rate: number) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ venta: rate }),
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const getStripeInstance = () => (Stripe as unknown as jest.Mock).mock.results[0].value;

function makeRequest(body: object) {
  return new NextRequest("http://localhost:3000/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json", host: "localhost:3000" },
    body: JSON.stringify(body),
  });
}

// ──────────────────────────────────────────────────────────────────────────────

describe("POST /api/checkout — validation", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 400 when email is missing", async () => {
    const res = await POST(makeRequest({ paymentProvider: "stripe" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/email/i);
  });

  it("returns 400 when paymentProvider is missing", async () => {
    const res = await POST(makeRequest({ email: "a@b.com" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/paymentProvider/i);
  });

  it("returns 400 for an unknown paymentProvider value", async () => {
    const res = await POST(makeRequest({ email: "a@b.com", paymentProvider: "paypal" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/paymentProvider/i);
  });
});

describe("POST /api/checkout — Stripe", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = "sk_test_key";
  });

  it("creates a Stripe Checkout Session with the correct product details", async () => {
    jest.mocked(purchasesRepository.create).mockResolvedValue("purchase-id-1");

    // Stripe constructor is called in POST, so we need its instance after the call
    // Patch the mock BEFORE calling POST
    (Stripe as unknown as jest.Mock).mockImplementation(() => ({
      checkout: {
        sessions: {
          create: jest.fn().mockResolvedValue({ id: "cs_test_abc", url: "https://stripe.com/pay/abc" }),
          update: jest.fn().mockResolvedValue({}),
        },
      },
    }));

    await POST(makeRequest({ email: "user@test.com", paymentProvider: "stripe" }));

    const stripeInstance = getStripeInstance();
    expect(stripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_email: "user@test.com",
        mode: "payment",
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

  it("creates a purchase document with status 'pending' and provider 'stripe'", async () => {
    jest.mocked(purchasesRepository.create).mockResolvedValue("purchase-id-1");
    (Stripe as unknown as jest.Mock).mockImplementation(() => ({
      checkout: {
        sessions: {
          create: jest.fn().mockResolvedValue({ id: "cs_test_abc", url: "https://stripe.com/pay/abc" }),
          update: jest.fn().mockResolvedValue({}),
        },
      },
    }));

    await POST(makeRequest({ email: "user@test.com", paymentProvider: "stripe" }));

    expect(purchasesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "user@test.com",
        provider: "stripe",
        status: "pending",
        amount: 120,
        currency: "USD",
      })
    );
  });

  it("patches session metadata with the generated purchaseId", async () => {
    jest.mocked(purchasesRepository.create).mockResolvedValue("purchase-id-1");
    const mockUpdate = jest.fn().mockResolvedValue({});
    (Stripe as unknown as jest.Mock).mockImplementation(() => ({
      checkout: {
        sessions: {
          create: jest.fn().mockResolvedValue({ id: "cs_test_abc", url: "https://stripe.com/pay/abc" }),
          update: mockUpdate,
        },
      },
    }));

    await POST(makeRequest({ email: "user@test.com", paymentProvider: "stripe" }));

    expect(mockUpdate).toHaveBeenCalledWith("cs_test_abc", {
      metadata: { purchaseId: "purchase-id-1" },
    });
  });

  it("returns the Stripe session URL as redirectUrl", async () => {
    jest.mocked(purchasesRepository.create).mockResolvedValue("purchase-id-1");
    (Stripe as unknown as jest.Mock).mockImplementation(() => ({
      checkout: {
        sessions: {
          create: jest.fn().mockResolvedValue({ id: "cs_test_abc", url: "https://stripe.com/pay/abc" }),
          update: jest.fn().mockResolvedValue({}),
        },
      },
    }));

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
    // @ts-expect-error NODE_ENV is readonly but needs to be overridden in tests
    process.env.NODE_ENV = "test";
  });

  it("creates a purchase document before the MP preference (to use as external_reference)", async () => {
    mockBlueRate(1450);
    jest.mocked(purchasesRepository.create).mockResolvedValue("purchase-id-mp");
    (Preference as unknown as jest.Mock).mockImplementation(() => ({
      create: jest.fn().mockResolvedValue({
        id: "pref_123",
        init_point: "https://mp.com/pay",
        sandbox_init_point: "https://sandbox.mp.com/pay",
      }),
    }));
    (adminDb.collection as jest.Mock).mockReturnValue({
      doc: jest.fn().mockReturnValue({ update: mockDocUpdate }),
    });
    mockDocUpdate.mockResolvedValue(undefined);

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
    jest.mocked(purchasesRepository.create).mockResolvedValue("purchase-id-mp");
    const mockPrefCreate = jest.fn().mockResolvedValue({
      id: "pref_123",
      init_point: "https://mp.com/pay",
      sandbox_init_point: "https://sandbox.mp.com/pay",
    });
    (Preference as unknown as jest.Mock).mockImplementation(() => ({
      create: mockPrefCreate,
    }));
    (adminDb.collection as jest.Mock).mockReturnValue({
      doc: jest.fn().mockReturnValue({ update: mockDocUpdate }),
    });
    mockDocUpdate.mockResolvedValue(undefined);

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
    jest.mocked(purchasesRepository.create).mockResolvedValue("purchase-id-mp");
    (Preference as unknown as jest.Mock).mockImplementation(() => ({
      create: jest.fn().mockResolvedValue({
        id: "pref_123",
        init_point: "https://mp.com/pay",
        sandbox_init_point: "https://sandbox.mp.com/pay",
      }),
    }));
    (adminDb.collection as jest.Mock).mockReturnValue({
      doc: jest.fn().mockReturnValue({ update: mockDocUpdate }),
    });
    mockDocUpdate.mockResolvedValue(undefined);

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
    jest.mocked(purchasesRepository.create).mockResolvedValue("purchase-id-mp");
    (Preference as unknown as jest.Mock).mockImplementation(() => ({
      create: jest.fn().mockResolvedValue({
        id: "pref_123",
        init_point: "https://mp.com/pay",
        sandbox_init_point: "https://sandbox.mp.com/pay",
      }),
    }));
    (adminDb.collection as jest.Mock).mockReturnValue({
      doc: jest.fn().mockReturnValue({ update: mockDocUpdate }),
    });
    mockDocUpdate.mockResolvedValue(undefined);

    await POST(makeRequest({ email: "user@test.com", paymentProvider: "mercadopago" }));

    expect(mockDocUpdate).toHaveBeenCalledWith({ paymentId: "pref_123" });
  });

  it("returns sandbox_init_point as redirectUrl in non-production", async () => {
    mockBlueRate(1450);
    jest.mocked(purchasesRepository.create).mockResolvedValue("purchase-id-mp");
    (Preference as unknown as jest.Mock).mockImplementation(() => ({
      create: jest.fn().mockResolvedValue({
        id: "pref_123",
        init_point: "https://mp.com/pay",
        sandbox_init_point: "https://sandbox.mp.com/pay",
      }),
    }));
    (adminDb.collection as jest.Mock).mockReturnValue({
      doc: jest.fn().mockReturnValue({ update: mockDocUpdate }),
    });
    mockDocUpdate.mockResolvedValue(undefined);

    const res = await POST(makeRequest({ email: "user@test.com", paymentProvider: "mercadopago" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.redirectUrl).toBe("https://sandbox.mp.com/pay");
  });

  it("omits auto_return when back_urls point to localhost", async () => {
    mockBlueRate(1450);
    jest.mocked(purchasesRepository.create).mockResolvedValue("purchase-id-mp");
    const mockPrefCreate = jest.fn().mockResolvedValue({
      id: "pref_123",
      init_point: "https://mp.com/pay",
      sandbox_init_point: "https://sandbox.mp.com/pay",
    });
    (Preference as unknown as jest.Mock).mockImplementation(() => ({
      create: mockPrefCreate,
    }));
    (adminDb.collection as jest.Mock).mockReturnValue({
      doc: jest.fn().mockReturnValue({ update: mockDocUpdate }),
    });
    mockDocUpdate.mockResolvedValue(undefined);

    await POST(makeRequest({ email: "user@test.com", paymentProvider: "mercadopago" }));

    const callBody = mockPrefCreate.mock.calls[0][0].body;
    expect(callBody).not.toHaveProperty("auto_return");
  });

  it("includes auto_return: 'approved' when MERCADOPAGO_NOTIFICATION_URL is a public URL", async () => {
    process.env.MERCADOPAGO_NOTIFICATION_URL =
      "https://my-app.vercel.app/api/webhooks/mercadopago";
    mockBlueRate(1450);
    jest.mocked(purchasesRepository.create).mockResolvedValue("purchase-id-mp");
    const mockPrefCreate = jest.fn().mockResolvedValue({
      id: "pref_123",
      init_point: "https://mp.com/pay",
      sandbox_init_point: "https://sandbox.mp.com/pay",
    });
    (Preference as unknown as jest.Mock).mockImplementation(() => ({
      create: mockPrefCreate,
    }));
    (adminDb.collection as jest.Mock).mockReturnValue({
      doc: jest.fn().mockReturnValue({ update: mockDocUpdate }),
    });
    mockDocUpdate.mockResolvedValue(undefined);

    await POST(makeRequest({ email: "user@test.com", paymentProvider: "mercadopago" }));

    const callBody = mockPrefCreate.mock.calls[0][0].body;
    expect(callBody.auto_return).toBe("approved");

    delete process.env.MERCADOPAGO_NOTIFICATION_URL;
  });

  it("uses MERCADOPAGO_NOTIFICATION_URL origin for back_urls when set", async () => {
    process.env.MERCADOPAGO_NOTIFICATION_URL =
      "https://my-app.vercel.app/api/webhooks/mercadopago";
    mockBlueRate(1450);
    jest.mocked(purchasesRepository.create).mockResolvedValue("purchase-id-mp");
    const mockPrefCreate = jest.fn().mockResolvedValue({
      id: "pref_123",
      init_point: "https://mp.com/pay",
      sandbox_init_point: "https://sandbox.mp.com/pay",
    });
    (Preference as unknown as jest.Mock).mockImplementation(() => ({
      create: mockPrefCreate,
    }));
    (adminDb.collection as jest.Mock).mockReturnValue({
      doc: jest.fn().mockReturnValue({ update: mockDocUpdate }),
    });
    mockDocUpdate.mockResolvedValue(undefined);

    await POST(makeRequest({ email: "user@test.com", paymentProvider: "mercadopago" }));

    const callBody = mockPrefCreate.mock.calls[0][0].body;
    expect(callBody.back_urls.success).toBe("https://my-app.vercel.app/checkout/success");
    expect(callBody.back_urls.failure).toBe("https://my-app.vercel.app/checkout/cancel");

    delete process.env.MERCADOPAGO_NOTIFICATION_URL;
  });
});

describe("POST /api/checkout — error handling", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 500 when Stripe throws an unexpected error", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_key";
    (Stripe as unknown as jest.Mock).mockImplementation(() => ({
      checkout: {
        sessions: {
          create: jest.fn().mockRejectedValue(new Error("Stripe network error")),
          update: jest.fn(),
        },
      },
    }));

    const res = await POST(makeRequest({ email: "a@b.com", paymentProvider: "stripe" }));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns 500 when dolarapi.com returns a non-ok response", async () => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST-token";
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });

    const res = await POST(makeRequest({ email: "a@b.com", paymentProvider: "mercadopago" }));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns 500 when dolarapi.com fetch throws a network error", async () => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST-token";
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const res = await POST(makeRequest({ email: "a@b.com", paymentProvider: "mercadopago" }));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
