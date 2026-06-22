import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', (req, res) => {
  try {
    const { q } = req.query;
    if (q) {
      const rows = db.prepare(`
        SELECT * FROM saved_addresses
        WHERE name LIKE ? OR address LIKE ? OR city LIKE ?
        ORDER BY name ASC
        LIMIT 20
      `).all(`%${q}%`, `%${q}%`, `%${q}%`);
      return res.json(rows);
    }
    const rows = db.prepare('SELECT * FROM saved_addresses ORDER BY name ASC').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, address, city, district, state, pin, phone } = req.body;
    const result = db.prepare(`
      INSERT INTO saved_addresses (name, address, city, district, state, pin, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, address, city || null, district || null, state || null, pin || null, phone || null);

    const row = db.prepare('SELECT * FROM saved_addresses WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM saved_addresses WHERE id = ?').run(req.params.id);
    if (!result.changes) return res.status(404).json({ error: 'Address not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
