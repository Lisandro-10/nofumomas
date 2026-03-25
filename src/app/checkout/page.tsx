import type { Metadata } from "next";
import Image from "next/image";
import CheckoutForm from "./_components/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout - No Fumo Mas",
};

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-canvas font-sans flex flex-col">
      {/* Header */}
      <header className="w-full py-6 px-4 md:px-8 max-w-7xl mx-auto flex items-center justify-between">
        <h1 className="text-navy text-xl md:text-2xl font-extrabold tracking-tight">
          No Fumo Mas
        </h1>
        <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 font-medium">
          <span className="material-symbols-outlined text-green-vitality text-lg">
            verified_user
          </span>
          Pago 100% Seguro
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pb-12 lg:pb-24 flex-grow w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT — Order summary */}
          <div className="lg:col-span-5 order-1">
            <div className="bg-white rounded-card shadow-card border border-slate-100 p-6 md:p-8">
              {/* Hero image */}
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-6 bg-slate-100">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYOkGRoHgllgbDDeuaxvJqlDSCM3GnolxNm9_ku31biQS9tYf5EgVYiPu01AqvEAEMPUJt9HVKl2HG_SJvv873fCt7P1KlBGnKN4uBhOkUDAzFBwHyBcaqBEYuugI6LOlnf4PUEFGeEM1p7TbH9lcKTZt7-6-B6xdBrHCy7uyDAvh37xJ_fJJogvh8PnF70Hb1ywFAiLd_lqkn0meExsHZ24sVfK6XC-8lHTfUvTJTeI07vtE7ErV07dJuKRGsA3SfBTU7a-sq0rA"
                  alt="Persona respirando aire fresco en la naturaleza"
                  fill
                  className="object-cover"
                />
              </div>

              <h2 className="text-navy text-2xl md:text-3xl font-extrabold leading-tight mb-2">
                Programa No Fumo Mas
              </h2>
              <p className="text-slate-500 text-sm md:text-base leading-relaxed mb-6">
                Acceso completo al curso online · Método Desoille · Hipnosis clínica
              </p>

              {/* Price */}
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-navy text-4xl font-extrabold">USD 120</span>
                <span className="text-slate-400 text-sm line-through">USD 240</span>
              </div>

              {/* Benefits */}
              <ul className="space-y-4 mb-8">
                {["Acceso inmediato", "Contenido completo", "Sin suscripción"].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-green-vitality font-bold">
                        check_circle
                      </span>
                      <p className="font-medium text-slate-700">{item}</p>
                    </li>
                  )
                )}
              </ul>

              <hr className="border-slate-100 mb-6" />

              {/* Trust badges */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 text-slate-500">
                  <span className="material-symbols-outlined text-xl">lock</span>
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Pago seguro
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                  <span className="material-symbols-outlined text-xl">
                    shield_with_heart
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Garantía de satisfacción
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Payment form */}
          <div className="lg:col-span-7 order-2">
            <div className="bg-white rounded-card shadow-card border border-slate-100 p-6 md:p-10">
              <CheckoutForm />
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 bg-navy text-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="text-xl font-extrabold tracking-tight">No Fumo Mas</span>
            <p className="text-xs text-slate-300 font-medium">
              © 2026 No Fumo Mas. Todos los derechos reservados.
            </p>
          </div>
          <div className="flex items-center gap-6 text-xs font-semibold text-slate-300 uppercase tracking-widest">
            <a href="#" className="hover:text-orange transition-colors">Privacidad</a>
            <a href="#" className="hover:text-orange transition-colors">Soporte</a>
            <a href="#" className="hover:text-orange transition-colors">Cookies</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
