import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { purchasesRepository } from "@/lib/firebase/repositories/purchases.repository";
import { sendActivationEmail, sendAccountDisabledEmail } from "@/lib/email/brevo.service";
import { signActivationToken } from "@/lib/email/activation-token";
import { adminAuth } from "@/lib/firebase/admin";

// ── Signature verification ────────────────────────────────────────────────────
// Valida el header x-signature enviado por MP en cada webhook.
// Ref: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
//
// Template: id:[data.id];request-id:[x-request-id];ts:[ts];
// Se omiten los campos que no estén presentes en la notificación recibida.
// ──────────────────────────────────────────────────────────────────────────────

function parseXSignature(header: string): Record<string, string> {
  const parts: Record<string, string> = {};
  header.split(",").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx !== -1) {
      parts[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
    }
  });
  return parts;
}

function buildSignatureTemplate(dataId: string | null, xReqId: string | null, ts: string | null): string {
  const parts: string[] = [];
  if (dataId) parts.push(`id:${dataId}`);
  if (xReqId) parts.push(`request-id:${xReqId}`);
  if (ts) parts.push(`ts:${ts}`);
  return parts.join(";") + (parts.length > 0 ? ";" : "");
}

function verifyMercadoPagoSignature(req: NextRequest, dataId: string | null, secret: string): boolean {
  const xSig = req.headers.get("x-signature") ?? "";
  const xReqId = req.headers.get("x-request-id");
  const { ts, v1 } = parseXSignature(xSig);
  if (!ts || !v1) return false;
  const manifest = buildSignatureTemplate(dataId, xReqId, ts);
  const computed = createHmac("sha256", secret).update(manifest).digest("hex");
  return computed === v1;
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

    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (webhookSecret) {
      const dataId = req.nextUrl.searchParams.get("data.id") ?? String(paymentId);
      if (!verifyMercadoPagoSignature(req, dataId, webhookSecret)) {
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
