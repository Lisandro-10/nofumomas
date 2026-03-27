import type { Metadata } from "next";
import Link from "next/link";
import FlowShell from "@/components/flow/FlowShell";

export const metadata: Metadata = {
  title: "Pago pendiente - No Fumo Mas",
};

export default function CheckoutPendingPage() {
  return (
    <FlowShell>
      <div className="bg-white rounded-card shadow-card border border-slate-100 p-10 text-center">
        <span className="material-symbols-outlined text-orange text-6xl mb-4 block">
          schedule
        </span>
        <h1 className="text-navy text-2xl font-extrabold mb-3">Pago en proceso</h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-2">
          Tu pago está siendo procesado. Los pagos en efectivo pueden demorar hasta
          unos días hábiles en acreditarse.
        </p>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          Cuando se confirme, recibirás un email con el acceso al{" "}
          <strong>Programa No Fumo Mas</strong>.
        </p>
        <Link href="/" className="btn-primary inline-block">
          Entendido
        </Link>
      </div>
    </FlowShell>
  );
}
