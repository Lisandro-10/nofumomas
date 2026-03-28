"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/lib/firebase/auth.context";
import FlowShell from "@/components/flow/FlowShell";

interface Props {
  oobCode: string;
  email: string;
  mode?: string;
  firstTime: boolean;
  initialExpired?: boolean;
}

export default function SetPasswordClient({ oobCode, email, mode, firstTime, initialExpired }: Props) {
  const router = useRouter();
  const { signIn } = useAuth();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [codeExpired, setCodeExpired] = useState(initialExpired ?? false);
  const [resendSent, setResendSent] = useState(false);

  const isActivation = mode === "activation";

  async function handleResend() {
    await fetch("/api/auth/resend-activation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setResendSent(true);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch {
      setError("Contraseña incorrecta. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      await signIn(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/expired-action-code" || code === "auth/invalid-action-code") {
        setCodeExpired(true);
      } else {
        setError("Ocurrió un error. Intentá de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Estado 3: Link expirado ─────────────────────────────────────────────────
  if (codeExpired) {
    return (
      <PageShell>
        <div className="bg-white w-full rounded-card shadow-card border border-slate-100 p-12 flex flex-col items-center text-center">
          <div className="bg-orange/10 text-orange w-16 h-16 rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl">warning</span>
          </div>
          <h1 className="text-navy text-2xl font-bold mb-3">Este link ya no es válido</h1>
          <p className="text-slate-500 mb-10">Los links de activación vencen a las 48 horas.</p>
          {resendSent ? (
            <p className="text-green-vitality font-semibold text-sm">
              ¡Listo! Te reenviamos el link a {email}.
            </p>
          ) : (
            <button onClick={handleResend} className="btn-primary w-full">
              SOLICITAR NUEVO LINK
            </button>
          )}
        </div>
      </PageShell>
    );
  }

  // ── Estado 2: Usuario existente (solo login) ────────────────────────────────
  if (isActivation && !firstTime) {
    return (
      <PageShell>
        <div className="bg-white w-full rounded-card shadow-card border border-slate-100 p-8 flex flex-col items-center text-center">
          <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm font-medium mb-8 leading-relaxed border border-blue-100 w-full">
            Ya tenés una cuenta con este email. Ingresá con tu contraseña habitual.
          </div>
          <form onSubmit={handleLogin} className="w-full space-y-4">
            <input
              type="email"
              value={email}
              readOnly
              className="input-field bg-slate-50 text-slate-400 cursor-not-allowed"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <span className="material-symbols-outlined text-xl">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full mt-4">
              {loading ? "Ingresando..." : "INGRESAR AL CURSO"}
            </button>
          </form>
          <a href="/forgot-password" className="mt-4 text-xs text-navy/60 hover:underline">
            Olvidé mi contraseña
          </a>
        </div>
      </PageShell>
    );
  }

  // ── Estado 1: Setear contraseña (primera vez o reset) ──────────────────────
  return (
    <PageShell>
      <div className="bg-white w-full rounded-card shadow-card border border-slate-100 p-8 flex flex-col items-center text-center">
        {isActivation && (
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-vitality px-4 py-1.5 rounded-full text-sm font-bold mb-6">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            Pago confirmado
          </div>
        )}
        <h1 className="text-navy text-2xl font-bold mb-3">
          {isActivation ? "¡Ya sos parte del programa!" : "Crear nueva contraseña"}
        </h1>
        <p className="text-slate-600 font-medium mb-8">
          {isActivation
            ? "Elegí una contraseña para acceder a tu curso cuando quieras."
            : "Ingresá y confirmá tu nueva contraseña."}
        </p>
        <form onSubmit={handleSetPassword} className="w-full space-y-4">
          <div className="input-field bg-slate-50 text-slate-400 text-left">{email}</div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            >
              <span className="material-symbols-outlined text-xl">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
          <input
            type="password"
            placeholder="Repetir contraseña"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="input-field"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full mt-4">
            {loading ? "Guardando..." : isActivation ? "ACTIVAR MI CUENTA" : "GUARDAR CONTRASEÑA"}
          </button>
        </form>
      </div>
    </PageShell>
  );
}

const PageShell = FlowShell;
