import { Router } from 'express';
import * as XLSX from 'xlsx';
import db from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

const UNIQUE_FIELDS = ['payment_ref', 'tracking_number'];

function formatRowDate(createdAt) {
  const d = (createdAt || '').split(' ')[0];
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function mapForExport(rows) {
  return rows.map((s) => ({
    Name: s.customer_name,
    Place: s.place || '',
    Saree: s.saree_name || '',
    Weight: s.weight != null ? s.weight : '',
    Amount: s.worth || 0,
    Phone: s.phone || '',
    'Payment Type': s.payment_type || '',
    'COD Amount': s.payment_type === 'COD' && s.cod_amount != null ? s.cod_amount : '',
    'Payment UTR': s.payment_ref || '',
    Courier: s.courier || '',
    Tracking: s.tracking_number || '',
    Date: formatRowDate(s.created_at),
  }));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const DISPATCH_HEADERS = ['S.NO', 'CUSTOMER NAME', 'PLACE', 'SAREE NAME', 'WEIGHT', 'AMOUNT ₹', 'PHONE', 'PAYMENT TYPE', 'COD AMT ₹', 'PAYMENT UTR', 'TRACKING NO'];

function codAmt(s) {
  return s.payment_type === 'COD' && s.cod_amount != null ? Number(s.cod_amount).toLocaleString('en-IN') : '';
}

function getDispatchData(query) {
  const date = query.date || new Date().toISOString().slice(0, 10);
  const courier = query.courier || '';

  let sql = 'SELECT * FROM sales WHERE date(created_at) = ?';
  const params = [date];
  if (courier) {
    sql += ' AND courier = ?';
    params.push(courier);
  }
  sql += ' ORDER BY created_at ASC';
  const rows = db.prepare(sql).all(...params);

  const totalWorth = rows.reduce((sum, r) => sum + (Number(r.worth) || 0), 0);
  const totalCod = rows.reduce((sum, r) => sum + (r.payment_type === 'COD' ? Number(r.cod_amount) || 0 : 0), 0);
  const byCourier = {};
  rows.forEach((r) => {
    const c = r.courier || 'Unknown';
    byCourier[c] = (byCourier[c] || 0) + 1;
  });

  const dayObj = new Date(`${date}T00:00:00`);
  const [y, m, d] = date.split('-');
  return {
    date,
    rows,
    totalWorth,
    totalCod,
    byCourier,
    displayDate: `${d}/${m}/${y}`,
    dayName: dayObj.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase(),
    courierLabel: courier || 'ALL',
  };
}

function byCourierSummary(byCourier) {
  return Object.entries(byCourier).map(([k, v]) => `${k}-${v}`).join(', ') || '—';
}

function buildDispatchHtml(data, { word = false } = {}) {
  const { rows, displayDate, dayName, totalWorth, totalCod, byCourier, courierLabel } = data;
  const bodyRows = rows.map((s, i) => `
      <tr>
        <td style="text-align:center">${String(i + 1).padStart(2, '0')}</td>
        <td>${escapeHtml(s.customer_name)}</td>
        <td>${escapeHtml(s.place)}</td>
        <td>${escapeHtml(s.saree_name)}</td>
        <td style="text-align:right">${s.weight != null ? escapeHtml(s.weight) : ''}</td>
        <td style="text-align:right">${Number(s.worth || 0).toLocaleString('en-IN')}</td>
        <td>${escapeHtml(s.phone)}</td>
        <td>${escapeHtml(s.payment_type)}</td>
        <td style="text-align:right">${codAmt(s)}</td>
        <td>${escapeHtml(s.payment_ref)}</td>
        <td>${escapeHtml(s.tracking_number)}</td>
      </tr>`).join('');

  const pageCss = word
    ? '@page { size: A4 landscape; }'
    : '@page { size: A4 landscape; margin: 8mm; } body { margin: 0; padding: 12px; }';
  const autoPrint = word ? '' : ' onload="window.print()"';

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8" />
<title>SNT Dispatch Sheet</title>
<style>
  ${pageCss}
  body { font-family: 'Calibri', Arial, sans-serif; color: #111; }
  .head { text-align: center; margin-bottom: 8px; }
  .head h1 { font-size: 18px; margin: 0; letter-spacing: 2px; }
  .head .meta { font-size: 12px; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th, td { border: 1px solid #000; padding: 4px 6px; }
  th { background: #111; color: #fff; text-align: left; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .summary { margin-top: 10px; font-size: 12px; }
  .summary strong { display: inline-block; min-width: 120px; }
</style>
</head>
<body${autoPrint}>
  <div class="head">
    <h1>SRI NANDHINI TEX</h1>
    <div class="meta">DATE: ${displayDate} &nbsp;&nbsp; DAY: ${dayName} &nbsp;&nbsp; COURIER: ${escapeHtml(courierLabel)}</div>
  </div>
  <table>
    <thead><tr>${DISPATCH_HEADERS.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${bodyRows || `<tr><td colspan="11" style="text-align:center">No dispatches for this day</td></tr>`}</tbody>
  </table>
  <div class="summary">
    <div><strong>Total Orders:</strong> ${rows.length}</div>
    <div><strong>Total Worth:</strong> ₹${totalWorth.toLocaleString('en-IN')}</div>
    <div><strong>Total COD:</strong> ₹${totalCod.toLocaleString('en-IN')}</div>
    <div><strong>By Courier:</strong> ${byCourierSummary(byCourier)}</div>
  </div>
</body>
</html>`;
}

function buildFilters(query) {
  const { courier, date_from, date_to, search } = query;
  let sql = 'SELECT * FROM sales WHERE 1=1';
  const params = [];

  if (courier) {
    sql += ' AND courier = ?';
    params.push(courier);
  }
  if (date_from) {
    sql += " AND date(created_at) >= ?";
    params.push(date_from);
  }
  if (date_to) {
    sql += " AND date(created_at) <= ?";
    params.push(date_to);
  }
  if (search) {
    sql += ' AND (customer_name LIKE ? OR phone LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY created_at DESC';
  return { sql, params };
}

function dateClause(date_from, date_to) {
  let clause = '';
  const params = [];
  if (date_from) {
    clause += " AND date(created_at) >= ?";
    params.push(date_from);
  }
  if (date_to) {
    clause += " AND date(created_at) <= ?";
    params.push(date_to);
  }
  return { clause, params };
}

// Uniqueness check for on-blur validation
router.get('/check', (req, res) => {
  try {
    const { field, value } = req.query;
    if (!UNIQUE_FIELDS.includes(field)) {
      return res.status(400).json({ error: 'Invalid field' });
    }
    if (!value) return res.json({ exists: false });
    const row = db.prepare(`SELECT id FROM sales WHERE ${field} = ?`).get(value);
    res.json({ exists: !!row });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Distinct places for autocomplete
router.get('/places', (_req, res) => {
  try {
    const rows = db.prepare(`
      SELECT DISTINCT place FROM sales
      WHERE place IS NOT NULL AND place != ''
      ORDER BY place ASC
    `).all();
    res.json(rows.map((r) => r.place));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Analytics aggregates (admin only)
router.get('/analytics', requireAdmin, (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    const { clause, params } = dateClause(date_from, date_to);

    const byCourier = db.prepare(`
      SELECT courier, COUNT(*) as count, COALESCE(SUM(worth), 0) as revenue
      FROM sales WHERE 1=1 ${clause}
      GROUP BY courier ORDER BY count DESC
    `).all(...params);

    const byPlace = db.prepare(`
      SELECT place, COUNT(*) as count, COALESCE(SUM(worth), 0) as revenue
      FROM sales WHERE place IS NOT NULL AND place != '' ${clause}
      GROUP BY place ORDER BY count DESC LIMIT 10
    `).all(...params);

    const bySaree = db.prepare(`
      SELECT saree_name, COUNT(*) as count, COALESCE(SUM(worth), 0) as revenue
      FROM sales WHERE saree_name IS NOT NULL AND saree_name != '' ${clause}
      GROUP BY saree_name ORDER BY revenue DESC LIMIT 10
    `).all(...params);

    const dailyTrend = db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count, COALESCE(SUM(worth), 0) as revenue
      FROM sales WHERE 1=1 ${clause}
      GROUP BY date(created_at) ORDER BY date ASC
    `).all(...params);

    const topCustomers = db.prepare(`
      SELECT customer_name, COUNT(*) as count, COALESCE(SUM(worth), 0) as value
      FROM sales WHERE 1=1 ${clause}
      GROUP BY customer_name ORDER BY value DESC LIMIT 10
    `).all(...params);

    const totals = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(worth), 0) as revenue, COALESCE(AVG(worth), 0) as avg
      FROM sales WHERE 1=1 ${clause}
    `).get(...params);

    const topPlace = byPlace[0]?.place || '—';
    const mostPopularSaree = db.prepare(`
      SELECT saree_name, COUNT(*) as count
      FROM sales WHERE saree_name IS NOT NULL AND saree_name != '' ${clause}
      GROUP BY saree_name ORDER BY count DESC LIMIT 1
    `).get(...params);

    res.json({
      byCourier,
      byPlace,
      bySaree,
      dailyTrend,
      topCustomers,
      summary: {
        totalCount: totals?.count || 0,
        totalRevenue: totals?.revenue || 0,
        avgSale: totals?.avg || 0,
        mostPopularSaree: mostPopularSaree?.saree_name || '—',
        topPlace,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/export/excel', (req, res) => {
  try {
    const { sql, params } = buildFilters(req.query);
    const rows = db.prepare(sql).all(...params);
    const ws = XLSX.utils.json_to_sheet(mapForExport(rows));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="SNT_Sales_${Date.now()}.xlsx"`);
    res.send(buf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/export/pdf', (req, res) => {
  try {
    const { sql, params } = buildFilters(req.query);
    const rows = db.prepare(sql).all(...params);
    const totalRevenue = rows.reduce((sum, r) => sum + (Number(r.worth) || 0), 0);

    const headers = ['Name', 'Place', 'Saree', 'Weight', 'Amount', 'Phone', 'Payment Type', 'COD Amt', 'Payment UTR', 'Courier', 'Tracking', 'Date'];
    const bodyRows = rows.map((s) => `
      <tr>
        <td>${escapeHtml(s.customer_name)}</td>
        <td>${escapeHtml(s.place)}</td>
        <td>${escapeHtml(s.saree_name)}</td>
        <td>${s.weight != null ? escapeHtml(s.weight) : ''}</td>
        <td>₹${Number(s.worth || 0).toLocaleString('en-IN')}</td>
        <td>${escapeHtml(s.phone)}</td>
        <td>${escapeHtml(s.payment_type)}</td>
        <td>${codAmt(s) ? `₹${codAmt(s)}` : ''}</td>
        <td>${escapeHtml(s.payment_ref)}</td>
        <td>${escapeHtml(s.courier)}</td>
        <td>${escapeHtml(s.tracking_number)}</td>
        <td>${formatRowDate(s.created_at)}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>SNT Sales Report</title>
<style>
  @page { size: A4 landscape; margin: 8mm; }
  body { font-family: Inter, system-ui, sans-serif; color: #111; margin: 0; padding: 12px; }
  h2 { font-size: 16px; margin: 0 0 4px; }
  .meta { font-size: 11px; color: #555; margin: 0 0 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  th { background: #111; color: #fff; padding: 5px; text-align: left; border: 1px solid #999; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  td { padding: 4px 5px; border: 1px solid #ccc; }
  tr:nth-child(even) td { background: #f7f5ee; }
</style>
</head>
<body onload="window.print()">
  <h2>Sri Nandhini Tex — Sales Report</h2>
  <p class="meta">Total Sales: ${rows.length} &nbsp;|&nbsp; Total Revenue: ₹${totalRevenue.toLocaleString('en-IN')}</p>
  <table>
    <thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/dispatch/excel', (req, res) => {
  try {
    const data = getDispatchData(req.query);
    const aoa = [
      ['SRI NANDHINI TEX'],
      [`DATE: ${data.displayDate}`],
      [`DAY: ${data.dayName}`],
      [`COURIER: ${data.courierLabel}`],
      [],
      DISPATCH_HEADERS,
      ...data.rows.map((s, i) => [
        String(i + 1).padStart(2, '0'),
        s.customer_name,
        s.place || '',
        s.saree_name || '',
        s.weight != null ? Number(s.weight) : '',
        Number(s.worth || 0),
        s.phone || '',
        s.payment_type || '',
        s.payment_type === 'COD' && s.cod_amount != null ? Number(s.cod_amount) : '',
        s.payment_ref || '',
        s.tracking_number || '',
      ]),
      [],
      [`Total Orders: ${data.rows.length}`],
      [`Total Worth: ₹${data.totalWorth.toLocaleString('en-IN')}`],
      [`Total COD: ₹${data.totalCod.toLocaleString('en-IN')}`],
      [`By Courier: ${byCourierSummary(data.byCourier)}`],
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 5 }, { wch: 22 }, { wch: 16 }, { wch: 18 }, { wch: 8 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 16 }];
    const lastCol = DISPATCH_HEADERS.length - 1;
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: lastCol } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: lastCol } },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dispatch');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="SNT_Dispatch_${data.date}.xlsx"`);
    res.send(buf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/dispatch/pdf', (req, res) => {
  try {
    const data = getDispatchData(req.query);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(buildDispatchHtml(data, { word: false }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/dispatch/word', (req, res) => {
  try {
    const data = getDispatchData(req.query);
    res.setHeader('Content-Type', 'application/msword');
    res.setHeader('Content-Disposition', `attachment; filename="SNT_Dispatch_${data.date}.doc"`);
    res.send(buildDispatchHtml(data, { word: true }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', (req, res) => {
  try {
    const { sql, params } = buildFilters(req.query);
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM sales WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Sale not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const {
      customer_name, place, saree_name, weight, worth, phone,
      payment_type, cod_amount, payment_ref, courier, tracking_number,
    } = req.body;

    if (!customer_name || !customer_name.trim()) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    const cleanPaymentRef = payment_ref?.trim() || null;
    const cleanTracking = tracking_number?.trim() || null;

    if (cleanPaymentRef) {
      const dup = db.prepare('SELECT id FROM sales WHERE payment_ref = ?').get(cleanPaymentRef);
      if (dup) {
        return res.status(400).json({ error: 'UTR already exists', field: 'payment_ref' });
      }
    }
    if (cleanTracking) {
      const dup = db.prepare('SELECT id FROM sales WHERE tracking_number = ?').get(cleanTracking);
      if (dup) {
        return res.status(400).json({ error: 'Tracking number already exists', field: 'tracking_number' });
      }
    }

    const stmt = db.prepare(`
      INSERT INTO sales (
        customer_name, place, saree_name, weight, worth, phone,
        payment_type, cod_amount, payment_ref, courier, tracking_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      customer_name.trim(),
      place?.trim() || null,
      saree_name?.trim() || null,
      weight != null && weight !== '' ? Number(weight) : null,
      worth != null && worth !== '' ? Number(worth) : null,
      phone?.trim() || null,
      payment_type?.trim() || null,
      payment_type === 'COD' && cod_amount != null && cod_amount !== '' ? Number(cod_amount) : null,
      cleanPaymentRef,
      courier?.trim() || null,
      cleanTracking
    );

    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(sale);
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(400).json({ error: 'UTR or tracking number already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM sales WHERE id = ?').run(req.params.id);
    if (!result.changes) return res.status(404).json({ error: 'Sale not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
