import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { purchasesRepository } from "@/lib/firebase/repositories/purchases.repository";
import { adminDb } from "@/lib/firebase/admin";

const PRODUCT = {
  name: "Programa No Fumo Mas",
  amountUsd: 120,
  amountCents: 12000,
};

function getOrigin(req: NextRequest): string {
  const host = req.headers.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function POST(req: NextRequest) {
  try {
    const { email, paymentProvider } = await req.json();

    if (!email || !paymentProvider) {
      return NextResponse.json(
        { error: "email y paymentProvider son requeridos" },
        { status: 400 }
      );
    }

    if (!["stripe", "mercadopago"].includes(paymentProvider)) {
      return NextResponse.json({ error: "paymentProvider inválido" }, { status: 400 });
    }

    const origin = getOrigin(req);

    // ── Stripe ───────────────────────────────────────────────────────────────
    if (paymentProvider === "stripe") {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        customer_email: email,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: { name: PRODUCT.name },
              unit_amount: PRODUCT.amountCents,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/checkout/cancel`,
      });

      const purchaseId = await purchasesRepository.create({
        email,
        provider: "stripe",
        paymentId: session.id,
        status: "pending",
        amount: PRODUCT.amountUsd,
        currency: "USD",
      });

      await stripe.checkout.sessions.update(session.id, {
        metadata: { purchaseId },
      });

      return NextResponse.json({ redirectUrl: session.url });
    }

    // ── MercadoPago ──────────────────────────────────────────────────────────
    const mpClient = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    });

    // Create doc first so we can use its ID as external_reference
    const purchaseId = await purchasesRepository.create({
      email,
      provider: "mercadopago",
      paymentId: "pending",
      status: "pending",
      amount: PRODUCT.amountUsd,
      currency: "USD",
    });

    const preference = new Preference(mpClient);
    const result = await preference.create({
      body: {
        items: [
          {
            id: "nofumomas-programa",
            title: PRODUCT.name,
            quantity: 1,
            currency_id: "USD",
            unit_price: PRODUCT.amountUsd,
          },
        ],
        payer: { email },
        back_urls: {
          success: `${origin}/checkout/success`,
          failure: `${origin}/checkout/cancel`,
          pending: `${origin}/checkout/success`,
        },
        auto_return: "approved",
        external_reference: purchaseId,
        notification_url: `${origin}/api/webhooks/mercadopago`,
      },
    });

    // Patch the real preference ID into the purchase doc
    await adminDb.collection("purchases").doc(purchaseId).update({
      paymentId: result.id,
    });

    const redirectUrl =
      process.env.NODE_ENV === "production"
        ? result.init_point
        : result.sandbox_init_point;

    return NextResponse.json({ redirectUrl });
  } catch (err) {
    console.error("[checkout]", err);
    return NextResponse.json({ error: "Error al iniciar el pago" }, { status: 500 });
  }
}
