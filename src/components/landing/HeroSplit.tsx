import Image from "next/image";
import Link from "next/link";

export default function HeroSplit() {
  return (
    <header className="relative pt-32 pb-20 bg-canvas overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <div className="relative z-10">
          <span className="text-orange font-bold tracking-[0.2em] uppercase text-sm block mb-4">
            ¿Intentaste muchas veces? Esta vez es diferente.
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] text-navy mb-6 text-balance">
            El mejor tratamiento online para{" "}
            <span className="text-orange">dejar de fumar</span>
          </h1>
          <p className="text-lg text-navy/60 mb-10 max-w-lg leading-relaxed">
            Sin parches ni sustitutos. Un método revolucionario basado en neurociencia y psicología
            profunda para que recuperes tu libertad hoy mismo.
          </p>
          <Link href="/checkout" className="btn-primary inline-block">
            QUIERO DEJAR DE FUMAR
          </Link>
        </div>

        <div className="relative">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-orange/10 rounded-full blur-[100px]" />
          <div className="relative rounded-[3rem] overflow-hidden aspect-[4/5] shadow-2xl">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQrjMPH429gJAkdDJI7jZk8e4dh4ZmYA5z3xRpV_JILkmMxGknfqxWHjTY_0KNhjLTNjEL7CEDyazOHmbCLRTp32S6UR1eNX2CpA6ufZLBx12EBj6qRgZXLMCi2ySKRMi15YTYm04FV3Xt48zKrAP4dYfDqZqXnj2eKGHorMoEW7-MDvXW9Q7tSXtACKbV1Uib_AjjoaOGCDz0g1WyEsvPM7m73q2Ro1MjIY71zOKkOJoxFE8NdIPpOWO5-S9b6U3U3DBSnyi9ZH0"
              alt="Persona respirando aire fresco en la naturaleza"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
