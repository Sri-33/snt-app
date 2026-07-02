import { useState, useEffect, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { api } from '../lib/api';
import { formatDate, formatDateISO, formatCurrency } from '../lib/format';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { SALES_COURIERS } from '../constants';
import { saveBase64File, blobToBase64, openHtmlString } from '../lib/print';
import PageHeader from '../components/PageHeader';

function saleDate(s) {
  return formatDate((s.created_at || '').split(' ')[0]);
}

export default function SalesList() {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [courier, setCourier] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const tableRef = useRef(null);
  const filters = { search, courier, date_from: dateFrom, date_to: dateTo };

  const [dispatchDate, setDispatchDate] = useState(formatDateISO());
  const [dispatchCourier, setDispatchCourier] = useState('');

  const downloadDispatch = async (format) => {
    try {
      const resp = await api.dispatchSheet(format, { date: dispatchDate, courier: dispatchCourier });
      if (format === 'pdf') {
        const html = await resp.text();
        await openHtmlString(html, `SNT_Dispatch_${dispatchDate}`);
      } else if (format === 'word') {
        const blob = await resp.blob();
        const base64 = await blobToBase64(blob);
        await saveBase64File(base64, `SNT_Dispatch_${dispatchDate}.doc`, 'application/msword');
      } else {
        const blob = await resp.blob();
        const base64 = await blobToBase64(blob);
        await saveBase64File(
          base64,
          `SNT_Dispatch_${dispatchDate}.xlsx`,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
      }
      showToast('Dispatch sheet generated');
    } catch (err) {
      showToast(err.message || 'Dispatch export failed', 'error');
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await api.getSales({ search, courier, date_from: dateFrom, date_to: dateTo });
      setSales(rows);
    } catch {
      showToast('Failed to load sales', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, courier, dateFrom, dateTo, showToast]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const clearFilters = () => {
    setSearch('');
    setCourier('');
    setDateFrom('');
    setDateTo('');
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this sale record?')) return;
    try {
      await api.deleteSale(id);
      setSales((prev) => prev.filter((s) => s.id !== id));
      showToast('Sale deleted');
    } catch (err) {
      showToast(err.message || 'Failed to delete', 'error');
    }
  };

  const totalRevenue = sales.reduce((sum, s) => sum + (Number(s.worth) || 0), 0);

  const exportExcel = async () => {
    if (!sales.length) return showToast('No data to export', 'warning');
    try {
      const resp = await api.exportSales('excel', filters);
      const blob = await resp.blob();
      const base64 = await blobToBase64(blob);
      await saveBase64File(
        base64,
        `SNT_Sales_${Date.now()}.xlsx`,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      showToast('Excel exported');
    } catch (err) {
      showToast(err.message || 'Excel export failed', 'error');
    }
  };

  const exportPDF = async () => {
    if (!sales.length) return showToast('No data to export', 'warning');
    try {
      const resp = await api.exportSales('pdf', filters);
      const html = await resp.text();
      await openHtmlString(html, 'sri-nandhini-tex-sales');
    } catch (err) {
      showToast(err.message || 'PDF export failed', 'error');
    }
  };

  const exportImage = async () => {
    if (!sales.length) return showToast('No data to export', 'warning');
    try {
      const canvas = await html2canvas(tableRef.current, { backgroundColor: '#ffffff', scale: 2 });
      const base64 = canvas.toDataURL('image/png').split(',')[1];
      await saveBase64File(base64, `SNT_Sales_${Date.now()}.png`, 'image/png');
      showToast('Image exported');
    } catch (err) {
      showToast(err.message || 'Image export failed', 'error');
    }
  };

  const sendMail = () => {
    if (!sales.length) return showToast('No data to email', 'warning');
    const lines = sales.map(
      (s) => `${saleDate(s)} | ${s.customer_name} | ${s.place || ''} | ${s.saree_name || ''} | ${formatCurrency(s.worth)} | ${s.courier || ''} | ${s.tracking_number || ''}`
    );
    const body = `Sri Nandhini Tex — Sales Report\n\nTotal Sales: ${sales.length}\nTotal Revenue: ${formatCurrency(totalRevenue)}\n\n${lines.join('\n')}`;
    window.location.href = `mailto:?subject=${encodeURIComponent('SNT Sales Report')}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Sales List" subtitle="Search, export & dispatch sheets" accent="emerald" />

      <div className="card p-3 space-y-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone"
          className="input"
        />
        <div className="grid grid-cols-2 gap-2">
          <select value={courier} onChange={(e) => setCourier(e.target.value)} className="input text-sm">
            <option value="">All Couriers</option>
            {SALES_COURIERS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={clearFilters} className="py-2 bg-sand border border-line rounded-md text-sm text-ink hover:border-gold transition-colors">
            Clear Filters
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input text-sm" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <button onClick={exportExcel} className="py-2 btn-success text-xs">Excel</button>
        <button onClick={exportPDF} className="py-2 btn-warning text-xs">PDF</button>
        <button onClick={exportImage} className="py-2 btn-primary text-xs">Image</button>
        <button onClick={sendMail} className="py-2 btn-primary text-xs">Mail</button>
      </div>

      <div className="card p-3 space-y-2">
        <h3 className="section-label">Daily Dispatch Sheet</h3>
        <div className="grid grid-cols-2 gap-2">
          <input type="date" value={dispatchDate} onChange={(e) => setDispatchDate(e.target.value)} className="input text-sm" />
          <select value={dispatchCourier} onChange={(e) => setDispatchCourier(e.target.value)} className="input text-sm">
            <option value="">All Couriers</option>
            {SALES_COURIERS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => downloadDispatch('excel')} className="py-2 btn-success text-xs">Excel</button>
          <button onClick={() => downloadDispatch('pdf')} className="py-2 btn-warning text-xs">PDF</button>
          <button onClick={() => downloadDispatch('word')} className="py-2 btn-primary text-xs">Word</button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">{sales.length} sale(s)</span>
        <span className="font-semibold text-gold">{formatCurrency(totalRevenue)}</span>
      </div>

      {loading ? (
        <p className="text-subtle text-center py-8">Loading...</p>
      ) : sales.length === 0 ? (
        <p className="text-subtle text-center py-8">No sales found</p>
      ) : (
        <div ref={tableRef} className="card p-0 overflow-x-auto">
          <table className="w-full text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-ink text-white text-left">
                <th className="py-2 px-2">Name</th>
                <th className="py-2 px-2">Place</th>
                <th className="py-2 px-2">Saree</th>
                <th className="py-2 px-2 text-right">Worth</th>
                <th className="py-2 px-2">Phone</th>
                <th className="py-2 px-2">Payment Ref</th>
                <th className="py-2 px-2">Courier</th>
                <th className="py-2 px-2">Tracking</th>
                <th className="py-2 px-2">Date</th>
                {isAdmin && <th className="py-2 px-2"></th>}
              </tr>
            </thead>
            <tbody>
              {sales.map((s, i) => (
                <tr key={s.id} className={`border-b border-line ${i % 2 === 0 ? 'bg-white' : 'bg-sand'}`}>
                  <td className="py-2 px-2 font-medium text-ink">{s.customer_name}</td>
                  <td className="py-2 px-2 text-muted">{s.place || '—'}</td>
                  <td className="py-2 px-2 text-muted">{s.saree_name || '—'}</td>
                  <td className="py-2 px-2 text-right text-ink">{formatCurrency(s.worth)}</td>
                  <td className="py-2 px-2 text-muted">{s.phone || '—'}</td>
                  <td className="py-2 px-2 text-muted">{s.payment_ref || '—'}</td>
                  <td className="py-2 px-2"><span className="badge-pill bg-ink text-white">{s.courier || '—'}</span></td>
                  <td className="py-2 px-2 text-muted">{s.tracking_number || '—'}</td>
                  <td className="py-2 px-2 text-muted">{saleDate(s)}</td>
                  {isAdmin && (
                    <td className="py-2 px-2">
                      <button onClick={() => handleDelete(s.id)} className="text-warning">Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
