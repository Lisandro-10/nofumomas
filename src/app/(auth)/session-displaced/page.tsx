import Link from "next/link";

export default function SessionDisplacedPage() {
  return (
    <main className="min-h-screen bg-canvas flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-card shadow-card p-8 flex flex-col gap-6 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-navy">Sesión cerrada</h1>
          <p className="text-sm text-navy/60">
            Tu sesión fue cerrada porque ingresaste desde otro dispositivo.
            Solo se permite una sesión activa a la vez.
          </p>
        </div>

        <Link
          href="/login"
          className="bg-orange text-white font-bold tracking-action rounded-pill py-3 text-sm uppercase text-center"
        >
          Volver a ingresar
        </Link>
      </div>
    </main>
  );
}
