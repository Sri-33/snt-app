import { Router } from 'express';
import db from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAdmin);

function dateFilter(dateFrom, dateTo) {
  const params = [];
  let clause = '';
  if (dateFrom) {
    clause += ' AND date >= ?';
    params.push(dateFrom);
  }
  if (dateTo) {
    clause += ' AND date <= ?';
    params.push(dateTo);
  }
  return { clause, params };
}

router.get('/', (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const { clause, params } = dateFilter(dateFrom, dateTo);

    const dailyTotals = db.prepare(`
      SELECT date, COUNT(*) as count
      FROM entries
      WHERE date >= date('now', '-30 days') ${clause}
      GROUP BY date
      ORDER BY date ASC
    `).all(...params);

    const courierBreakdown = db.prepare(`
      SELECT courier, COUNT(*) as count
      FROM entries
      WHERE 1=1 ${clause}
      GROUP BY courier
      ORDER BY count DESC
    `).all(...params);

    const stateBreakdown = db.prepare(`
      SELECT to_state as state, COUNT(*) as count
      FROM entries
      WHERE to_state IS NOT NULL AND to_state != '' ${clause}
      GROUP BY to_state
      ORDER BY count DESC
      LIMIT 10
    `).all(...params);

    const districtBreakdown = db.prepare(`
      SELECT to_district as district, to_state as state, COUNT(*) as count
      FROM entries
      WHERE to_district IS NOT NULL AND to_district != '' ${clause}
      GROUP BY to_district, to_state
      ORDER BY count DESC
    `).all(...params);

    const codPrepaid = db.prepare(`
      SELECT cod_prepaid, COUNT(*) as count
      FROM entries
      WHERE cod_prepaid IS NOT NULL AND cod_prepaid != '' ${clause}
      GROUP BY cod_prepaid
    `).all(...params);

    const locationDispatches = db.prepare(`
      SELECT to_city as city, to_district as district, to_state as state, COUNT(*) as count
      FROM entries
      WHERE to_city IS NOT NULL ${clause}
      GROUP BY to_city, to_district, to_state
      ORDER BY count DESC
      LIMIT 50
    `).all(...params);

    const totalEntries = db.prepare(`
      SELECT COUNT(*) as total FROM entries WHERE 1=1 ${clause}
    `).get(...params);

    const totalCodAmount = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM entries
      WHERE cod_prepaid = 'COD' ${clause}
    `).get(...params);

    res.json({
      dailyTotals,
      courierBreakdown,
      stateBreakdown,
      districtBreakdown,
      codPrepaid,
      locationDispatches,
      summary: {
        totalEntries: totalEntries?.total || 0,
        totalCodAmount: totalCodAmount?.total || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/export', (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const { clause, params } = dateFilter(dateFrom, dateTo);

    const rows = db.prepare(`
      SELECT * FROM entries WHERE 1=1 ${clause} ORDER BY date DESC, created_at DESC
    `).all(...params);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
