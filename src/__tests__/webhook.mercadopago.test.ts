import { NextRequest } from "next/server";
import { POST } from "@/app/api/webhooks/mercadopago/route";
import { purchasesRepository } from "@/lib/firebase/repositories/purchases.repository";

jest.mock("mercadopago", () => ({
  MercadoPagoConfig: jest.fn(),
  Payment: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
  })),
}));

jest.mock("@/lib/firebase/repositories/purchases.repository", () => ({
  purchasesRepository: {
    updateStatus: jest.fn(),
    findById: jest.fn(),
  },
}));

jest.mock("@/lib/firebase/admin", () => ({
  adminAuth: {
    getUserByEmail: jest.fn(),
    updateUser: jest.fn(),
  },
}));

jest.mock("@/lib/email/activation-token", () => ({
  signActivationToken: jest.fn().mockResolvedValue("mock-token"),
}));

jest.mock("@/lib/email/brevo.service", () => ({
  sendActivationEmail: jest.fn().mockResolvedValue(undefined),
  sendAccountDisabledEmail: jest.fn().mockResolvedValue(undefined),
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

import { Payment } from "mercadopago";
import { adminAuth } from "@/lib/firebase/admin";
import { sendActivationEmail, sendAccountDisabledEmail } from "@/lib/email/brevo.service";

function makeRequest(body: object) {
  return new NextRequest("http://localhost:3000/api/webhooks/mercadopago", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mockPayment(status: string, extra: object = {}) {
  (Payment as unknown as jest.Mock).mockImplementation(() => ({
    get: jest.fn().mockResolvedValue({ status, external_reference: "purchase-abc", ...extra }),
  }));
}

const BASE_PURCHASE = {
  id: "purchase-abc",
  email: "user@test.com",
  provider: "mercadopago" as const,
  paymentId: "pref_123",
  status: "paid" as const,
  amount: 100,
  currency: "ARS",
};

// ──────────────────────────────────────────────────────────────────────────────

describe("POST /api/webhooks/mercadopago — ignored notifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST-token";
  });

  it("returns { received: true } without querying MP for non-payment event types", async () => {
    const res = await POST(makeRequest({ type: "merchant_order", data: { id: "123" } }));
    const body = await res.json();

    expect(Payment).not.toHaveBeenCalled();
    expect(body).toEqual({ received: true });
    expect(res.status).toBe(200);
  });

  it("returns { received: true } when the payment id is missing from the notification", async () => {
    const res = await POST(makeRequest({ type: "payment", data: {} }));
    const body = await res.json();

    expect(Payment).not.toHaveBeenCalled();
    expect(body).toEqual({ received: true });
    expect(res.status).toBe(200);
  });

  it("returns { received: true } without calling updateStatus when payment has no external_reference", async () => {
    (Payment as unknown as jest.Mock).mockImplementation(() => ({
      get: jest.fn().mockResolvedValue({ status: "approved", external_reference: null }),
    }));

    const res = await POST(makeRequest({ type: "payment", data: { id: "pay_123" } }));
    const body = await res.json();

    expect(purchasesRepository.updateStatus).not.toHaveBeenCalled();
    expect(body).toEqual({ received: true });
    expect(res.status).toBe(200);
  });
});

describe("POST /api/webhooks/mercadopago — status transitions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST-token";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    jest.mocked(purchasesRepository.updateStatus).mockResolvedValue(undefined);
    jest.mocked(purchasesRepository.findById).mockResolvedValue(null);
  });

  it("calls updateStatus('paid') and sends activation email when payment is approved", async () => {
    jest.mocked(purchasesRepository.findById).mockResolvedValue(BASE_PURCHASE);
    mockPayment("approved");

    await POST(makeRequest({ type: "payment", data: { id: "pay_approved" } }));

    expect(purchasesRepository.updateStatus).toHaveBeenCalledWith("purchase-abc", "paid");
    expect(sendActivationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "user@test.com" })
    );
  });

  it("calls updateStatus('failed') when payment status is 'rejected'", async () => {
    mockPayment("rejected");

    await POST(makeRequest({ type: "payment", data: { id: "pay_rejected" } }));

    expect(purchasesRepository.updateStatus).toHaveBeenCalledWith("purchase-abc", "failed");
  });

  it("calls updateStatus('failed') when payment status is 'cancelled'", async () => {
    mockPayment("cancelled");

    await POST(makeRequest({ type: "payment", data: { id: "pay_cancelled" } }));

    expect(purchasesRepository.updateStatus).toHaveBeenCalledWith("purchase-abc", "failed");
  });

  it("does not call updateStatus for intermediate statuses like 'in_process'", async () => {
    mockPayment("in_process");

    await POST(makeRequest({ type: "payment", data: { id: "pay_pending" } }));

    expect(purchasesRepository.updateStatus).not.toHaveBeenCalled();
  });

  it("does not call updateStatus for 'pending' status", async () => {
    mockPayment("pending");

    await POST(makeRequest({ type: "payment", data: { id: "pay_pending" } }));

    expect(purchasesRepository.updateStatus).not.toHaveBeenCalled();
  });

  it("does not call updateStatus for 'authorized' status", async () => {
    mockPayment("authorized");

    await POST(makeRequest({ type: "payment", data: { id: "pay_auth" } }));

    expect(purchasesRepository.updateStatus).not.toHaveBeenCalled();
  });
});

