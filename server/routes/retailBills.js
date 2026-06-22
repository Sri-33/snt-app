import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function checkApiKey(req, res) {
  const expected = process.env.SNT_API_KEY || 'snt_bills_secret_2025';
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== expected) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

// POST /api/retail-bills — called by n8n (x-api-key auth)
router.post('/', (req, res) => {
  try {
    if (!checkApiKey(req, res)) return;

    const {
      date, bill_no, item_name, qty, rate, total, bill_total, source,
      customer_name, customer_phone, customer_location, payment_type,
      subtotal, gst_percent, gst_amount, has_gst,
    } = req.body;

    if (!date || !item_name || qty == null || rate == null || total == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let billNo = bill_no || '';
    if (!billNo) {
      const lastBill = db.prepare(`
        SELECT bill_no FROM retail_bills
        WHERE bill_no LIKE 'SNT-%'
        ORDER BY id DESC LIMIT 1
      `).get();

      let nextNum = 1;
      if (lastBill && lastBill.bill_no) {
        const lastNum = parseInt(lastBill.bill_no.replace('SNT-', ''), 10);
        if (!isNaN(lastNum)) nextNum = lastNum + 1;
      }
      billNo = 'SNT-' + String(nextNum).padStart(3, '0');
    }

    const stmt = db.prepare(`
      INSERT INTO retail_bills (
        date, bill_no, item_name, qty, rate, total, bill_total, source,
        customer_name, customer_phone, customer_location, payment_type,
        subtotal, gst_percent, gst_amount, has_gst
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      date,
      billNo,
      item_name,
      Number(qty),
      Number(rate),
      Number(total),
      bill_total != null ? Number(bill_total) : 0,
      source || 'whatsapp_retail_group',
      customer_name || '',
      customer_phone || '',
      customer_location || '',
      payment_type || '',
      subtotal != null ? Number(subtotal) : 0,
      gst_percent != null ? Number(gst_percent) : 0,
      gst_amount != null ? Number(gst_amount) : 0,
      has_gst ? 1 : 0
    );

    res.json({ success: true, id: result.lastInsertRowid, bill_no: billNo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/retail-bills/summary — daily totals (before /:id patterns)
router.get('/summary', requireAuth, (_req, res) => {
  try {
    const rows = db.prepare(`
      SELECT
        date,
        COUNT(DISTINCT bill_no) as bill_count,
        COUNT(DISTINCT NULLIF(customer_name, '')) as customer_count,
        SUM(qty) as total_qty,
        SUM(total) as total_value
      FROM retail_bills
      GROUP BY date
      ORDER BY date DESC
      LIMIT 30
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/retail-bills — list with optional date + search filters
router.get('/', requireAuth, (req, res) => {
  try {
    const { date, search } = req.query;
    let query = 'SELECT * FROM retail_bills';
    const params = [];
    const conditions = [];

    if (date) {
      conditions.push('date = ?');
      params.push(date);
    }
    if (search) {
      conditions.push('(item_name LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (conditions.length) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    query += ' ORDER BY logged_at DESC';

    res.json(db.prepare(query).all(...params));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
