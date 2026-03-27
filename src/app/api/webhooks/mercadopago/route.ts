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

  const match = hash === v1;
  if (!match) {
    console.error("[mp-sig-debug] manifest:", manifest);
    console.error("[mp-sig-debug] computed:", hash);
    console.error("[mp-sig-debug] expected:", v1);
    console.error("[mp-sig-debug] secret_len:", webhookSecret.length);
    console.error("[mp-sig-debug] secret_start:", webhookSecret.slice(0, 4));
    console.error("[mp-sig-debug] secret_end:", webhookSecret.slice(-4));
    console.error("[mp-sig-debug] x-signature:", xSignature);
    console.error("[mp-sig-debug] x-request-id:", xRequestId);
  }
  return match;
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

    // Verify signature if secret is configured
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (webhookSecret) {
      if (!verifyMpSignature(req, paymentId, webhookSecret)) {
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
