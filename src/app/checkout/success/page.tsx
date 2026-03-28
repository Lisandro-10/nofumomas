import type { Metadata } from "next";
import FlowShell from "@/components/flow/FlowShell";

export const metadata: Metadata = {
  title: "Pago exitoso - No Fumo Mas",
};

export default function CheckoutSuccessPage() {
  return (
    <FlowShell>
      <div className="bg-white rounded-card shadow-card border border-slate-100 p-10 text-center">
        <span className="material-symbols-outlined text-green-vitality text-6xl mb-4 block">
          check_circle
        </span>
        <h1 className="text-navy text-2xl font-extrabold mb-3">¡Pago exitoso!</h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          Tu compra fue procesada correctamente. En breve recibirás un email con el
          acceso al <strong>Programa No Fumo Mas</strong>.
        </p>
      </div>
    </FlowShell>
  );
}
