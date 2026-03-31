const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5492612345678";

export default function FloatingWhatsapp() {
  return (
    <a
      href={`https://wa.me/${waNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      className="hidden md:flex fixed bottom-8 right-8 w-16 h-16 bg-green-vitality text-white rounded-full items-center justify-center shadow-2xl hover:scale-110 transition-transform z-40 group"
      aria-label="Contactar por WhatsApp"
    >
      <span
        className="material-symbols-outlined text-3xl"
        style={{ fontVariationSettings: '"FILL" 1' }}
      >
        chat
      </span>
      <span className="absolute right-20 bg-white text-navy px-4 py-2 rounded-xl text-sm font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        ¿Dudas? Chateá con nosotros
      </span>
    </a>
  );
}
