const STATS = [
  { icon: "timer", value: "6 horas", label: "Duración Total" },
  { icon: "verified", value: "90%", label: "De Efectividad" },
  { icon: "psychology", value: "Hipnosis", label: "Método Desoille" },
  { icon: "do_not_disturb_on", value: "Limpio", label: "Sin Sustitutos" },
];

export default function HeroStats() {
  return (
    <section className="bg-white py-8 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(({ icon, value, label }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="material-symbols-outlined text-green-vitality text-3xl">{icon}</span>
              <div>
                <p className="font-bold text-xl text-navy leading-none">{value}</p>
                <p className="text-xs text-navy/50 uppercase tracking-wider mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
