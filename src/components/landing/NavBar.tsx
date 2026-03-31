import Link from "next/link";

export default function NavBar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-navy text-2xl font-extrabold tracking-tight">
          No Fumo Más
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#tecnicas" className="text-navy/60 hover:text-navy transition-colors font-bold text-sm">
            Técnicas
          </a>
          <a href="#precios" className="text-navy/60 hover:text-navy transition-colors font-bold text-sm">
            Precios
          </a>
          <a href="#nosotros" className="text-navy/60 hover:text-navy transition-colors font-bold text-sm">
            Expertos
          </a>
          <a href="#testimonios" className="text-navy/60 hover:text-navy transition-colors font-bold text-sm">
            Testimonios
          </a>
        </div>

        <div className="flex items-center gap-6">
          <span className="hidden lg:block text-orange font-bold text-sm">+54 261 749-7523</span>
          <Link
            href="/checkout"
            className="rounded-pill bg-orange text-white px-6 py-2 text-sm font-bold uppercase tracking-action hover:opacity-90 transition-opacity active:scale-95"
          >
            EMPEZAR AHORA
          </Link>
        </div>
      </div>
    </nav>
  );
}
