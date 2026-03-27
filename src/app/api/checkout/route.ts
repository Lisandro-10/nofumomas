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

async function fetchBlueRate(): Promise<number> {
  const res = await fetch("https://dolarapi.com/v1/dolares/blue");
  if (!res.ok) throw new Error(`dolarapi.com error: ${res.status}`);
  const data = await res.json();
  return data.venta as number;
}

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

      // Create purchase first so we can include purchaseId in the success URL
      const purchaseId = await purchasesRepository.create({
        email,
        provider: "stripe",
        paymentId: "pending_stripe",
        status: "pending",
        amount: PRODUCT.amountUsd,
        currency: "USD",
      });

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
        success_url: `${origin}/checkout/success`,
        cancel_url: `${origin}/checkout/cancel`,
        metadata: { purchaseId },
      });

      await adminDb.collection("purchases").doc(purchaseId).update({
        paymentId: session.id,
      });

      return NextResponse.json({ redirectUrl: session.url });
    }

    // ── MercadoPago ──────────────────────────────────────────────────────────
    const mpClient = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    });

    const exchangeRate = await fetchBlueRate();
    const amountArs = Math.round(PRODUCT.amountUsd * exchangeRate);

    // Create doc first so we can use its ID as external_reference
    const purchaseId = await purchasesRepository.create({
      email,
      provider: "mercadopago",
      paymentId: "pending",
      status: "pending",
      amount: PRODUCT.amountUsd,
      currency: "ARS",
      amountArs,
      exchangeRate,
    });

    const notificationUrl =
      process.env.MERCADOPAGO_NOTIFICATION_URL ??
      `${origin}/api/webhooks/mercadopago`;

    // MP requires a publicly accessible URL for back_urls when auto_return is set.
    // Derive it from MERCADOPAGO_NOTIFICATION_URL if available (strips the /api/... path),
    // otherwise fall back to the request origin.
    const mpAppBase = process.env.MERCADOPAGO_NOTIFICATION_URL
      ? new URL(process.env.MERCADOPAGO_NOTIFICATION_URL).origin
      : origin;

    const preference = new Preference(mpClient);
    const result = await preference.create({
      body: {
        items: [
          {
            id: "nofumomas-programa",
            title: PRODUCT.name,
            description: `USD ${PRODUCT.amountUsd} · Tipo de cambio blue: $${exchangeRate}`,
            quantity: 1,
            currency_id: "ARS",
            unit_price: amountArs,
          },
        ],
        payer: { email },
        back_urls: {
          success: `${mpAppBase}/checkout/success`,
          failure: `${mpAppBase}/checkout/cancel`,
          pending: `${mpAppBase}/checkout/pending`,
        },
        // auto_return requires a public URL — disabled on localhost
        ...(mpAppBase.includes("localhost") ? {} : { auto_return: "approved" }),
        external_reference: purchaseId,
        notification_url: notificationUrl,
      },
    });

    // Patch the real preference ID into the purchase doc
    await adminDb.collection("purchases").doc(purchaseId).update({
      paymentId: result.id,
    });

    const redirectUrl =
      process.env.MERCADOPAGO_SANDBOX === "true"
        ? result.sandbox_init_point
        : result.init_point;

    return NextResponse.json({ redirectUrl });
  } catch (err) {
    console.error("[checkout]", err);
    return NextResponse.json({ error: "Error al iniciar el pago" }, { status: 500 });
  }
}
