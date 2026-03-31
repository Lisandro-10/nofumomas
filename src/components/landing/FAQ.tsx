"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "¿Cuánto dura el tratamiento?",
    a: "El tratamiento completo tiene una duración de 6 horas en una sola sesión. Está diseñado para ser intensivo, permitiéndote completarlo en un día.",
  },
  {
    q: "¿Es efectivo el método Desoille?",
    a: "La hipnosis de ensueños dirigidos (método Desoille) es una técnica clínica avalada para el manejo de adicciones. Combinada con reestructuración cognitiva y mindfulness, los resultados muestran una tasa de efectividad del 90% en nuestra base de pacientes.",
  },
  {
    q: "¿Necesito hacer algo antes de comenzar?",
    a: "No necesitas preparación especial. Solo debés reservar un bloque de tiempo tranquilo con buena conexión a internet. Te recomendamos no fumar en la hora previa a la sesión.",
  },
  {
    q: "¿Qué pasa si el método no funciona para mí?",
    a: "El plan Intensivo Live incluye garantía de repetición sin costo adicional. Si completaste el tratamiento y seguís fumando, podés repetir la sesión en vivo.",
  },
  {
    q: "¿Es seguro para mi salud?",
    a: "Sí. El método no utiliza ningún sustituto químico (parches, chicles, medicación). Es una terapia psicológica 100% natural que actúa sobre los patrones mentales asociados al consumo de tabaco.",
  },
  {
    q: "¿Puedo hacer el curso desde cualquier país?",
    a: "Sí. El curso es 100% online. Tenemos graduados en Argentina, Chile, Colombia, Perú, Ecuador y otros países de América Latina.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-24 bg-canvas">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-navy mb-4">Preguntas Frecuentes</h2>
          <div className="h-1.5 w-24 bg-orange mx-auto rounded-full" />
        </div>

        <dl className="space-y-4">
          {FAQS.map(({ q, a }, i) => (
            <div key={q} className="card border border-slate-100 overflow-hidden">
              <dt>
                <button
                  className="w-full flex items-center justify-between gap-4 p-6 text-left font-bold text-navy hover:text-orange transition-colors"
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-expanded={open === i}
                >
                  <span>{q}</span>
                  <span
                    className="material-symbols-outlined text-orange shrink-0 transition-transform duration-200"
                    style={{ transform: open === i ? "rotate(180deg)" : "rotate(0deg)" }}
                  >
                    expand_more
                  </span>
                </button>
              </dt>
              {open === i && (
                <dd className="px-6 pb-6 text-navy/70 leading-relaxed text-sm">{a}</dd>
              )}
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
