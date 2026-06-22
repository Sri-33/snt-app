import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { formatDate, formatDateISO, formatCurrency } from '../lib/format';
import { useToast } from '../context/ToastContext';
import { COURIERS, INDIAN_STATES } from '../constants';
import AddressLabel from '../components/AddressLabel';
import DualLabel from '../components/DualLabel';
import PrintButton from '../components/PrintButton';

export default function Log() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateFrom: formatDateISO(),
    dateTo: formatDateISO(),
    courier: '',
    state: '',
    cod_prepaid: '',
  });
  const [selected, setSelected] = useState(new Set());
  const [detail, setDetail] = useState(null);
  const [trackingEdit, setTrackingEdit] = useState('');
  const [webhookFailed, setWebhookFailed] = useState(false);
  const printRef = useRef(null);
  const { showToast } = useToast();

  const loadEntries = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.courier) params.courier = filters.courier;
      if (filters.state) params.state = filters.state;
      if (filters.cod_prepaid) params.cod_prepaid = filters.cod_prepaid;
      const data = await api.getEntries(params);
      setEntries(data);
    } catch {
      showToast('Failed to load entries', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEntries(); }, [filters.dateFrom, filters.dateTo, filters.courier, filters.state, filters.cod_prepaid]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === entries.length) setSelected(new Set());
    else setSelected(new Set(entries.map((e) => e.id)));
  };

  const openDetail = (entry) => {
    setDetail(entry);
    setTrackingEdit(entry.tracking || '');
    setWebhookFailed(false);
  };

  const saveTracking = async () => {
    if (!detail) return;
    try {
      const updated = await api.updateEntry(detail.id, { tracking: trackingEdit });
      setDetail(updated);
      setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      if (trackingEdit) {
        try {
          await api.sendTracking({
            customerPhone: updated.to_phone,
            customerName: updated.to_name,
            trackingNumber: trackingEdit,
            courierService: updated.courier,
            orderId: updated.id,
          });
          showToast('Tracking sent ✓');
          setWebhookFailed(false);
        } catch {
          setWebhookFailed(true);
          showToast('Tracking saved but webhook failed', 'warning');
        }
      } else {
        showToast('Tracking updated');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const retryWebhook = async () => {
    if (!detail || !trackingEdit) return;
    try {
      await api.sendTracking({
        customerPhone: detail.to_phone,
        customerName: detail.to_name,
        trackingNumber: trackingEdit,
        courierService: detail.courier,
        orderId: detail.id,
      });
      showToast('Tracking sent ✓');
      setWebhookFailed(false);
    } catch {
      showToast('Webhook failed again', 'error');
    }
  };

  const selectedEntries = entries.filter((e) => selected.has(e.id));

  if (detail) {
    return (
      <div className="space-y-4">
        <button onClick={() => setDetail(null)} className="text-gold text-sm font-medium">← Back to Log</button>
        <h2 className="page-title">Entry Detail</h2>

        <div className="card p-4 space-y-2 text-sm">
          <Row label="Date" value={formatDate(detail.date)} />
          <Row label="To" value={detail.to_name} />
          <Row label="Address" value={detail.to_address} />
          <Row label="City" value={`${detail.to_city || ''} ${detail.to_district ? `, ${detail.to_district}` : ''}`} />
          <Row label="State" value={detail.to_state} />
          <Row label="PIN" value={detail.to_pin} />
          <Row label="Phone" value={detail.to_phone} />
          <Row label="Courier" value={detail.courier} />
          <Row label="COD/Prepaid" value={detail.cod_prepaid || '—'} />
          <Row label="Amount" value={formatCurrency(detail.amount)} />
          <Row label="Notes" value={detail.notes || '—'} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tracking Number</label>
          <input type="text" value={trackingEdit} onChange={(e) => setTrackingEdit(e.target.value)} className="input" />
        </div>

        <button onClick={saveTracking} className="w-full py-3 btn-primary">
          Save Tracking
        </button>

        {webhookFailed && (
          <button onClick={retryWebhook} className="w-full py-2 bg-warning text-white rounded-md text-sm font-medium">
            Retry WhatsApp Webhook
          </button>
        )}

        <PrintButton contentRef={printRef} label="Print Single Label" className="w-full justify-center" />
        <div className="hidden">
          <div ref={printRef} className="print-area">
            <AddressLabel entry={detail} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="page-title">Daily Log</h2>

      <div className="card p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input type="date" value={filters.dateFrom} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))} className="input text-sm" />
          <input type="date" value={filters.dateTo} onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))} className="input text-sm" />
        </div>
        <select value={filters.courier} onChange={(e) => setFilters((f) => ({ ...f, courier: e.target.value }))} className="input text-sm">
          <option value="">All Couriers</option>
          {COURIERS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <select value={filters.state} onChange={(e) => setFilters((f) => ({ ...f, state: e.target.value }))} className="input text-sm">
            <option value="">All States</option>
            {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.cod_prepaid} onChange={(e) => setFilters((f) => ({ ...f, cod_prepaid: e.target.value }))} className="input text-sm">
            <option value="">COD & Prepaid</option>
            <option value="COD">COD</option>
            <option value="Prepaid">Prepaid</option>
          </select>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-md p-3">
          <span className="text-sm font-medium flex-1 text-ink">{selected.size} selected</span>
          <PrintButton contentRef={printRef} label="Print Selected" />
          <div className="hidden">
            <div ref={printRef} className="print-area">
              <DualLabel entries={selectedEntries} />
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-subtle text-center py-8">Loading...</p>
      ) : entries.length === 0 ? (
        <p className="text-subtle text-center py-8">No entries found</p>
      ) : (
        <div className="rounded-md border border-line overflow-hidden">
          <div className="flex items-center px-3 py-2 bg-ink text-xs font-semibold text-white uppercase tracking-wide">
            <input type="checkbox" checked={selected.size === entries.length && entries.length > 0}
              onChange={toggleAll} className="mr-2 accent-gold" />
            <span className="flex-1">Name / City</span>
            <span className="w-16 text-center">Courier</span>
          </div>
          {entries.map((e, idx) => (
            <div
              key={e.id}
              className={`flex items-center px-3 py-3 border-b border-line hover:bg-gold/5 cursor-pointer text-sm ${
                idx % 2 === 0 ? 'bg-white' : 'bg-sand'
              }`}
              onClick={() => openDetail(e)}
            >
              <input type="checkbox" checked={selected.has(e.id)}
                onChange={(ev) => { ev.stopPropagation(); toggleSelect(e.id); }}
                onClick={(ev) => ev.stopPropagation()}
                className="mr-2 accent-gold" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate text-ink">{e.to_name}</div>
                <div className="text-xs text-subtle">{e.to_city}, {e.to_state} · {formatDate(e.date)}</div>
              </div>
              <div className="w-16 text-center text-xs text-ink">
                <div>{e.courier?.split(' ')[0]}</div>
                {e.cod_prepaid && <span className="text-[10px] text-gold font-semibold">{e.cod_prepaid}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-right max-w-[60%] text-ink">{value}</span>
    </div>
  );
}
