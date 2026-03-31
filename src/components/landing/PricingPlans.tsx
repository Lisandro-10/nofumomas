import Link from "next/link";

const PLANS = [
  {
    id: "standard" as const,
    name: "Standard",
    price: "120",
    currency: "USD",
    featured: false,
    features: [
      { label: "Curso pre-grabado completo", included: true },
      { label: "Audio de hipnosis descargable", included: true },
      { label: "Guía digital de apoyo", included: true },
      { label: "Sesiones en vivo", included: false },
    ],
  },
  {
    id: "live" as const,
    name: "Intensivo Live",
    price: "450",
    currency: "USD",
    featured: true,
    features: [
      { label: "Sesión en vivo personalizada", included: true },
      { label: "Interacción directa con expertos", included: true },
      { label: "Kit de bienvenida físico", included: true },
      { label: "Garantía de repetición", included: true },
    ],
  },
];

export default function PricingPlans() {
  return (
    <section id="precios" className="py-24 bg-canvas">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-navy mb-4">
            Elige tu camino a la libertad
          </h2>
          <p className="text-navy/60 max-w-2xl mx-auto">
            Dos modalidades diseñadas para adaptarse a tus necesidades y asegurar tu éxito.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col items-center p-10 rounded-card ${
                plan.featured
                  ? "bg-white shadow-2xl border-2 border-orange ring-8 ring-orange/5"
                  : "card border border-slate-100"
              }`}
            >
              {plan.featured && (
                <span className="absolute -top-4 bg-orange text-white px-6 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
                  Más Popular
                </span>
              )}

              <h3
                className={`text-2xl font-bold mb-2 ${
                  plan.featured ? "text-orange" : "text-navy"
                }`}
              >
                {plan.name}
              </h3>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-2xl font-bold text-navy">$</span>
                <span className="text-6xl font-extrabold tracking-tighter text-navy">
                  {plan.price}
                </span>
                <span className="text-navy/50 font-medium">{plan.currency}</span>
              </div>

              <ul className="space-y-4 mb-10 w-full">
                {plan.features.map(({ label, included }) => (
                  <li
                    key={label}
                    className={`flex items-center gap-3 ${included ? "" : "opacity-30"}`}
                  >
                    <span className="material-symbols-outlined text-green-vitality">
                      {included ? "check" : "close"}
                    </span>
                    <span className="text-navy font-medium text-sm">{label}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/checkout?plan=${plan.id}`}
                className="w-full text-center rounded-pill bg-orange text-white py-4 font-bold uppercase tracking-action text-sm hover:opacity-90 transition-opacity shadow-lg shadow-orange/20 inline-block"
              >
                ¡LO QUIERO!
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
