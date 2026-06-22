import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import './db.js';
import entriesRouter from './routes/entries.js';
import addressesRouter from './routes/addresses.js';
import analyticsRouter from './routes/analytics.js';
import webhookRouter from './routes/webhook.js';
import salesRouter from './routes/sales.js';
import retailBillsRouter from './routes/retailBills.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'SNT Courier Manager' });
});

const SERVER_VERSION = process.env.SERVER_VERSION || '1.0.0';
app.get('/api/version', (_req, res) => {
  res.json({ version: SERVER_VERSION, message: 'Latest version' });
});

app.use('/api/entries', entriesRouter);
app.use('/api/addresses', addressesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/webhook', webhookRouter);
app.use('/api/sales', salesRouter);
app.use('/api/retail-bills', retailBillsRouter);

const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) res.status(404).send('Client not built. Run: cd client && npm run build');
  });
});

app.listen(PORT, () => {
  console.log(`SNT server running on port ${PORT}`);
});
