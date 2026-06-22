import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { formatDate, formatDateISO, formatCurrency } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { getQueueLength } from '../lib/offlineQueue';

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

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h2 className="page-title text-lg">Today&apos;s Summary</h2>
        <p className="text-sm text-muted mt-1 ml-3">{formatDate(today)}</p>
        {loading ? (
          <p className="text-subtle mt-3 ml-3">Loading...</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 mt-4">
            <StatCard label="Total Dispatches" value={todayEntries.length} />
            <StatCard label="COD" value={codCount} />
            <StatCard label="Prepaid" value={prepaidCount} />
            <StatCard label="COD Amount" value={formatCurrency(totalCod)} />
          </div>
        )}
      </div>

      {queueLen > 0 && (
        <div className="bg-sand border border-warning/40 rounded-md p-3 text-sm text-warning">
          {queueLen} pending action(s) in offline queue. Will sync when online.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <QuickLink to="/new" label="New Entry" />
        <QuickLink to="/log" label="Daily Log" />
        <QuickLink to="/print" label="Print Labels" />
        {isAdmin ? (
          <QuickLink to="/analytics" label="Analytics" />
        ) : (
          <div className="rounded-md p-4 text-center text-sm bg-[#F5F5F5] border border-[#DDDDDD] text-[#999999]">
            Analytics (Admin)
          </div>
        )}
      </div>

      <Link
        to="/settings"
        className="block rounded-md p-4 text-center text-sm bg-[#F5F5F5] border border-[#DDDDDD] text-[#111111] hover:border-gold transition-colors"
      >
        Settings & Saved Addresses
      </Link>

      {todayEntries.length > 0 && (
        <div className="rounded-md p-4 bg-white border border-[#E0E0E0]">
          <h3 className="text-[#111111] font-semibold uppercase text-[11px] tracking-[2px] mb-3">Recent Today</h3>
          <div className="space-y-2">
            {todayEntries.slice(0, 5).map((e) => (
              <div key={e.id} className="flex justify-between items-center text-sm border-b border-[#E0E0E0] pb-2">
                <div>
                  <span className="font-medium text-[#111111]">{e.to_name}</span>
                  <span className="text-[#888888] ml-2">{e.courier}</span>
                </div>
                <span className="text-xs text-[#666666]">{e.to_city}</span>
              </div>
            ))}
          </div>
          <Link to="/log" className="block text-center text-gold text-sm mt-3 font-medium">
            View all →
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-[#E0E0E0] rounded-md p-3 text-center">
      <div className="text-2xl font-semibold text-[#111111]">{value}</div>
      <div className="text-xs text-[#666666] mt-1">{label}</div>
    </div>
  );
}

function QuickLink({ to, label }) {
  return (
    <Link
      to={to}
      className="rounded-md p-4 text-center font-semibold transition-colors active:scale-95 bg-[#111111] text-white border-none hover:bg-[#9A7F2E]"
    >
      {label}
    </Link>
  );
}
