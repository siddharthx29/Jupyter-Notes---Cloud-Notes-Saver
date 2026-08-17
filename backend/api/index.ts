import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import noteRoutes from '../src/routes/note.routes.js';
import cronRoutes from '../src/routes/cron.routes.js';
import { generalLimiter } from '../src/middleware/rateLimiter.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

const allowedOrigins = (process.env.CORS_ORIGIN || 'https://localhostree.netlify.app,http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-note-password', 'x-cron-secret'],
  })
);

const maxBodySize = process.env.MAX_NOTE_SIZE ? `${Math.ceil(parseInt(process.env.MAX_NOTE_SIZE, 10) / (1024 * 1024))}mb` : '5mb';
app.use(express.json({ limit: maxBodySize }));
app.use(express.urlencoded({ extended: true, limit: maxBodySize }));

app.use('/api', generalLimiter);

// Health check endpoint
app.get(['/api/health', '/health'], (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'TEMPTEXTS backend is running',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Root landing handler
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

// API Routes
app.use(['/api/notes', '/notes'], noteRoutes);
app.use(['/api/cron', '/cron'], cronRoutes);

// Error handling
app.use(errorHandler);

export default app;
