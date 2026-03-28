import type { Metadata } from "next";
import Link from "next/link";
import FlowShell from "@/components/flow/FlowShell";

export const metadata: Metadata = {
  title: "Pago cancelado - No Fumo Mas",
};

export default function CheckoutCancelPage() {
  return (
    <FlowShell>
      <div className="bg-white rounded-card shadow-card border border-slate-100 p-10 text-center">
        <span className="material-symbols-outlined text-slate-400 text-6xl mb-4 block">
          cancel
        </span>
        <h1 className="text-navy text-2xl font-extrabold mb-3">Pago cancelado</h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          No se realizó ningún cargo. Podés intentarlo de nuevo cuando quieras.
        </p>
        <Link href="/checkout" className="btn-primary inline-block">
          Volver al checkout
        </Link>
      </div>
    </FlowShell>
  );
}
