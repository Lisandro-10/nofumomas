import Image from "next/image";

const FIGURES = [
  {
    name: "Allen Carr",
    img: "/AllenCarr.webp",
    desc: "Escritor británico de libros de autoayuda, fumador empedernido y creador del método «Es fácil dejar de fumar si sabes cómo».",
  },
  {
    name: "Albert Ellis",
    img: "/AlbertEllis.webp",
    desc: "El reconocido psicólogo estadounidense aportó su terapia de reestructuración cognitiva al método.",
  },
  {
    name: "Robert Desoille",
    img: "/RobertDesoille.webp",
    desc: "Terapeuta francés, fundador de la escuela de hipnosis de ensueños dirigidos. A través de esta técnica usamos lo imaginario para acceder al inconsciente.",
  },
  {
    name: "Reestructuración Cognitiva Emocional",
    img: "/reestructuracion_cognitiva_emocional.svg",
    desc: "Hará que dejes de desear el cigarrillo, impedirá que engordes y te dará una visión completamente diferente del tabaco.",
  },
];

export default function ScienceBaseGrid() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-navy uppercase tracking-tight">
            Basado en Ciencia y Legado
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {FIGURES.map(({ name, img, desc }) => (
            <div key={name} className="group cursor-default">
              <div className="aspect-square rounded-3xl overflow-hidden mb-4 bg-canvas grayscale group-hover:grayscale-0 transition-all duration-500">
                <Image
                  src={img}
                  alt={name}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <p className="font-bold text-navy text-center text-sm">{name}</p>
              <p className="text-xs text-navy/60 mt-2 leading-relaxed text-center">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
