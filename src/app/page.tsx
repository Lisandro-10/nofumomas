export default function ComingSoon() {
  return (
    <div className="min-h-screen bg-canvas font-sans flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-navy tracking-tight mb-4">
          Próximamente
        </h1>
        <p className="text-navy/60 text-lg max-w-sm">
          Estamos preparando algo especial para ayudarte a dejar de fumar.
        </p>
      </main>

      <footer className="bg-navy py-10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xl font-extrabold text-white tracking-tight mb-2">
            No Fumo Mas
          </p>
          <p className="text-sm font-medium text-white/80">
            © 2026 No Fumo Mas. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
