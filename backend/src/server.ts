import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import apiRouter from './routes/api';

import fs from 'fs';
import os from 'os';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB initial attempt (only in persistent/local server mode)
if (!process.env.VERCEL) {
  connectDB().catch((err) => {
    console.warn('Initial MongoDB connection deferred:', err.message);
  });
}

// Configure CORS
const corsOptions: cors.CorsOptions = {
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Healthcheck endpoints (both root and /api) - defined BEFORE DB middleware so healthchecks ALWAYS succeed
const healthHandler = (_req: express.Request, res: express.Response) => {
  res.json({
    status: 'online',
    service: 'AgriBioTech Management & Farmer Advisory Platform API',
    database: 'MongoDB',
    timestamp: new Date().toISOString(),
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Ensure DB connection for request (critical for serverless cold-starts & connection reuse)
app.use(async (_req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err: any) {
    console.error('Database connection error in request middleware:', err.message);
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Database connection failed',
        message: err.message,
        tip: 'Ensure MONGODB_URI is configured in Vercel Environment Variables and Network Access includes 0.0.0.0/0 in MongoDB Atlas.',
      });
    }
  }
});

// Serve static uploads
const uploadsPath = process.env.VERCEL
  ? path.join(os.tmpdir(), 'agribiotech-uploads')
  : path.join(__dirname, '../uploads');

if (fs.existsSync(uploadsPath)) {
  app.use('/uploads', express.static(uploadsPath));
}

// API Routes mounted on both /api and root /
// This ensures that whether requests arrive with or without the /api prefix (e.g., via Vercel function rewrites or direct API gateways), Express resolves the endpoint correctly.
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error', message: err?.message });
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

if (!process.env.VERCEL) {
  process.on('exit', (code) => {
    console.log(`Node process exited with code: ${code}`);
  });

  process.on('SIGINT', () => {
    console.log('Received SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('Received SIGTERM');
    process.exit(0);
  });
}

// In serverless environments (e.g., Vercel), app is exported without calling app.listen()
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🌾 AgriBioTech Platform Server running on port ${PORT}`);
    console.log(`📡 REST API mounted at http://localhost:${PORT}/api and http://localhost:${PORT}/`);
  });
}

// Dual export for maximum serverless runtime compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = app;
  // @ts-ignore
  module.exports.default = app;
}

export default app;
