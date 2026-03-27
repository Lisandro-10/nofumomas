import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { purchasesRepository } from "@/lib/firebase/repositories/purchases.repository";
import { sendActivationEmail, sendAccountDisabledEmail } from "@/lib/email/brevo.service";
import { signActivationToken } from "@/lib/email/activation-token";
import { adminAuth } from "@/lib/firebase/admin";

function verifyMpSignature(
  req: NextRequest,
  dataId: string,
  webhookSecret: string
): boolean {
  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");

  if (!xSignature || !xRequestId) return false;

  const parts: Record<string, string> = {};
  xSignature.split(",").forEach((part) => {
    const [key, value] = part.split("=");
    if (key && value) parts[key.trim()] = value.trim();
  });

  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const hash = createHmac("sha256", webhookSecret).update(manifest).digest("hex");

  return hash === v1;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // MercadoPago sends { type, data: { id } } for payment notifications
    if (body.type !== "payment") {
      return NextResponse.json({ received: true });
    }

    const paymentId: string = body.data?.id;
    if (!paymentId) {
      return NextResponse.json({ received: true });
    }

    // Verify signature if secret is configured.
    // Per MP docs, the signature uses data.id from the URL query param, not the body.
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    console.log("[mp-debug] body.data.id:", paymentId, "| type:", typeof paymentId);
    console.log("[mp-debug] url data.id:", req.nextUrl.searchParams.get("data.id"));
    console.log("[mp-debug] full url:", req.nextUrl.toString());
    console.log("[mp-debug] x-signature:", req.headers.get("x-signature"));
    console.log("[mp-debug] x-request-id:", req.headers.get("x-request-id"));
    console.log("[mp-debug] secret present:", !!webhookSecret, "| len:", webhookSecret?.length);
    console.log("[mp-debug] secret repr:", JSON.stringify(webhookSecret));
    if (webhookSecret) {
      const dataIdFromUrl = req.nextUrl.searchParams.get("data.id") ?? String(paymentId);
      console.log("[mp-debug] dataIdForSig:", dataIdFromUrl);
      const xSig = req.headers.get("x-signature") ?? "";
      const xReqId = req.headers.get("x-request-id") ?? "";
      const parts: Record<string, string> = {};
      xSig.split(",").forEach((part) => {
        const [k, v] = part.split("=");
        if (k && v) parts[k.trim()] = v.trim();
      });
      const manifest = `id:${dataIdFromUrl};request-id:${xReqId};ts:${parts["ts"]};`;
      const { createHmac: _hmac } = await import("crypto");
      const computed = _hmac("sha256", webhookSecret).update(manifest).digest("hex");
      console.log("[mp-debug] manifest:", manifest);
      console.log("[mp-debug] computed:", computed);
      console.log("[mp-debug] expected:", parts["v1"]);
      if (!verifyMpSignature(req, dataIdFromUrl, webhookSecret)) {
        console.error("[webhook/mercadopago] firma inválida");
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    }

    const mpClient = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    });

    const paymentClient = new Payment(mpClient);
    const paymentData = await paymentClient.get({ id: paymentId });

    const purchaseId = paymentData.external_reference;
    if (!purchaseId) {
      console.warn("[webhook/mercadopago] sin external_reference", paymentId);
      return NextResponse.json({ received: true });
    }

    const mpStatus = paymentData.status;

    if (mpStatus === "approved") {
      await purchasesRepository.updateStatus(purchaseId, "paid");

      const purchase = await purchasesRepository.findById(purchaseId);
      if (purchase?.email) {
        const token = await signActivationToken(purchaseId, purchase.email);
        const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/activate?token=${token}`;
        await sendActivationEmail({ to: purchase.email, activationUrl });
      }
    } else if (mpStatus === "rejected" || mpStatus === "cancelled") {
      await purchasesRepository.updateStatus(purchaseId, "failed");
    } else if (mpStatus === "refunded" || mpStatus === "charged_back") {
      const newStatus = mpStatus === "refunded" ? "refunded" : "charged_back";
      await purchasesRepository.updateStatus(purchaseId, newStatus);

      const purchase = await purchasesRepository.findById(purchaseId);
      if (purchase?.email) {
        // Obtener UID: primero del purchase (si ya fue activado), luego por email
        let uid = purchase.uid;
        if (!uid) {
          try {
            const user = await adminAuth.getUserByEmail(purchase.email);
            uid = user.uid;
          } catch {
            console.error("[webhook/mercadopago] usuario Firebase no encontrado para:", purchase.email);
          }
        }

        if (uid) {
          await adminAuth.updateUser(uid, { disabled: true });
        }

        await sendAccountDisabledEmail({ to: purchase.email });
      }
    }
    // "pending" | "in_process" | "authorized": el pago aún no se resolvió,
    // se procesará cuando llegue el webhook definitivo (approved / rejected).

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook/mercadopago]", err);
    return NextResponse.json({ error: "Error procesando webhook" }, { status: 500 });
  }
}
