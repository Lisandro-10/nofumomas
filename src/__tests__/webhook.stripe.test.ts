import { NextRequest } from "next/server";
import { POST } from "@/app/api/webhooks/stripe/route";
import { purchasesRepository } from "@/lib/firebase/repositories/purchases.repository";

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: jest.fn(),
    },
  }));
});

jest.mock("@/lib/firebase/repositories/purchases.repository", () => ({
  purchasesRepository: {
    updateStatus: jest.fn(),
  },
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

import Stripe from "stripe";

function makeRequest(rawBody: string, sig = "valid-sig") {
  return new NextRequest("http://localhost:3000/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": sig },
    body: rawBody,
  });
}

function makeEvent(type: string, metadata: Record<string, string> = {}) {
  return { type, data: { object: { metadata } } };
}

// ──────────────────────────────────────────────────────────────────────────────

describe("POST /api/webhooks/stripe — signature verification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = "sk_test_key";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    (Stripe as unknown as jest.Mock).mockImplementation(() => ({
      webhooks: { constructEvent: jest.fn() },
    }));
  });

  it("returns 400 when the Stripe signature is invalid", async () => {
    (Stripe as unknown as jest.Mock).mockImplementation(() => ({
      webhooks: {
        constructEvent: jest.fn().mockImplementation(() => {
          throw new Error("Invalid signature");
        }),
      },
    }));

    const res = await POST(makeRequest("{}"));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid signature");
  });
});

describe("POST /api/webhooks/stripe — checkout.session.completed", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = "sk_test_key";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    jest.mocked(purchasesRepository.updateStatus).mockResolvedValue(undefined);
  });

  it("calls updateStatus('paid') with the purchaseId from session metadata", async () => {
    (Stripe as unknown as jest.Mock).mockImplementation(() => ({
      webhooks: {
        constructEvent: jest.fn().mockReturnValue(
          makeEvent("checkout.session.completed", { purchaseId: "purchase-abc" })
        ),
      },
    }));

    const res = await POST(makeRequest("{}"));

    expect(purchasesRepository.updateStatus).toHaveBeenCalledWith("purchase-abc", "paid");
    expect(res.status).toBe(200);
  });

  it("does not call updateStatus when purchaseId is absent from metadata", async () => {
    (Stripe as unknown as jest.Mock).mockImplementation(() => ({
      webhooks: {
        constructEvent: jest.fn().mockReturnValue(
          makeEvent("checkout.session.completed", {})
        ),
      },
    }));

    await POST(makeRequest("{}"));

    expect(purchasesRepository.updateStatus).not.toHaveBeenCalled();
  });
});

describe("POST /api/webhooks/stripe — checkout.session.expired", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = "sk_test_key";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    jest.mocked(purchasesRepository.updateStatus).mockResolvedValue(undefined);
  });

  it("calls updateStatus('cancelled') with the purchaseId from session metadata", async () => {
    (Stripe as unknown as jest.Mock).mockImplementation(() => ({
      webhooks: {
        constructEvent: jest.fn().mockReturnValue(
          makeEvent("checkout.session.expired", { purchaseId: "purchase-xyz" })
        ),
      },
    }));

    const res = await POST(makeRequest("{}"));

    expect(purchasesRepository.updateStatus).toHaveBeenCalledWith("purchase-xyz", "cancelled");
    expect(res.status).toBe(200);
  });

  it("does not call updateStatus when purchaseId is absent from metadata", async () => {
    (Stripe as unknown as jest.Mock).mockImplementation(() => ({
      webhooks: {
        constructEvent: jest.fn().mockReturnValue(
          makeEvent("checkout.session.expired", {})
        ),
      },
    }));

    await POST(makeRequest("{}"));

    expect(purchasesRepository.updateStatus).not.toHaveBeenCalled();
  });
});

describe("POST /api/webhooks/stripe — unhandled event types", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = "sk_test_key";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  });

  it("returns { received: true } without calling updateStatus for unhandled events", async () => {
    (Stripe as unknown as jest.Mock).mockImplementation(() => ({
      webhooks: {
        constructEvent: jest.fn().mockReturnValue(makeEvent("payment_intent.created")),
      },
    }));

    const res = await POST(makeRequest("{}"));
    const body = await res.json();

    expect(purchasesRepository.updateStatus).not.toHaveBeenCalled();
    expect(body).toEqual({ received: true });
    expect(res.status).toBe(200);
  });
});
