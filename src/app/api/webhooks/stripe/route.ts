import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { purchasesRepository } from "@/lib/firebase/repositories/purchases.repository";
import { sendActivationEmail } from "@/lib/email/brevo.service";
import { signActivationToken } from "@/lib/email/activation-token";
import { AppError } from "@/lib/errors";
import { withErrorHandler } from "@/lib/errors/withErrorHandler";

async function handler(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[webhook/stripe] firma inválida", err);
    throw new AppError("Invalid signature", 400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const purchaseId = session.metadata?.purchaseId;

    if (purchaseId) {
      await purchasesRepository.updateStatus(purchaseId, "paid");

      const purchase = await purchasesRepository.findById(purchaseId);
      if (purchase?.email) {
        const token = await signActivationToken(purchaseId, purchase.email);
        const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/activate?token=${token}`;
        await sendActivationEmail({ to: purchase.email, activationUrl });
      }
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const purchaseId = session.metadata?.purchaseId;
    if (purchaseId) {
      await purchasesRepository.updateStatus(purchaseId, "cancelled");
    }
  }

  return NextResponse.json({ received: true });
}

export const POST = withErrorHandler(handler);
