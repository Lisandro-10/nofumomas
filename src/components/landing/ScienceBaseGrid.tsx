import Image from "next/image";

const FIGURES = [
  {
    name: "Allen Carr",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDoRydu1YE3-2Elehd5qxE6td7JKYJujd9_LzBP5hLA-Gu9nTy76sPaO9J2ylLYbsz3Haeashl7iOdMqzRcAzeU3AfFL7DD_7eOCW638lGYxMEo1VNILIT159oNt1dAtBit-Xgh1-7wQ7iQA9rgMTbdPUl7USEeZp6muJJozaIhsUtNELvH4Qo5ExJDIJ9UwXenA2X2U3loyVj49_Mg8NI8tge-reaQRM1C5ikmYVMQYPbrGRi5Vt0wIYfmFmYcyAMUCf9petXRxKQ",
    desc: "Escritor británico de libros de autoayuda, fumador empedernido y creador del método «Es fácil dejar de fumar si sabes cómo».",
  },
  {
    name: "Albert Ellis",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCTG8529qFXn4K424avzdWszquIVJFaqjJW341DZSywKRDiGdtzd4ZoNKzffUnxOMkGAnJ-6jHys2_VexyzQsnyvObu4ew4ud0ot4fmCNyLOeg6IWQ6bvMAejAZesVBbD9jPEGjfTH3awdW_FPAFPsL4u8UGp2G2rdmvhr2WfhBqfwdUGQg4E-dDqJiIH1B5zRKenj6rG21Y48de7x2QH6aJDzC-tH1GoOyNt63ccdgMRmbQQ8FGtjBuXCl7RTSc_Fh2o8woLknv5M",
    desc: "El reconocido psicólogo estadounidense aportó su terapia de reestructuración cognitiva al método.",
  },
  {
    name: "Robert Desoille",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAlkF9TfuQ-oRFkDgK-Pzq5AO_vH62np2u6MdTVZJrvIL-8lAfjAeSXpV6b6PrXCXbAO08kBBIkW3q3lrr3A-sI6ZMBYbVkM814VeIwjGeTEVIMYUrLEWxFGExyCdhmnVRelyshzzP8jpcTXb0FU8MzjqLQ5zWG12EuZc2fyru5ijfT5bxXBeXVe-YZbmH5_stsTN5ErBqawzZpqcyIaGbgtpLIs0pRddeWGTf0M8-nYM88Q6t01pJpUTDRC5GBbLFtHtXlK4cZDi8",
    desc: "Terapeuta francés, fundador de la escuela de hipnosis de ensueños dirigidos. A través de esta técnica usamos lo imaginario para acceder al inconsciente.",
  },
  {
    name: "Reestructuración Cognitiva Emocional",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDa_sa2ZkIGI-G-mb0fC0rSCa4O4UG1sxXNC26tbKTl3b9PzSfY_eMBiHQMFdeLFmSveD24g07QiMAqdQ51etbRbaLWU2cEnfEOg85-Rnwu4qaNduvvdFN1MPuvPtYMMQ2vBv4KzcFKP1FegYKtKm3syLdLZ41BHruZCULa8iArIeNsnbHYdLx1S0IJaw",
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
                  className="w-full h-full object-cover"
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
