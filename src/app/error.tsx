"use client";

import FlowShell from "@/components/flow/FlowShell";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <FlowShell>
      <div className="bg-white rounded-card shadow-card p-10 flex flex-col items-center text-center gap-0">
        <span className="material-symbols-outlined text-[64px] text-navy mb-6">
          error
        </span>
        <h1 className="text-navy text-2xl font-bold leading-tight mb-4">
          Algo salió mal
        </h1>
        <p className="text-navy/70 text-base font-medium leading-relaxed mb-10">
          Ocurrió un error inesperado. Podés intentar de nuevo o volver al inicio.
        </p>
        <button
          onClick={reset}
          className="w-full bg-orange hover:bg-orange/90 text-white font-bold py-4 px-8 rounded-pill transition-colors uppercase tracking-action text-sm mb-4"
        >
          Intentar de nuevo
        </button>
        <a
          href="/"
          className="text-navy font-bold text-sm hover:underline"
        >
          Volver al inicio →
        </a>
      </div>
    </FlowShell>
  );
}
