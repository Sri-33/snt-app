import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

const listQuery = `
  SELECT * FROM entries
  WHERE 1=1
`;

function buildFilters(query) {
  const { date, dateFrom, dateTo, courier, state, cod_prepaid, ids } = query;
  let sql = listQuery;
  const params = [];

  if (date) {
    sql += ' AND date = ?';
    params.push(date);
  }
  if (dateFrom) {
    sql += ' AND date >= ?';
    params.push(dateFrom);
  }
  if (dateTo) {
    sql += ' AND date <= ?';
    params.push(dateTo);
  }
  if (courier) {
    sql += ' AND courier = ?';
    params.push(courier);
  }
  if (state) {
    sql += ' AND to_state = ?';
    params.push(state);
  }
  if (cod_prepaid) {
    sql += ' AND cod_prepaid = ?';
    params.push(cod_prepaid);
  }
  if (ids) {
    const idList = ids.split(',').map((id) => parseInt(id, 10)).filter(Boolean);
    if (idList.length) {
      sql += ` AND id IN (${idList.map(() => '?').join(',')})`;
      params.push(...idList);
    }
  }

  sql += ' ORDER BY created_at DESC';
  return { sql, params };
}

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
    const row = db.prepare('SELECT * FROM entries WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Entry not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const {
      date, courier, cod_prepaid, from_type, from_address, bundle_weight,
      to_name, to_address, to_city, to_district, to_state, to_pin, to_phone,
      tracking, amount, notes,
    } = req.body;

    const stmt = db.prepare(`
      INSERT INTO entries (
        date, courier, cod_prepaid, from_type, from_address, bundle_weight,
        to_name, to_address, to_city, to_district, to_state, to_pin, to_phone,
        tracking, amount, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      date, courier, cod_prepaid || null, from_type || 'snt', from_address || null,
      bundle_weight || null, to_name, to_address, to_city || null, to_district || null,
      to_state || null, to_pin || null, to_phone || null, tracking || null,
      amount || null, notes || null
    );

    const entry = db.prepare('SELECT * FROM entries WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM entries WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Entry not found' });

    const fields = [
      'date', 'courier', 'cod_prepaid', 'from_type', 'from_address', 'bundle_weight',
      'to_name', 'to_address', 'to_city', 'to_district', 'to_state', 'to_pin', 'to_phone',
      'tracking', 'amount', 'notes',
    ];

    const updates = [];
    const values = [];
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }

    if (!updates.length) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);
    db.prepare(`UPDATE entries SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const entry = db.prepare('SELECT * FROM entries WHERE id = ?').get(req.params.id);
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM entries WHERE id = ?').run(req.params.id);
    if (!result.changes) return res.status(404).json({ error: 'Entry not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
