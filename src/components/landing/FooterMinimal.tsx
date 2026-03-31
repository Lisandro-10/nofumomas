export default function FooterMinimal() {
  return (
    <footer className="bg-navy text-white py-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-4 text-center">
        <span className="text-2xl font-extrabold tracking-tight">No Fumo Más</span>
        <nav className="flex items-center gap-6 text-xs font-semibold text-white/60 uppercase tracking-widest">
          <a href="/terminos" className="hover:text-orange transition-colors">
            Términos
          </a>
          <a href="/privacidad" className="hover:text-orange transition-colors">
            Privacidad
          </a>
        </nav>
        <p className="text-xs text-white/50 font-medium">
          © 2026 No Fumo Más. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
