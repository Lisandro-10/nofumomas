"use client";

import { useRef } from "react";

const TESTIMONIALS = [
  {
    quote:
      "Dejé de fumar con NO FUMO MÁS, los invito a que lo hagan porque llevo más de un año de haberlo dejado. Realmente es fantástico el tratamiento. ¡Vale la pena probarlo!",
    author: "Verónica Rayna",
    role: "Abogada",
  },
  {
    quote:
      "Hace 3 años hice el tratamiento con NO FUMO MÁS, desde entonces no he tocado un cigarrillo. Antes fumaba 40 al día. Agradezco a NO FUMO MÁS que han desarrollado un tratamiento que realmente funciona.",
    author: "Mariano Soria",
    role: "Pediatra",
  },
  {
    quote:
      "Tuve un gran problema para dejar el cigarrillo, gracias al tratamiento con NO FUMO MÁS pude dejar. Yo era un incrédulo de estos tratamientos, pensaba que no podía dejar por la misma adicción que tenía.",
    author: "Federico Guiñazú",
    role: "Entrenador de boxeo",
  },
  {
    quote:
      "Estoy muy conforme con el tratamiento. Llevo dos años sin fumar, era un fumador de más de 2 paquetes diarios. Para todas esas personas que tengan dudas, no las tengan, porque es sumamente efectivo.",
    author: "Marcos Lazar",
    role: "Constructor",
  },
  {
    quote:
      "Fumé durante 16 años, siempre intentando dejarlo y fracasando. Hasta que conocí a NO FUMO MÁS, tomé la decisión y lo logré. Hoy hace 3 años que no fumo y disfruto de no fumar.",
    author: "José Irañeta",
    role: "Productor de Seguros",
  },
  {
    quote:
      "Tuve la suerte de encontrarme con este tratamiento, para mí fue un cambio rotundo en el concepto de vida. Lo logré igual que pueden lograrlo todos los que hacen este tratamiento.",
    author: "Gastón B.",
    role: "Chile",
  },
  {
    quote:
      "Los animo a todos a que lo hagan, es un tratamiento corto y eficaz que le ha cambiado la vida a muchas personas.",
    author: "Juan B.",
    role: "Colombia",
  },
  {
    quote: "Gracias por ayudarme a dejar de fumar... muy bueno el curso... ¡lo recomiendo completamente!",
    author: "Lorena R.",
    role: "Argentina",
  },
  {
    quote:
      "Pude dejar de fumar sin sufrimientos ni medicamentos y con absoluta felicidad. Estos profesionales son un lujo. Gracias por mí y por mi familia.",
    author: "Rosa A.",
    role: "Argentina",
  },
];

export default function TestimonialsCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);

  function scroll(direction: "left" | "right") {
    trackRef.current?.scrollBy({
      left: direction === "left" ? -424 : 424,
      behavior: "smooth",
    });
  }

  return (
    <section id="testimonios" className="py-24 bg-canvas overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-navy mb-4">
          Lo que dicen nuestros graduados
        </h2>
        <p className="text-navy/60">Historias reales de libertad y salud recuperada.</p>
      </div>

      <div className="relative max-w-[100vw]">
        <div
          ref={trackRef}
          className="flex overflow-x-auto gap-6 px-6 pb-8 snap-x snap-mandatory no-scrollbar"
        >
          {TESTIMONIALS.map(({ quote, author, role }) => (
            <div
              key={author}
              className="min-w-[320px] md:min-w-[400px] bg-white p-8 rounded-card border border-slate-100 shadow-card snap-start flex flex-col justify-between shrink-0"
            >
              <div>
                <span
                  className="material-symbols-outlined text-orange text-4xl mb-4 block"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  format_quote
                </span>
                <p className="text-navy/70 leading-relaxed mb-6">{quote}</p>
              </div>
              <div>
                <p className="font-bold text-navy">{author}</p>
                <p className="text-sm text-orange font-bold">{role}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:flex justify-center gap-4 mt-8">
          <button
            onClick={() => scroll("left")}
            className="w-12 h-12 rounded-full border-2 border-orange text-orange flex items-center justify-center hover:bg-orange hover:text-white transition-all active:scale-90"
            aria-label="Testimonial anterior"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-12 h-12 rounded-full border-2 border-orange text-orange flex items-center justify-center hover:bg-orange hover:text-white transition-all active:scale-90"
            aria-label="Siguiente testimonial"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
    </section>
  );
}