describe("POST /api/webhooks/mercadopago — refund and chargeback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST-token";
    jest.mocked(purchasesRepository.updateStatus).mockResolvedValue(undefined);
    jest.mocked(adminAuth.updateUser as jest.Mock).mockResolvedValue(undefined);
  });

  it("disables Firebase user and sends disabled email on 'refunded'", async () => {
    jest.mocked(purchasesRepository.findById).mockResolvedValue({
      ...BASE_PURCHASE,
      uid: "uid-123",
    });
    mockPayment("refunded");

    await POST(makeRequest({ type: "payment", data: { id: "pay_refunded" } }));

    expect(purchasesRepository.updateStatus).toHaveBeenCalledWith("purchase-abc", "refunded");
    expect(adminAuth.updateUser).toHaveBeenCalledWith("uid-123", { disabled: true });
    expect(sendAccountDisabledEmail).toHaveBeenCalledWith({ to: "user@test.com" });
  });

  it("disables Firebase user and sends disabled email on 'charged_back'", async () => {
    jest.mocked(purchasesRepository.findById).mockResolvedValue({
      ...BASE_PURCHASE,
      uid: "uid-123",
    });
    mockPayment("charged_back");

    await POST(makeRequest({ type: "payment", data: { id: "pay_chargeback" } }));

    expect(purchasesRepository.updateStatus).toHaveBeenCalledWith("purchase-abc", "charged_back");
    expect(adminAuth.updateUser).toHaveBeenCalledWith("uid-123", { disabled: true });
    expect(sendAccountDisabledEmail).toHaveBeenCalledWith({ to: "user@test.com" });
  });

  it("looks up uid by email when purchase has no uid stored", async () => {
    jest.mocked(purchasesRepository.findById).mockResolvedValue({
      ...BASE_PURCHASE,
      uid: undefined,
    });
    jest.mocked(adminAuth.getUserByEmail as jest.Mock).mockResolvedValue({ uid: "uid-via-email" });
    mockPayment("refunded");

    await POST(makeRequest({ type: "payment", data: { id: "pay_refunded" } }));

    expect(adminAuth.getUserByEmail).toHaveBeenCalledWith("user@test.com");
    expect(adminAuth.updateUser).toHaveBeenCalledWith("uid-via-email", { disabled: true });
  });

  it("still sends disabled email even when Firebase user lookup fails", async () => {
    jest.mocked(purchasesRepository.findById).mockResolvedValue({
      ...BASE_PURCHASE,
      uid: undefined,
    });
    jest.mocked(adminAuth.getUserByEmail as jest.Mock).mockRejectedValue(new Error("not found"));
    mockPayment("refunded");

    await POST(makeRequest({ type: "payment", data: { id: "pay_refunded" } }));

    expect(adminAuth.updateUser).not.toHaveBeenCalled();
    expect(sendAccountDisabledEmail).toHaveBeenCalledWith({ to: "user@test.com" });
  });
});

describe("POST /api/webhooks/mercadopago — error handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST-token";
  });

  it("returns 500 when the MP Payment.get() call throws", async () => {
    (Payment as unknown as jest.Mock).mockImplementation(() => ({
      get: jest.fn().mockRejectedValue(new Error("MP network error")),
    }));

    const res = await POST(makeRequest({ type: "payment", data: { id: "pay_err" } }));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
