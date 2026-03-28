interface FlowHeaderProps {
  showSecureBadge?: boolean;
}

export default function FlowHeader({ showSecureBadge = false }: FlowHeaderProps) {
  return (
    <header className="w-full bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 flex items-center justify-between">
        <span className="text-navy text-xl font-extrabold tracking-tight">
          No Fumo Más
        </span>
        {showSecureBadge && (
          <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 font-medium">
            <span className="material-symbols-outlined text-green-vitality text-lg">
              verified_user
            </span>
            Pago 100% Seguro
          </div>
        )}
      </div>
    </header>
  );
}
