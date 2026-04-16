import Link from "next/link";

const TECHNIQUES = [
  {
    icon: "mindfulness",
    title: "Mindfulness",
    desc: "Conciencia plena para manejar el deseo súbito y reconectar con tu respiración.",
  },
  {
    icon: "psychology_alt",
    title: "Reestructuración",
    desc: "Cambiamos los patrones cognitivos que te mantienen atado al hábito del tabaco.",
  },
  {
    icon: "self_improvement",
    title: "Hipnosis Desoille",
    desc: "Acceso al subconsciente para eliminar la necesidad emocional de fumar.",
  },
  {
    icon: "shield",
    title: "Sin Miedo",
    desc: "Eliminamos el terror a dejarlo, transformando la ansiedad en libertad.",
  },
  {
    icon: "graphic_eq",
    title: "Mensajes Subliminales",
    desc: "Refuerzo auditivo de alta frecuencia para consolidar el cambio positivo.",
  },
  {
    icon: "support_agent",
    title: "Apoyo Online",
    desc: "Acompañamiento constante a través de nuestra plataforma y comunidad.",
  },
];

export default function TechniquesGrid() {
  return (
    <section id="tecnicas" className="py-24 bg-canvas scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-navy mb-4">
            Técnicas Utilizadas
          </h2>
          <div className="h-1.5 w-24 bg-orange mx-auto rounded-full" />
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {TECHNIQUES.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="card p-8 group hover:bg-orange/5 transition-colors"
            >
              <span className="material-symbols-outlined text-4xl text-green-vitality mb-6 block">
                {icon}
              </span>
              <h3 className="text-xl font-bold text-navy mb-3">{title}</h3>
              <p className="text-navy/60 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link href="/checkout" className="btn-primary inline-block">
            QUIERO EMPEZAR AHORA
          </Link>
        </div>
      </div>
    </section>
  );
}
