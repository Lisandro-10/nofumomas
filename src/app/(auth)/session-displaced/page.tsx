import Link from "next/link";
import FlowShell from "@/components/flow/FlowShell";

export default function SessionDisplacedPage() {
  return (
    <FlowShell>
      <div className="bg-white rounded-card shadow-card p-10 flex flex-col items-center text-center gap-0">
        <span className="material-symbols-outlined text-[64px] text-navy mb-6">
          devices_off
        </span>
        <h1 className="text-navy text-2xl font-bold leading-tight mb-4">
          Tu sesión fue iniciada en otro dispositivo
        </h1>
        <p className="text-navy/70 text-base font-medium leading-relaxed mb-10">
          Por seguridad, solo puede haber una sesión activa por cuenta.
          Si fuiste vos, simplemente volvé a ingresar.
        </p>
        <Link
          href="/login"
          className="w-full bg-orange hover:bg-orange/90 text-white font-bold py-4 px-8 rounded-pill transition-colors uppercase tracking-action text-sm text-center mb-8"
        >
          Volver a ingresar
        </Link>
        <div className="space-y-2">
          <p className="text-navy/60 text-sm">
            ¿No fuiste vos? Cambiá tu contraseña inmediatamente.
          </p>
          <Link href="/forgot-password" className="inline-block text-navy font-bold text-sm hover:underline">
            Cambiar contraseña →
          </Link>
        </div>
      </div>
    </FlowShell>
  );
}
