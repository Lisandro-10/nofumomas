import { NextRequest } from "next/server";
import { POST } from "@/app/api/webhooks/stripe/route";
import { purchasesRepository } from "@/lib/firebase/repositories/purchases.repository";

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: { constructEvent: jest.fn() },
  }));
});

jest.mock("@/lib/firebase/repositories/purchases.repository", () => ({
  purchasesRepository: {
    updateStatus: jest.fn(),
    findById: jest.fn(),
  },
}));

jest.mock("@/lib/email/activation-token", () => ({
  signActivationToken: jest.fn().mockResolvedValue("mock-token"),
}));

jest.mock("@/lib/email/brevo.service", () => ({
  sendActivationEmail: jest.fn().mockResolvedValue(undefined),
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

import Stripe from "stripe";
import { sendActivationEmail } from "@/lib/email/brevo.service";

function makeRequest(rawBody: string, sig = "valid-sig") {
  return new NextRequest("http://localhost:3000/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": sig },
    body: rawBody,
  });
}

function makeEvent(type: string, data: Record<string, unknown> = {}) {
  return { type, data: { object: data } };
}

function mockStripe(event: object) {
  (Stripe as unknown as jest.Mock).mockImplementation(() => ({
    webhooks: { constructEvent: jest.fn().mockReturnValue(event) },
  }));
}

// ──────────────────────────────────────────────────────────────────────────────

describe("POST /api/webhooks/stripe — signature verification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = "sk_test_key";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
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
    expect(body.title).toBe("Invalid signature");
  });
});

describe("POST /api/webhooks/stripe — checkout.session.completed", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = "sk_test_key";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    jest.mocked(purchasesRepository.updateStatus).mockResolvedValue(undefined);
  });

  it("calls updateStatus('paid') with the purchaseId from session metadata", async () => {
    jest.mocked(purchasesRepository.findById).mockResolvedValue(null);
    mockStripe(makeEvent("checkout.session.completed", { metadata: { purchaseId: "purchase-abc" } }));

    const res = await POST(makeRequest("{}"));

    expect(purchasesRepository.updateStatus).toHaveBeenCalledWith("purchase-abc", "paid");
    expect(res.status).toBe(200);
  });

  it("sends activation email when purchase has an email", async () => {
    jest.mocked(purchasesRepository.findById).mockResolvedValue({
      id: "purchase-abc",
      email: "user@test.com",
      provider: "stripe",
      paymentId: "cs_test",
      status: "paid",
      amount: 120,
      currency: "USD",
    });
    mockStripe(makeEvent("checkout.session.completed", { metadata: { purchaseId: "purchase-abc" } }));

    await POST(makeRequest("{}"));

    expect(purchasesRepository.findById).toHaveBeenCalledWith("purchase-abc");
    expect(sendActivationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "user@test.com" })
    );
  });

  it("does not send email when purchase has no email", async () => {
    jest.mocked(purchasesRepository.findById).mockResolvedValue(null);
    mockStripe(makeEvent("checkout.session.completed", { metadata: { purchaseId: "purchase-abc" } }));

    await POST(makeRequest("{}"));

    expect(sendActivationEmail).not.toHaveBeenCalled();
  });

  it("does not call updateStatus when purchaseId is absent from metadata", async () => {
    mockStripe(makeEvent("checkout.session.completed", { metadata: {} }));

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
    mockStripe(makeEvent("checkout.session.expired", { metadata: { purchaseId: "purchase-xyz" } }));

    const res = await POST(makeRequest("{}"));

    expect(purchasesRepository.updateStatus).toHaveBeenCalledWith("purchase-xyz", "cancelled");
    expect(res.status).toBe(200);
  });

  it("does not call updateStatus when purchaseId is absent from metadata", async () => {
    mockStripe(makeEvent("checkout.session.expired", { metadata: {} }));

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
    mockStripe({ type: "payment_intent.created", data: { object: {} } });

    const res = await POST(makeRequest("{}"));
    const body = await res.json();

    expect(purchasesRepository.updateStatus).not.toHaveBeenCalled();
    expect(body).toEqual({ received: true });
    expect(res.status).toBe(200);
  });
});
