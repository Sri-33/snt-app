import { Router } from 'express';
import db from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

async function postToN8n(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Webhook failed (${response.status}): ${text || response.statusText}`);
  }

  return response.json().catch(() => ({ success: true }));
}

function getSetting(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row?.value;
}

router.post('/tracking', async (req, res) => {
  try {
    const { customerPhone, customerName, trackingNumber, courierService, orderId } = req.body;

    if (!trackingNumber) {
      return res.status(400).json({ error: 'Tracking number is required' });
    }

    const webhookUrl = getSetting('n8n_tracking_webhook');
    const payload = {
      customerPhone: customerPhone || '',
      customerName: customerName || '',
      trackingNumber,
      courierService: courierService || '',
      orderId: orderId || null,
    };

    const result = await postToN8n(webhookUrl, payload);
    res.json({ success: true, message: 'Tracking sent', result });
  } catch (err) {
    res.status(502).json({ error: err.message, retryable: true });
  }
});

router.post('/email-report', requireAdmin, async (req, res) => {
  try {
    const { email, subject, reportType, data, dateFrom, dateTo } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const webhookUrl = getSetting('n8n_email_webhook');
    const payload = {
      email,
      subject: subject || 'SNT Courier Report',
      reportType: reportType || 'csv',
      dateFrom,
      dateTo,
      data,
      sentAt: new Date().toISOString(),
    };

    const result = await postToN8n(webhookUrl, payload);
    res.json({ success: true, message: 'Email report queued', result });
  } catch (err) {
    res.status(502).json({ error: err.message, retryable: true });
  }
});

router.get('/settings', (req, res) => {
  try {
    const adminPin = getSetting('admin_pin');
    const staffPin = getSetting('staff_pin');
    res.json({ adminPin, staffPin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
