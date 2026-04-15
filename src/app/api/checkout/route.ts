import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { purchasesRepository, type Plan } from "@/lib/firebase/repositories/purchases.repository";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { ValidationError } from "@/lib/errors";
import { withErrorHandler } from "@/lib/errors/withErrorHandler";

const PRODUCTS: Record<Plan, { name: string; amountUsd: number; amountCents: number }> = {
  standard: {
    name: "Programa No Fumo Más — Standard",
    amountUsd: 120,
    amountCents: 12000,
  },
  live: {
    name: "Programa No Fumo Más — Intensivo Live",
    amountUsd: 450,
    amountCents: 45000,
  },
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

async function verifyTurnstile(token: string): Promise<void> {
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY!,
      response: token,
    }),
  });
  const data = await res.json();
  if (!data.success) throw new ValidationError("Turnstile verification failed");
}

async function handler(req: NextRequest) {
  const { email, paymentProvider, plan = "standard", turnstileToken } = await req.json();

  if (!email || !paymentProvider) {
    throw new ValidationError("email y paymentProvider son requeridos");
  }

  if (!["stripe", "mercadopago"].includes(paymentProvider)) {
    throw new ValidationError("paymentProvider inválido");
  }

  if (!["standard", "live"].includes(plan)) {
    throw new ValidationError("plan inválido");
  }

  if (!turnstileToken) {
    throw new ValidationError("turnstileToken es requerido");
  }

  const product = PRODUCTS[plan as Plan];
  const origin = getOrigin(req);

  await verifyTurnstile(turnstileToken);

  // ── Bloquear emails ya registrados ───────────────────────────────────────
  try {
    await adminAuth.getUserByEmail(email);
    return NextResponse.json(
      { error: "El email ya está registrado. Por favor, iniciá sesión.", code: "email_exists" },
      { status: 409 }
    );
  } catch (err: unknown) {
    // auth/user-not-found es la ruta feliz — continuar
    if ((err as { code?: string }).code !== "auth/user-not-found") {
      throw err; // propagates to withErrorHandler → 500
    }
  }

  // ── Bloquear pagos ya realizados pero no activados ────────────────────────
  const paidPurchase = await purchasesRepository.findPaidByEmail(email);
  if (paidPurchase) {
    return NextResponse.json(
      { error: "Ya tenés un pago pendiente de activación. Revisá tu email.", code: "activation_pending" },
      { status: 409 }
    );
  }

  // ── Stripe ───────────────────────────────────────────────────────────────
  if (paymentProvider === "stripe") {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    // Create purchase first so we can include purchaseId in the success URL
    const purchaseId = await purchasesRepository.create({
      email,
      provider: "stripe",
      paymentId: "pending_stripe",
      status: "pending",
      plan: plan as Plan,
      amount: product.amountUsd,
      currency: "USD",
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: product.name },
            unit_amount: product.amountCents,
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
  const amountArs = Math.round(product.amountUsd * exchangeRate);

  // Create doc first so we can use its ID as external_reference
  const purchaseId = await purchasesRepository.create({
    email,
    provider: "mercadopago",
    paymentId: "pending",
    status: "pending",
    plan: plan as Plan,
    amount: product.amountUsd,
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
          title: product.name,
          description: `USD ${product.amountUsd} · Tipo de cambio blue: $${exchangeRate}`,
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

  const redirectUrl = result.init_point;

  return NextResponse.json({ redirectUrl });
}

export const POST = withErrorHandler(handler);
