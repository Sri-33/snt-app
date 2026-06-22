import { useState, useEffect } from 'react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { api } from '../lib/api';
import { formatDate, formatDateISO, formatCurrency } from '../lib/format';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#111111', '#9A7F2E', '#555555', '#b89a4a', '#888888', '#7d6624', '#cdbf8f', '#3a3a3a'];

export default function SalesAnalytics() {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return formatDateISO(d);
  });
  const [dateTo, setDateTo] = useState(formatDateISO());

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    api.getSalesAnalytics({ date_from: dateFrom, date_to: dateTo })
      .then(setData)
      .catch(() => showToast('Failed to load analytics', 'error'))
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="text-center py-12 text-subtle">
        <p className="text-lg font-medium text-ink">Admin Access Required</p>
        <p className="text-sm mt-2">Sales analytics are not available for staff accounts.</p>
      </div>
    );
  }

  const s = data?.summary || {};
  const byCourier = (data?.byCourier || []).map((d) => ({ name: d.courier || '—', value: d.count, revenue: d.revenue }));
  const byPlace = (data?.byPlace || []).map((d) => ({ name: d.place, count: d.count }));
  const bySaree = (data?.bySaree || []).map((d) => ({ name: d.saree_name, revenue: d.revenue }));
  const dailyTrend = (data?.dailyTrend || []).map((d) => ({ date: formatDate(d.date), revenue: d.revenue, count: d.count }));
  const topCustomers = data?.topCustomers || [];

  return (
    <div className="space-y-4">
      <h2 className="page-title">Sales Analytics</h2>

      <div className="grid grid-cols-2 gap-2">
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input text-sm" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input text-sm" />
      </div>

      {loading ? (
        <p className="text-subtle text-center py-8">Loading analytics...</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard label="Total Sales" value={s.totalCount || 0} />
            <SummaryCard label="Total Revenue" value={formatCurrency(s.totalRevenue)} />
            <SummaryCard label="Avg Sale Value" value={formatCurrency(s.avgSale)} />
            <SummaryCard label="Top Place" value={s.topPlace || '—'} small />
          </div>
          <div className="card p-4 text-center">
            <div className="text-xs text-muted">Most Popular Saree</div>
            <div className="text-lg font-semibold text-gold mt-1">{s.mostPopularSaree || '—'}</div>
          </div>

          <ChartCard title="Sales by Courier">
            {byCourier.length ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={byCourier} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {byCourier.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </ChartCard>

          <ChartCard title="Top 10 Places (by count)">
            {byPlace.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byPlace} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#9A7F2E" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </ChartCard>

          <ChartCard title="Top 10 Sarees (by revenue)">
            {bySaree.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={bySaree} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="revenue" fill="#111111" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </ChartCard>

          <ChartCard title="Daily Sales Trend">
            {dailyTrend.length ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={dailyTrend} margin={{ left: 4, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v, n) => (n === 'revenue' ? formatCurrency(v) : v)} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#9A7F2E" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="count" stroke="#111111" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </ChartCard>

          <div className="card p-4">
            <h3 className="section-label mb-3">Top Customers by Value</h3>
            {topCustomers.length ? (
              <div className="space-y-1 text-sm">
                {topCustomers.map((c, i) => (
                  <div key={i} className="flex justify-between border-b border-line py-1.5">
                    <span className="text-ink">{i + 1}. {c.customer_name} <span className="text-subtle text-xs">({c.count})</span></span>
                    <span className="font-medium text-gold">{formatCurrency(c.value)}</span>
                  </div>
                ))}
              </div>
            ) : <Empty />}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, small }) {
  return (
    <div className="card p-4 text-center">
      <div className={`font-semibold text-gold ${small ? 'text-base' : 'text-2xl'}`}>{value}</div>
      <div className="text-xs text-muted mt-1">{label}</div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="card p-4">
      <h3 className="section-label mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="text-subtle text-sm text-center py-6">No data for this period</p>;
}
