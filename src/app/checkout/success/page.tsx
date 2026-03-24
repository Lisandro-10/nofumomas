import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pago exitoso - No Fumo Mas",
};

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4 text-center">
      <div className="bg-white rounded-card shadow-card border border-slate-100 p-10 max-w-md w-full">
        <span className="material-symbols-outlined text-green-vitality text-6xl mb-4 block">
          check_circle
        </span>
        <h1 className="text-navy text-2xl font-extrabold mb-3">¡Pago exitoso!</h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          Tu compra fue procesada correctamente. En breve recibirás un email con el
          acceso al <strong>Programa No Fumo Mas</strong>.
        </p>
        <Link
          href="/"
          className="btn-primary inline-block"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
