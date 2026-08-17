import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import noteRoutes from './routes/note.routes.js';
import cronRoutes from './routes/cron.routes.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow flexibility if embedded or serving API
    crossOriginEmbedderPolicy: false,
  })
);

// CORS setup
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev, configurable in prod
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-note-password', 'x-cron-secret'],
  })
);

// Body Parsers with configurable limits (default 5MB)
const maxBodySize = process.env.MAX_NOTE_SIZE ? `${Math.ceil(parseInt(process.env.MAX_NOTE_SIZE, 10) / (1024 * 1024))}mb` : '5mb';
app.use(express.json({ limit: maxBodySize }));
app.use(express.urlencoded({ extended: true, limit: maxBodySize }));

// General Rate Limiter on all /api routes
app.use('/api', generalLimiter);

// Root and Health Check
app.get('/', (req, res) => {
  if (req.accepts('html')) {
    res.status(200).type('html').send(`<!DOCTYPE html>
<html>
<head><title>TempNotes API</title></head>
<body>
<h1>TempNotes backend is running</h1>
<p>This is an API-only service. See <a href="/api/health">/api/health</a>.</p>
</body>
</html>`);
    return;
  }
  res.status(200).json({
    status: 'ok',
    message: 'TEMPTEXTS backend is running',
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'TEMPTEXTS backend is running',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Main Routes
app.use('/api/notes', noteRoutes);
app.use('/api/cron', cronRoutes);

// 404 Fallback for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'ENDPOINT_NOT_FOUND',
    message: `API route ${req.originalUrl} not found`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
