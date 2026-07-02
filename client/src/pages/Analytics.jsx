import { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
  Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { api } from '../lib/api';
import { formatDate, formatDateISO, formatCurrency } from '../lib/format';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import PrintButton from '../components/PrintButton';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const chartColors = ['#111111', '#9A7F2E', '#555555', '#b89a4a', '#888888', '#7d6624', '#cdbf8f'];

export default function Analytics() {
  const { isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return formatDateISO(d);
  });
  const [dateTo, setDateTo] = useState(formatDateISO());
  const [districtSort, setDistrictSort] = useState({ field: 'count', dir: 'desc' });
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const reportRef = useRef(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    api.getAnalytics({ dateFrom, dateTo })
      .then(setData)
      .catch(() => showToast('Failed to load analytics', 'error'))
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="text-center py-12 text-subtle">
        <p className="text-lg font-medium text-ink">Admin Access Required</p>
        <p className="text-sm mt-2">Analytics are not available for staff accounts.</p>
      </div>
    );
  }

  const sortedDistricts = [...(data?.districtBreakdown || [])].sort((a, b) => {
    const f = districtSort.field;
    const dir = districtSort.dir === 'asc' ? 1 : -1;
    return (a[f] > b[f] ? 1 : -1) * dir;
  });

  const dailyChart = {
    labels: (data?.dailyTotals || []).map((d) => formatDate(d.date)),
    datasets: [{
      label: 'Dispatches',
      data: (data?.dailyTotals || []).map((d) => d.count),
      backgroundColor: '#111111',
    }],
  };

  const courierChart = {
    labels: (data?.courierBreakdown || []).map((d) => d.courier),
    datasets: [{
      data: (data?.courierBreakdown || []).map((d) => d.count),
      backgroundColor: chartColors,
    }],
  };

  const stateChart = {
    labels: (data?.stateBreakdown || []).map((d) => d.state),
    datasets: [{
      label: 'Dispatches',
      data: (data?.stateBreakdown || []).map((d) => d.count),
      backgroundColor: '#9A7F2E',
    }],
  };

  const codChart = {
    labels: (data?.codPrepaid || []).map((d) => d.cod_prepaid),
    datasets: [{
      data: (data?.codPrepaid || []).map((d) => d.count),
      backgroundColor: ['#111111', '#9A7F2E'],
    }],
  };

  const handleExportExcel = async () => {
    try {
      const rows = await api.exportData({ dateFrom, dateTo });
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Courier Entries');
      XLSX.writeFile(wb, `SNT_Report_${dateFrom}_${dateTo}.xlsx`);
      showToast('Excel downloaded');
    } catch {
      showToast('Export failed', 'error');
    }
  };

  const handleExportPDF = async () => {
    try {
      const rows = await api.exportData({ dateFrom, dateTo });
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('SNT Courier Report', 14, 20);
      doc.setFontSize(10);
      doc.text(`Period: ${formatDate(dateFrom)} - ${formatDate(dateTo)}`, 14, 28);
      doc.text(`Total Entries: ${data?.summary?.totalEntries || 0}`, 14, 36);
      doc.text(`Total COD Amount: ${formatCurrency(data?.summary?.totalCodAmount)}`, 14, 44);

      let y = 56;
      doc.setFontSize(8);
      rows.slice(0, 40).forEach((r) => {
        if (y > 280) return;
        doc.text(`${formatDate(r.date)} | ${r.to_name} | ${r.courier} | ${r.to_state || ''}`, 14, y);
        y += 6;
      });

      doc.save(`SNT_Report_${dateFrom}_${dateTo}.pdf`);
      showToast('PDF downloaded');
    } catch {
      showToast('PDF export failed', 'error');
    }
  };

  const handleEmailReport = async () => {
    if (!email) return;
    setEmailSending(true);
    try {
      const rows = await api.exportData({ dateFrom, dateTo });
      await api.sendEmailReport({
        email,
        subject: `SNT Courier Report ${formatDate(dateFrom)} - ${formatDate(dateTo)}`,
        reportType: 'csv',
        dateFrom,
        dateTo,
        data: rows,
      });
      showToast('Email report sent via n8n');
      setShowEmailModal(false);
      setEmail('');
    } catch (err) {
      showToast(err.message || 'Email failed', 'error');
    } finally {
      setEmailSending(false);
    }
  };

  const toggleDistrictSort = (field) => {
    setDistrictSort((prev) => ({
      field,
      dir: prev.field === field && prev.dir === 'desc' ? 'asc' : 'desc',
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between no-print">
        <PageHeader title="Analytics" subtitle="Reports, charts & exports" accent="orange" />
        <PrintButton contentRef={reportRef} label="Print" />
      </div>

      <div className="grid grid-cols-2 gap-2 no-print">
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input text-sm" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input text-sm" />
      </div>

      {loading ? (
        <p className="text-subtle text-center py-8">Loading analytics...</p>
      ) : (
        <div ref={reportRef} className="print-area space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard label="Total Entries" value={data?.summary?.totalEntries || 0} />
            <SummaryCard label="COD Amount" value={formatCurrency(data?.summary?.totalCodAmount)} />
          </div>

          <ChartCard title="Daily Dispatches (Last 30 Days)">
            <Bar data={dailyChart} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </ChartCard>

          <ChartCard title="Courier-wise Breakdown">
            <div className="max-w-xs mx-auto">
              <Pie data={courierChart} options={{ responsive: true }} />
            </div>
          </ChartCard>

          <ChartCard title="Top 10 States">
            <Bar data={stateChart} options={{ responsive: true, indexAxis: 'y', plugins: { legend: { display: false } } }} />
          </ChartCard>

          <ChartCard title="COD vs Prepaid">
            <div className="max-w-xs mx-auto">
              <Doughnut data={codChart} options={{ responsive: true }} />
            </div>
          </ChartCard>

          <div className="card p-4">
            <h3 className="section-label mb-3">District-wise Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left bg-ink text-white">
                    <th className="py-2 px-2 cursor-pointer rounded-l-md" onClick={() => toggleDistrictSort('district')}>District</th>
                    <th className="py-2 px-2">State</th>
                    <th className="py-2 px-2 cursor-pointer text-right rounded-r-md" onClick={() => toggleDistrictSort('count')}>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDistricts.slice(0, 20).map((d, i) => (
                    <tr key={i} className={`border-b border-line ${i % 2 === 0 ? 'bg-white' : 'bg-sand'}`}>
                      <td className="py-2 px-2 text-ink">{d.district}</td>
                      <td className="py-2 px-2 text-muted">{d.state}</td>
                      <td className="py-2 px-2 text-right font-medium text-ink">{d.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="section-label mb-3">Dispatches by Location</h3>
            <div className="space-y-1 text-sm max-h-48 overflow-y-auto">
              {(data?.locationDispatches || []).map((loc, i) => (
                <div key={i} className="flex justify-between border-b border-line py-1">
                  <span className="text-ink">{loc.city}{loc.district ? `, ${loc.district}` : ''} — {loc.state}</span>
                  <span className="font-medium text-gold">{loc.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 no-print">
            <button onClick={handleExportExcel} className="flex-1 py-2 btn-success text-sm">
              Excel
            </button>
            <button onClick={handleExportPDF} className="flex-1 py-2 btn-warning text-sm">
              PDF
            </button>
            <button onClick={() => setShowEmailModal(true)} className="flex-1 py-2 btn-primary text-sm">
              Email
            </button>
          </div>
        </div>
      )}

      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white border border-line rounded-md p-6 w-full max-w-sm">
            <h3 className="font-display text-lg text-ink mb-3 px-3 border-l-[3px] border-orange-400">Send Report via Email</h3>
            <p className="text-sm text-muted mb-4">Report will be sent through n8n workflow.</p>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="recipient@email.com" className="input mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setShowEmailModal(false)} className="flex-1 py-2 bg-sand border border-line rounded-md text-sm text-ink hover:border-gold transition-colors">Cancel</button>
              <button onClick={handleEmailReport} disabled={emailSending || !email}
                className="flex-1 py-2 btn-primary text-sm disabled:opacity-50">
                {emailSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="card p-4 text-center">
      <div className="text-2xl font-semibold text-gold">{value}</div>
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
