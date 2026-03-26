"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type PageState = "form" | "sent";

export default function ForgotPasswordPage() {
  const [state, setState] = useState<PageState>("form");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  async function sendRequest(target: string) {
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: target }),
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await sendRequest(email);
      setState("sent");
      setCountdown(60);
    } catch {
      setError("Error al enviar. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (countdown > 0) return;
    setCountdown(60);
    await sendRequest(email);
  }

  if (state === "sent") {
    return (
      <PageShell>
        <div className="bg-white rounded-xl shadow-card p-8 flex flex-col items-center text-center gap-6 border border-slate-100">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-green-vitality text-4xl">check_circle</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-navy text-2xl font-bold">Revisá tu email</h2>
            <p className="text-slate-600 text-base leading-relaxed">
              Te enviamos un link de recuperación a{" "}
              <span className="font-semibold text-navy">{email}</span>. El link es válido por 24 horas.
            </p>
          </div>
          <div className="w-full space-y-4">
            <button
              onClick={handleResend}
              disabled={countdown > 0}
              className="w-full bg-slate-200 text-slate-500 font-semibold py-4 rounded-pill disabled:cursor-not-allowed transition-colors enabled:hover:bg-slate-300"
            >
              {countdown > 0 ? `Reenviar en ${countdown}s` : "Reenviar link"}
            </button>
            <Link href="/login" className="inline-block text-navy font-bold text-sm hover:underline">
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="bg-white rounded-xl shadow-card p-8 flex flex-col gap-6 border border-slate-100">
        <Link href="/login" className="text-navy flex items-center gap-2 text-sm font-semibold hover:underline">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Volver al inicio de sesión
        </Link>
        <div>
          <h2 className="text-navy text-2xl font-bold">Recuperar contraseña</h2>
          <p className="text-slate-600 text-base leading-relaxed mt-2">
            Ingresá tu email y te enviamos un link para crear una nueva contraseña.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Tu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Enviando..." : "ENVIAR LINK"}
          </button>
        </form>
      </div>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="w-full py-6 px-8 bg-white border-b border-slate-200">
        <h1 className="text-navy text-xl font-bold">No Fumo Más</h1>
      </header>
      <main className="flex-grow flex flex-col items-center py-12 px-4">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="bg-navy w-full py-8 px-4 text-center">
        <p className="text-white/70 text-sm">© 2026 No Fumo Más. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
