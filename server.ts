import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';

const isProduction = process.env.NODE_ENV === 'production';
const PORT = 3000;

async function startServer() {
  const app = express();

  // Allow parsing large JSON payloads for ERP data with images/attachments
  app.use(express.json({ limit: '60mb' }));
  app.use(express.urlencoded({ extended: true, limit: '60mb' }));

  const DATA_DIR = path.resolve(process.cwd(), 'data');
  const DB_FILE = path.join(DATA_DIR, 'sinotrack_database.json');

  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.error('Error creating data directory:', e);
    }
  }

  // API Endpoints for persistent server-side storage
  app.get('/api/db', (req, res) => {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const data = JSON.parse(raw);
        return res.json({ success: true, data });
      }
      return res.json({ success: true, data: null });
    } catch (err: any) {
      console.error('Error reading db file:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Failed to read database' });
    }
  });

  app.post('/api/db', (req, res) => {
    try {
      const { data } = req.body;
      if (!data) {
        return res.status(400).json({ success: false, error: 'No data provided' });
      }

      // Safe atomic-like write: write to temp file then rename
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);

      return res.json({ success: true, timestamp: new Date().toISOString() });
    } catch (err: any) {
      console.error('Error saving db file:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Failed to save database' });
    }
  });

  app.post('/api/db/reset', (req, res) => {
    try {
      if (fs.existsSync(DB_FILE)) {
        fs.unlinkSync(DB_FILE);
      }
      return res.json({ success: true, message: 'Server database reset successfully' });
    } catch (err: any) {
      console.error('Error resetting db file:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Failed to reset database' });
    }
  });

  app.get('/api/health', (req, res) => {
    const hasDbFile = fs.existsSync(DB_FILE);
    let fileSize = 0;
    if (hasDbFile) {
      try {
        fileSize = fs.statSync(DB_FILE).size;
      } catch {
        // ignore
      }
    }
    return res.json({
      status: 'ok',
      hasDbFile,
      dbSizeBytes: fileSize,
      timestamp: new Date().toISOString(),
    });
  });

  // Setup Vite in development or static serve in production
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SinoTrack Server] Express full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[SinoTrack Server] Fatal error starting server:', err);
  process.exit(1);
});
