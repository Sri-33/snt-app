import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  ClipboardList,
  Plus,
  Printer,
  Receipt,
  Settings,
  Sparkles,
} from 'lucide-react';
import { api } from '../lib/api';
import PageHeader from '../components/PageHeader';
import { formatDate, formatDateISO, formatCurrency } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { getQueueLength } from '../lib/offlineQueue';

const QUICK_ACTIONS = [
  {
    to: '/log',
    label: 'Daily Log',
    Icon: ClipboardList,
    tile: 'bg-blue-50 border-blue-100 hover:border-blue-300',
    iconWrap: 'bg-blue-500 shadow-blue-200',
  },
  {
    to: '/print',
    label: 'Print',
    Icon: Printer,
    tile: 'bg-violet-50 border-violet-100 hover:border-violet-300',
    iconWrap: 'bg-violet-500 shadow-violet-200',
  },
  {
    to: '/sales/new',
    label: 'Sales',
    Icon: Receipt,
    tile: 'bg-emerald-50 border-emerald-100 hover:border-emerald-300',
    iconWrap: 'bg-emerald-500 shadow-emerald-200',
  },
  {
    to: '/ai-tools',
    label: 'AI Tools',
    Icon: Sparkles,
    tile: 'bg-fuchsia-50 border-fuchsia-100 hover:border-fuchsia-300',
    iconWrap: 'bg-fuchsia-500 shadow-fuchsia-200',
  },
  {
    to: '/analytics',
    label: 'Analytics',
    Icon: BarChart3,
    adminOnly: true,
    tile: 'bg-orange-50 border-orange-100 hover:border-orange-300',
    iconWrap: 'bg-orange-500 shadow-orange-200',
  },
  {
    to: '/settings',
    label: 'Settings',
    Icon: Settings,
    tile: 'bg-cyan-50 border-cyan-100 hover:border-cyan-300',
    iconWrap: 'bg-cyan-600 shadow-cyan-200',
  },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const { isAdmin } = useAuth();
  const [todayEntries, setTodayEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [queueLen, setQueueLen] = useState(0);
  const today = formatDateISO();

  useEffect(() => {
    api.getEntries({ date: today })
      .then(setTodayEntries)
      .catch(() => setTodayEntries([]))
      .finally(() => setLoading(false));
    setQueueLen(getQueueLength());
  }, [today]);

  const codCount = todayEntries.filter((e) => e.cod_prepaid === 'COD').length;
  const prepaidCount = todayEntries.filter((e) => e.cod_prepaid === 'Prepaid').length;
  const totalCod = todayEntries.reduce((s, e) => s + (e.cod_prepaid === 'COD' ? (e.amount || 0) : 0), 0);
  const total = todayEntries.length;
  const actions = QUICK_ACTIONS.filter((action) => !action.adminOnly || isAdmin);

  return (
    <div className="space-y-4 pb-2">
      <PageHeader
        kicker={greeting()}
        title="Dashboard"
        subtitle={formatDate(today)}
        accent="amber"
      />

      <section className="card p-3 border-gold/15">
        <p className="section-label mb-3 px-1">Quick Actions</p>
        <div className="grid grid-cols-3 gap-2">
          {actions.map(({ to, label, Icon, tile, iconWrap }) => (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center gap-2 py-3 px-1 rounded-lg border active:scale-[0.97] transition-all ${tile}`}
            >
              <span
                className={`flex items-center justify-center w-10 h-10 rounded-xl text-white shadow-md ${iconWrap}`}
              >
                <Icon className="w-5 h-5" strokeWidth={2} />
              </span>
              <span className="text-[10px] font-bold text-ink text-center leading-tight tracking-wide uppercase">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <Link
        to="/new"
        className="flex items-center justify-between w-full px-5 py-4 rounded-lg text-white active:scale-[0.98] transition-transform bg-gradient-to-r from-ink via-[#2a2418] to-gold-dark border border-gold/40 shadow-md"
      >
        <div>
          <p className="text-sm font-semibold tracking-wide">New Courier Entry</p>
          <p className="text-[11px] text-white/60 mt-0.5">Add dispatch details & print label</p>
        </div>
        <span className="flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-gold-light to-gold text-ink shrink-0 shadow-lg shadow-gold/30">
          <Plus className="w-5 h-5" strokeWidth={2.5} />
        </span>
      </Link>

      <section className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-line bg-gradient-to-r from-gold/10 via-amber-50 to-orange-50">
          <p className="section-label ml-0 pl-0">Today&apos;s Overview</p>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            <div className="h-24 rounded-md bg-sand animate-pulse" />
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 rounded-md bg-sand animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="text-center py-3 mb-4 rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100">
              <p className="text-5xl font-display text-indigo-700 leading-none">{total}</p>
              <p className="text-xs text-indigo-500 mt-2 uppercase tracking-[0.12em] font-semibold">
                Total Dispatches
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <MiniStat label="COD" value={codCount} bg="bg-amber-50 border-amber-200" valueClass="text-amber-700" labelClass="text-amber-600" />
              <MiniStat label="Prepaid" value={prepaidCount} bg="bg-emerald-50 border-emerald-200" valueClass="text-emerald-700" labelClass="text-emerald-600" />
              <MiniStat
                label="COD ₹"
                value={formatCurrency(totalCod)}
                compact
                bg="bg-rose-50 border-rose-200"
                valueClass="text-rose-700"
                labelClass="text-rose-600"
              />
            </div>

            {total === 0 && (
              <p className="text-center text-xs text-subtle mt-4 pt-4 border-t border-line">
                No dispatches logged yet today
              </p>
            )}
          </div>
        )}
      </section>

      {queueLen > 0 && (
        <div className="rounded-md px-4 py-3 text-sm bg-orange-50 border border-orange-200 text-orange-700">
          {queueLen} pending action(s) in offline queue — will sync when online.
        </div>
      )}

      {!loading && todayEntries.length > 0 && (
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-gradient-to-r from-teal-50 to-cyan-50">
            <p className="section-label ml-0 pl-0 text-teal-700">Recent Today</p>
            <Link to="/log" className="text-[11px] text-teal-600 font-semibold uppercase tracking-wide">
              View all
            </Link>
          </div>
          <div className="divide-y divide-line">
            {todayEntries.slice(0, 5).map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{e.to_name}</p>
                  <p className="text-xs text-subtle mt-0.5 truncate">
                    {e.courier}{e.to_city ? ` · ${e.to_city}` : ''}
                  </p>
                </div>
                {e.cod_prepaid && (
                  <span
                    className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                      e.cod_prepaid === 'COD'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    {e.cod_prepaid}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MiniStat({ label, value, compact = false, bg, valueClass, labelClass }) {
  return (
    <div className={`rounded-lg border px-2 py-2.5 text-center ${bg}`}>
      <p className={`font-display leading-tight ${compact ? 'text-sm' : 'text-xl'} ${valueClass}`}>
        {value}
      </p>
      <p className={`text-[10px] mt-1 uppercase tracking-wide font-semibold ${labelClass}`}>{label}</p>
    </div>
  );
}
