import Image from "next/image";
import Link from "next/link";

const EXPERTS = [
  {
    name: "Lic. Gonzalo Descotte",
    title: "Licenciado en Psicología",
    img: "/GonzaloDescotte.webp",
    credentials: [
      "Licenciado en Psicología, Universidad de Mendoza, Argentina.",
      "Director Área Psicología «Clínica Psiquiátrica Los Tilos», Argentina.",
      "Socio Fundador de IMEP (Institute of Medicine and Psychology).",
      "Profesor universitario en la carrera de Psicología, Universidad de Mendoza.",
      "Profesor universitario en Universidad de Piura (Perú) y Finis Terrae (Chile).",
    ],
  },
  {
    name: "Dr. Germán Maravilla",
    title: "Médico Psiquiatra",
    img: "/GermanMaravilla.webp",
    credentials: [
      "Médico por la Universidad Nacional de Cuyo, Argentina.",
      "Profesor de Posgrado en Universidad Finis Terrae, Chile.",
      "Director Científico «Clínica Psiquiátrica Los Tilos», Argentina.",
      "Socio Fundador de IMEP (Institute of Medicine and Psychology).",
    ],
  },
];

export default function ExpertsSection() {
  return (
    <section id="nosotros" className="py-24 bg-canvas">
      <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row gap-16 items-center">
        <div className="lg:w-1/3">
          <h2 className="text-4xl font-extrabold text-navy mb-6">Expertos a cargo</h2>
          <div className="text-navy/60 mb-10 leading-relaxed space-y-4">
            <p>
              Somos ex fumadores por lo que te entendemos. Nosotros también probamos con chicles de
              nicotina, medicación, fuerza de voluntad... Nos costó muchas frustraciones haber
              llegado a donde estamos.
            </p>
            <p>Hoy queremos compartir con vos el camino a la libertad.</p>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-navy/40 mb-8">
            Institución Médica de Especialidad Preventiva (IMEP)
          </p>
          <Link href="/checkout" className="btn-primary inline-block">
            CONOCÉ EL TRATAMIENTO
          </Link>
        </div>

        <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          {EXPERTS.map(({ name, title, img, credentials }) => (
            <div key={name} className="card p-8 border border-slate-100 flex flex-col h-full">
              <div className="flex justify-center mb-6">
                <Image
                  src={img}
                  alt={name}
                  width={144}
                  height={144}
                  className="w-36 h-36 rounded-full object-cover border-4 border-canvas"
                />
              </div>
              <div className="text-center mb-6">
                <h4 className="text-2xl font-extrabold text-navy mb-1">{name}</h4>
                <p className="text-base font-semibold text-navy/70">{title}</p>
              </div>
              <hr className="border-slate-100 mb-6" />
              <ul className="text-sm text-navy/80 space-y-3 flex-grow">
                {credentials.map((c) => (
                  <li key={c} className="flex gap-3">
                    <span
                      className="material-symbols-outlined text-green-vitality text-lg shrink-0"
                      style={{ fontVariationSettings: '"FILL" 1' }}
                    >
                      check_circle
                    </span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
