import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { router } from './routes';
import { errorHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  app.use('/api', router);

  // Serve frontend static files in production
  const clientDist = path.resolve(__dirname, '../../dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    // SPA fallback — all non-API routes serve index.html
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  } else {
    // Development: no static files, return 404 for unknown routes
    app.use((_req, res) => {
      res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: `Route not found: ${_req.method} ${_req.originalUrl}` },
      });
    });
  }

  app.use(errorHandler);

  return app;
}
