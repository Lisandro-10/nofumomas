import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { purchasesRepository } from "@/lib/firebase/repositories/purchases.repository";
import { sendActivationEmail, sendAccountDisabledEmail } from "@/lib/email/brevo.service";
import { signActivationToken } from "@/lib/email/activation-token";
import { adminAuth } from "@/lib/firebase/admin";

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

    // Signature verification — only enforced when MERCADOPAGO_VERIFY_WEBHOOKS=true.
    // Per MP docs, the manifest uses data.id from the URL query param.
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    const shouldVerify = process.env.MERCADOPAGO_VERIFY_WEBHOOKS === "true";
    if (webhookSecret) {
      const dataId = req.nextUrl.searchParams.get("data.id") ?? String(paymentId);
      const xSig = req.headers.get("x-signature") ?? "";
      const xReqId = req.headers.get("x-request-id") ?? "";
      const { ts, v1 } = parseXSignature(xSig);
      const manifest = `id:${dataId};request-id:${xReqId};ts:${ts};`;
      const computed = createHmac("sha256", webhookSecret).update(manifest).digest("hex");
      const valid = computed === v1;

      console.log("[webhook/mp] sig | manifest:", manifest);
      console.log("[webhook/mp] sig | computed:", computed);
      console.log("[webhook/mp] sig | expected:", v1);
      console.log("[webhook/mp] sig | match:", valid);

      if (!valid && shouldVerify) {
        console.error("[webhook/mp] firma inválida — rechazando (MERCADOPAGO_VERIFY_WEBHOOKS=true)");
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
