import { createHmac } from "crypto";
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
  },
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

import { Payment } from "mercadopago";

const WEBHOOK_SECRET = "test-webhook-secret";

function buildSignature(dataId: string, requestId: string, ts: string): string {
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const v1 = createHmac("sha256", WEBHOOK_SECRET).update(manifest).digest("hex");
  return `ts=${ts},v1=${v1}`;
}

function makeRequest(body: object, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost:3000/api/webhooks/mercadopago", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

// ──────────────────────────────────────────────────────────────────────────────

describe("POST /api/webhooks/mercadopago — ignored notifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST-token";
    delete process.env.MERCADOPAGO_WEBHOOK_SECRET;
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

describe("POST /api/webhooks/mercadopago — signature verification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST-token";
    process.env.MERCADOPAGO_WEBHOOK_SECRET = WEBHOOK_SECRET;
    jest.mocked(purchasesRepository.updateStatus).mockResolvedValue(undefined);
  });

  it("returns 400 when x-signature header is missing", async () => {
    const res = await POST(
      makeRequest(
        { type: "payment", data: { id: "pay_123" } },
        { "x-request-id": "req-abc" }
      )
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/signature/i);
  });

  it("returns 400 when x-request-id header is missing", async () => {
    const res = await POST(
      makeRequest(
        { type: "payment", data: { id: "pay_123" } },
        { "x-signature": "ts=123,v1=abc" }
      )
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/signature/i);
  });

  it("returns 400 when the HMAC signature is invalid", async () => {
    const res = await POST(
      makeRequest(
        { type: "payment", data: { id: "pay_123" } },
        {
          "x-signature": "ts=1700000000,v1=invalidsignaturehash",
          "x-request-id": "req-abc",
        }
      )
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/signature/i);
  });

  it("proceeds normally when HMAC signature is valid", async () => {
    const dataId = "pay_valid";
    const requestId = "req-xyz";
    const ts = "1700000000";

    (Payment as unknown as jest.Mock).mockImplementation(() => ({
      get: jest.fn().mockResolvedValue({ status: "approved", external_reference: "purchase-abc" }),
    }));

    const res = await POST(
      makeRequest(
        { type: "payment", data: { id: dataId } },
        {
          "x-signature": buildSignature(dataId, requestId, ts),
          "x-request-id": requestId,
        }
      )
    );

    expect(res.status).toBe(200);
    expect(purchasesRepository.updateStatus).toHaveBeenCalledWith("purchase-abc", "paid");
  });

  it("skips signature verification when MERCADOPAGO_WEBHOOK_SECRET is not set", async () => {
    delete process.env.MERCADOPAGO_WEBHOOK_SECRET;

    (Payment as unknown as jest.Mock).mockImplementation(() => ({
      get: jest.fn().mockResolvedValue({ status: "approved", external_reference: "purchase-abc" }),
    }));

    // No signature headers — should still work
    const res = await POST(makeRequest({ type: "payment", data: { id: "pay_123" } }));

    expect(res.status).toBe(200);
    expect(purchasesRepository.updateStatus).toHaveBeenCalledWith("purchase-abc", "paid");
  });
});

describe("POST /api/webhooks/mercadopago — status transitions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST-token";
    delete process.env.MERCADOPAGO_WEBHOOK_SECRET;
    jest.mocked(purchasesRepository.updateStatus).mockResolvedValue(undefined);
  });

  it("calls updateStatus('paid') when payment status is 'approved'", async () => {
    (Payment as unknown as jest.Mock).mockImplementation(() => ({
      get: jest.fn().mockResolvedValue({ status: "approved", external_reference: "purchase-abc" }),
    }));

    await POST(makeRequest({ type: "payment", data: { id: "pay_approved" } }));

    expect(purchasesRepository.updateStatus).toHaveBeenCalledWith("purchase-abc", "paid");
  });

  it("calls updateStatus('failed') when payment status is 'rejected'", async () => {
    (Payment as unknown as jest.Mock).mockImplementation(() => ({
      get: jest.fn().mockResolvedValue({ status: "rejected", external_reference: "purchase-abc" }),
    }));

    await POST(makeRequest({ type: "payment", data: { id: "pay_rejected" } }));

    expect(purchasesRepository.updateStatus).toHaveBeenCalledWith("purchase-abc", "failed");
  });

  it("calls updateStatus('failed') when payment status is 'cancelled'", async () => {
    (Payment as unknown as jest.Mock).mockImplementation(() => ({
      get: jest.fn().mockResolvedValue({ status: "cancelled", external_reference: "purchase-abc" }),
    }));

    await POST(makeRequest({ type: "payment", data: { id: "pay_cancelled" } }));

    expect(purchasesRepository.updateStatus).toHaveBeenCalledWith("purchase-abc", "failed");
  });

  it("does not call updateStatus for intermediate statuses like 'in_process'", async () => {
    (Payment as unknown as jest.Mock).mockImplementation(() => ({
      get: jest.fn().mockResolvedValue({ status: "in_process", external_reference: "purchase-abc" }),
    }));

    await POST(makeRequest({ type: "payment", data: { id: "pay_pending" } }));

    expect(purchasesRepository.updateStatus).not.toHaveBeenCalled();
  });
});

describe("POST /api/webhooks/mercadopago — error handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST-token";
    delete process.env.MERCADOPAGO_WEBHOOK_SECRET;
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
