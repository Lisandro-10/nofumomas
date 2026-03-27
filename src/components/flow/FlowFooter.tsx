export default function FlowFooter() {
  return (
    <footer className="w-full bg-navy text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <span className="text-base font-extrabold tracking-tight">No Fumo Más</span>
          <p className="text-xs text-white/60 font-medium">
            © 2026 No Fumo Más. Todos los derechos reservados.
          </p>
        </div>
        <nav className="flex items-center gap-6 text-xs font-semibold text-white/60 uppercase tracking-widest">
          <a href="/privacidad" className="hover:text-orange transition-colors">Privacidad</a>
          <a href="/soporte" className="hover:text-orange transition-colors">Soporte</a>
          <a href="/cookies" className="hover:text-orange transition-colors">Cookies</a>
        </nav>
      </div>
    </footer>
  );
}
