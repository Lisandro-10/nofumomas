"use client";

import Link from "next/link";
import { useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import type { PaymentProvider, Plan } from "@/lib/firebase/repositories/purchases.repository";

const PLAN_PRICE: Record<Plan, string> = {
  standard: "USD 120",
  live: "USD 450",
};

export default function CheckoutForm({ plan }: { plan: Plan }) {
  const [email, setEmail] = useState("");
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>("mercadopago");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailExists, setEmailExists] = useState(false);
  const [activationPending, setActivationPending] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEmailExists(false);
    setActivationPending(false);

    if (!email) {
      setError("Por favor ingresá tu email.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, paymentProvider, plan, turnstileToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "email_exists") {
          setEmailExists(true);
        } else if (data.code === "activation_pending") {
          setActivationPending(true);
        } else {
          setError(data.error ?? "Error al iniciar el pago.");
        }
        return;
      }

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Email */}
      <div className="mb-10">
        <label
          htmlFor="email"
          className="block text-xs font-bold text-navy uppercase tracking-widest mb-3"
        >
          Tu email
        </label>
        <input
          id="email"
          type="email"
          required
          placeholder="ejemplo@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
        />
        <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">info</span>
          Te enviaremos el acceso a este email
        </p>
      </div>

      {/* Payment method */}
      <div className="space-y-4 mb-10">
        <h3 className="text-xs font-bold text-navy uppercase tracking-widest mb-4">
          Método de pago
        </h3>

        {/* MercadoPago */}
        <label
          className={`relative flex cursor-pointer rounded-2xl border-2 p-4 transition-colors ${paymentProvider === "mercadopago"
            ? "border-orange bg-orange/5"
            : "border-slate-200 bg-white hover:border-slate-300"
            }`}
        >
          <input
            type="radio"
            name="payment-method"
            value="mercadopago"
            checked={paymentProvider === "mercadopago"}
            onChange={() => setPaymentProvider("mercadopago")}
            className="sr-only"
          />
          <span className="flex flex-1 items-center justify-between">
            <span className="flex items-center gap-4">
              <span className="w-12 h-12 flex items-center justify-center bg-white rounded-xl border border-slate-100 shrink-0">
                <span className="material-symbols-outlined text-blue-500 text-3xl">
                  handshake
                </span>
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-bold text-navy">MercadoPago</span>
                <span className="text-xs text-slate-500">
                  Tarjeta, transferencia, efectivo · América Latina
                </span>
              </span>
            </span>
            <span
              className={`material-symbols-outlined ${paymentProvider === "mercadopago" ? "text-orange" : "text-slate-300"
                }`}
            >
              {paymentProvider === "mercadopago"
                ? "radio_button_checked"
                : "radio_button_unchecked"}
            </span>
          </span>
        </label>

        {/* Stripe */}
        <label
          className={`relative flex cursor-pointer rounded-2xl border-2 p-4 transition-colors ${paymentProvider === "stripe"
            ? "border-orange bg-orange/5"
            : "border-slate-200 bg-white hover:border-slate-300"
            }`}
        >
          <input
            type="radio"
            name="payment-method"
            value="stripe"
            checked={paymentProvider === "stripe"}
            onChange={() => setPaymentProvider("stripe")}
            className="sr-only"
          />
          <span className="flex flex-1 items-center justify-between">
            <span className="flex items-center gap-4">
              <span className="w-12 h-12 flex items-center justify-center bg-white rounded-xl border border-slate-100 shrink-0">
                <span className="material-symbols-outlined text-indigo-600 text-3xl">
                  payments
                </span>
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-bold text-navy">
                  Tarjeta Internacional (Stripe)
                </span>
                <span className="text-xs text-slate-500">
                  Cualquier tarjeta de crédito o débito · USD
                </span>
              </span>
            </span>
            <span
              className={`material-symbols-outlined ${paymentProvider === "stripe" ? "text-orange" : "text-slate-300"
                }`}
            >
              {paymentProvider === "stripe"
                ? "radio_button_checked"
                : "radio_button_unchecked"}
            </span>
          </span>
        </label>
      </div>

      {/* Error: pago pendiente de activación */}
      {activationPending && (
        <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-navy">
          <p className="font-semibold mb-1">Ya tenés un pago registrado.</p>
          <p className="text-slate-600">
            Revisá tu bandeja de entrada (y la carpeta de spam) por el email de activación.
          </p>
        </div>
      )}

      {/* Error: email ya registrado */}
      {emailExists && (
        <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm">
          <p className="font-semibold text-amber-900 mb-1">Este email ya tiene una cuenta.</p>
          <p className="text-amber-800 mb-3">
            Ya estás registrado. Iniciá sesión para acceder al programa.
          </p>
          <Link
            href={`/login?email=${encodeURIComponent(email)}`}
            className="inline-block bg-amber-500 text-white font-bold text-xs px-4 py-2 rounded-full hover:bg-amber-600 transition-colors"
          >
            Iniciá sesión
          </Link>
        </div>
      )}

      {/* Error genérico */}
      {error && (
        <p className="mb-4 text-sm text-red-600 text-center font-medium">{error}</p>
      )}

      {/* Turnstile anti-bot widget */}
      <div className="mb-4 flex justify-center">
        <Turnstile
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
          onSuccess={setTurnstileToken}
          onExpire={() => setTurnstileToken(null)}
          onError={() => setTurnstileToken(null)}
        />
      </div>

      {/* CTA */}
      <button
        type="submit"
        disabled={!turnstileToken || loading}
        className="w-full bg-orange hover:bg-[#e66a15] disabled:opacity-60 text-white font-extrabold text-lg py-5 rounded-pill shadow-lg shadow-orange/30 transition-all active:scale-[0.98]"
      >
        {loading ? "Procesando…" : `PAGAR ${PLAN_PRICE[plan]}`}
      </button>

      <p className="mt-4 text-center text-[10px] md:text-xs text-slate-400 leading-relaxed px-4">
        Al comprar aceptás los{" "}
        <a href="#" className="underline">
          Términos y condiciones
        </a>
        . Tu información está protegida. Sin renovación automática ni cargos ocultos.
      </p>
    </form>
  );
}
