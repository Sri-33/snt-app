export const PAGE_ACCENTS = {
  amber: {
    wrap: 'from-amber-50 via-white to-orange-50 border-amber-200/70',
    kicker: 'text-orange-600',
    tab: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-orange-200',
  },
  blue: {
    wrap: 'from-blue-50 via-white to-indigo-50 border-blue-200/70',
    kicker: 'text-blue-600',
    tab: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-blue-200',
  },
  violet: {
    wrap: 'from-violet-50 via-white to-purple-50 border-violet-200/70',
    kicker: 'text-violet-600',
    tab: 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-violet-200',
  },
  emerald: {
    wrap: 'from-emerald-50 via-white to-teal-50 border-emerald-200/70',
    kicker: 'text-emerald-600',
    tab: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-200',
  },
  fuchsia: {
    wrap: 'from-fuchsia-50 via-white to-pink-50 border-fuchsia-200/70',
    kicker: 'text-fuchsia-600',
    tab: 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-fuchsia-200',
  },
  orange: {
    wrap: 'from-orange-50 via-white to-amber-50 border-orange-200/70',
    kicker: 'text-orange-600',
    tab: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-200',
  },
  cyan: {
    wrap: 'from-cyan-50 via-white to-sky-50 border-cyan-200/70',
    kicker: 'text-cyan-700',
    tab: 'bg-gradient-to-r from-cyan-500 to-sky-500 text-white shadow-cyan-200',
  },
  rose: {
    wrap: 'from-rose-50 via-white to-pink-50 border-rose-200/70',
    kicker: 'text-rose-600',
    tab: 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-rose-200',
  },
};

export default function PageHeader({ title, subtitle, kicker, accent = 'amber' }) {
  const style = PAGE_ACCENTS[accent] || PAGE_ACCENTS.amber;

  return (
    <header className={`rounded-lg p-4 bg-gradient-to-br border ${style.wrap}`}>
      {kicker && (
        <p className={`text-xs uppercase tracking-[0.2em] font-bold ${style.kicker}`}>{kicker}</p>
      )}
      <h2 className={`font-display text-xl text-ink tracking-wide ${kicker ? 'mt-1' : ''}`}>{title}</h2>
      {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
    </header>
  );
}

export function CardHead({ title, accent = 'amber', action }) {
  const style = PAGE_ACCENTS[accent] || PAGE_ACCENTS.amber;

  return (
    <div className={`px-4 py-3 border-b border-line bg-gradient-to-r ${style.wrap} flex items-center justify-between gap-2`}>
      <p className="section-label ml-0 pl-0">{title}</p>
      {action}
    </div>
  );
}
