import Link from "next/link";

const POINTS = [
  {
    title: "Máxima Eficacia",
    desc: "9 de cada 10 pacientes logran dejar de fumar definitivamente.*",
  },
  {
    title: "Sin Sustitutos Químicos",
    desc: "Nada de chicles, parches o medicación que dañe tu organismo.",
  },
  {
    title: "Sesión Única de 6 Horas",
    desc: "Un proceso intensivo diseñado para un cambio inmediato.",
  },
  {
    title: "Hipnosis Clínica",
    desc: "Técnica avalada para el manejo de adicciones y control de impulsos.",
  },
];

export default function DifferentialsSection() {
  return (
    <section className="bg-navy text-white py-24">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-8">
            ¿Por qué nuestro método funciona?
          </h2>

          <ul className="space-y-6 mb-12">
            {POINTS.map(({ title, desc }) => (
              <li key={title} className="flex items-start gap-4">
                <span
                  className="material-symbols-outlined text-green-vitality bg-green-vitality/20 p-2 rounded-lg shrink-0"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  check_circle
                </span>
                <div>
                  <p className="text-xl font-bold">{title}</p>
                  <p className="text-white/70 text-sm mt-1">{desc}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="text-white/40 text-xs mb-8">
            * Según registro interno de pacientes tratados 2020–2025.
          </p>

          <Link
            href="/checkout"
            className="rounded-pill bg-orange text-white px-8 py-4 text-sm font-bold uppercase tracking-action hover:opacity-90 transition-opacity inline-block"
          >
            VER OPCIONES DE TRATAMIENTO
          </Link>
        </div>

        <div className="bg-white/5 backdrop-blur border border-white/10 p-10 rounded-[3rem] text-center">
          <p className="text-7xl font-extrabold text-orange mb-2">90%</p>
          <p className="text-2xl font-bold uppercase tracking-widest text-white/70 mb-10">
            Tasa de éxito
          </p>
          <hr className="border-white/10 mb-10" />
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-3xl font-bold">6hs</p>
              <p className="text-xs uppercase tracking-widest text-white/40 mt-1">Duración</p>
            </div>
            <div>
              <p className="text-3xl font-bold">+1000</p>
              <p className="text-xs uppercase tracking-widest text-white/40 mt-1">Graduados</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
