const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5492612345678";

export default function StickyMobileCta() {
  return (
    <div className="fixed bottom-0 left-0 w-full z-50 md:hidden bg-white/90 backdrop-blur-lg px-6 py-4 flex gap-4 shadow-[0_-2px_16px_rgba(30,58,95,0.08)]">
      <a
        href="/checkout"
        className="flex-1 bg-orange text-white py-4 rounded-2xl font-bold uppercase tracking-action text-xs text-center hover:opacity-90 transition-opacity active:scale-95"
      >
        COMPRAR AHORA
      </a>
      <a
        href={`https://wa.me/${waNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-14 h-14 bg-green-vitality text-white rounded-2xl flex items-center justify-center hover:opacity-90 transition-opacity active:scale-90"
        aria-label="Contactar por WhatsApp"
      >
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: '"FILL" 1' }}
        >
          chat
        </span>
      </a>
    </div>
  );
}
