"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WelcomeModal({ show }: { show: boolean }) {
  const [visible, setVisible] = useState(show);
  const router = useRouter();

  async function dismiss() {
    setVisible(false);
    await fetch("/api/user/seen-welcome", { method: "POST" });
    router.refresh();
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-white rounded-card shadow-2xl p-8 md:p-12 flex flex-col items-center text-center">
        <button
          onClick={dismiss}
          className="absolute top-6 right-6 text-slate-400 hover:text-navy transition-colors"
          aria-label="Cerrar"
        >
          <span className="material-symbols-outlined text-3xl">close</span>
        </button>

        <div className="mb-6 flex items-center justify-center w-20 h-20 bg-orange/10 rounded-full text-orange">
          <span className="material-symbols-outlined text-5xl">celebration</span>
        </div>

        <h1 className="text-navy text-2xl md:text-3xl font-bold mb-4">¡Bienvenido al programa!</h1>
        <p className="text-navy/70 text-base md:text-lg mb-10 leading-relaxed">
          Vas a seguir el curso a tu ritmo. Te explicamos cómo funciona:
        </p>

        <div className="w-full space-y-6 mb-10 text-left">
          {[
            { icon: "play_circle", text: "Completá cada video para desbloquear el siguiente módulo" },
            { icon: "pause_circle", text: "Podés pausar y retomar cuando quieras — guardamos tu progreso" },
            { icon: "chat", text: "Si tenés dudas, contactanos por WhatsApp" },
          ].map(({ icon, text }) => (
            <div key={icon} className="flex items-start gap-4">
              <span className="material-symbols-outlined text-2xl text-orange mt-0.5 shrink-0">{icon}</span>
              <p className="text-navy text-sm md:text-base font-medium">{text}</p>
            </div>
          ))}
        </div>

        <div className="w-full space-y-4">
          <button
            onClick={dismiss}
            className="w-full bg-orange hover:bg-orange/90 text-white font-bold py-4 px-8 rounded-pill shadow-lg shadow-orange/30 flex items-center justify-center gap-2 transition-transform active:scale-95 group"
          >
            EMPEZAR AHORA
            <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>
          <button
            onClick={dismiss}
            className="text-slate-500 hover:text-navy text-sm font-medium underline underline-offset-4 transition-colors"
          >
            Ya entendí, cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
