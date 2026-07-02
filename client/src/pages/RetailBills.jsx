import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/format';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';

export default function RetailBills() {
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState([]);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('items');
  const { showToast } = useToast();

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getRetailBills({ search, date: dateFilter });
      setBills(data);
    } catch {
      showToast('Failed to load retail bills', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, dateFilter, showToast]);

  const fetchSummary = useCallback(async () => {
    try {
      setSummary(await api.getRetailBillsSummary());
    } catch {
      showToast('Failed to load summary', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    const timer = setTimeout(fetchBills, 400);
    return () => clearTimeout(timer);
  }, [fetchBills]);

  const grandTotal = bills.reduce((sum, b) => sum + (Number(b.total) || 0), 0);

  return (
    <div className="space-y-4">
      <PageHeader title="Retail Bills" subtitle={`GST bills & summaries · ${bills.length} entries`} accent="rose" />

      <div className="flex gap-1 bg-rose-50 border border-rose-200 rounded-lg p-1">
        {[
          { id: 'items', label: 'All Items' },
          { id: 'summary', label: 'Daily Summary' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm'
                : 'text-rose-800 hover:bg-white/70'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'items' && (
        <>
          <div className="card p-3 space-y-2">
            <input
              type="text"
              placeholder="Search item name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
            />
            <div className="flex gap-2">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="input text-sm flex-1"
              />
              {(search || dateFilter) && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setDateFilter(''); }}
                  className="px-3 py-2 bg-sand border border-line rounded-md text-sm text-ink hover:border-gold transition-colors shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {bills.length > 0 && (
            <div className="card p-4 flex justify-between items-center">
              <span className="text-sm text-muted">Filtered Total</span>
              <span className="text-lg font-semibold text-gold">{formatCurrency(grandTotal)}</span>
            </div>
          )}

          {loading ? (
            <p className="text-subtle text-center py-8">Loading...</p>
          ) : bills.length === 0 ? (
            <p className="text-subtle text-center py-8">No bills found</p>
          ) : (
            <div className="card p-0 overflow-x-auto">
              <table className="w-full text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-ink text-white text-left">
                    <th className="py-2 px-2">Date</th>
                    <th className="py-2 px-2">Bill No</th>
                    <th className="py-2 px-2">Customer</th>
                    <th className="py-2 px-2">Phone</th>
                    <th className="py-2 px-2">Payment</th>
                    <th className="py-2 px-2">Item</th>
                    <th className="py-2 px-2 text-right">Qty</th>
                    <th className="py-2 px-2 text-right">Rate</th>
                    <th className="py-2 px-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill, i) => (
                    <tr key={bill.id} className={`border-b border-line ${i % 2 === 0 ? 'bg-white' : 'bg-sand'}`}>
                      <td className="py-2 px-2 text-muted">{formatDate(bill.date)}</td>
                      <td className="py-2 px-2 text-muted">{bill.bill_no || '—'}</td>
                      <td className="py-2 px-2">
                        <div className="font-medium text-ink">{bill.customer_name || '—'}</div>
                        {bill.customer_location && (
                          <div className="text-[10px] text-[#888888]">{bill.customer_location}</div>
                        )}
                      </td>
                      <td className="py-2 px-2 text-[#888888]">{bill.customer_phone || '—'}</td>
                      <td className="py-2 px-2"><PaymentBadge type={bill.payment_type} /></td>
                      <td className="py-2 px-2 font-medium text-ink">{bill.item_name}</td>
                      <td className="py-2 px-2 text-right text-ink">{bill.qty}</td>
                      <td className="py-2 px-2 text-right text-muted">{formatCurrency(bill.rate)}</td>
                      <td className="py-2 px-2 text-right font-medium text-gold">{formatCurrency(bill.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === 'summary' && (
        <div className="card p-0 overflow-x-auto">
          {summary.length === 0 ? (
            <p className="text-subtle text-center py-8">No summary data yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ink text-white text-left">
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3 text-right">Bills</th>
                  <th className="py-2 px-3 text-right">Customers</th>
                  <th className="py-2 px-3 text-right">Total Qty</th>
                  <th className="py-2 px-3 text-right">Total Value</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((row, i) => (
                  <tr key={row.date} className={`border-b border-line ${i % 2 === 0 ? 'bg-white' : 'bg-sand'}`}>
                    <td className="py-2 px-3 font-medium text-ink">{formatDate(row.date)}</td>
                    <td className="py-2 px-3 text-right text-muted">{row.bill_count}</td>
                    <td className="py-2 px-3 text-right text-muted">{row.customer_count}</td>
                    <td className="py-2 px-3 text-right text-ink">{row.total_qty}</td>
                    <td className="py-2 px-3 text-right font-semibold text-gold">{formatCurrency(row.total_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function PaymentBadge({ type }) {
  if (!type) return <span className="text-[#888888]">—</span>;
  const isPrepaid = type.toLowerCase() === 'prepaid';
  return (
    <span
      className={`inline-block rounded-full text-[10px] font-semibold px-2 py-0.5 text-white ${
        isPrepaid ? 'bg-[#2E7D32]' : 'bg-[#888888]'
      }`}
    >
      {type}
    </span>
  );
}
