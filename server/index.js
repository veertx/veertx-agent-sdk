require('dotenv').config();

const express = require('express');
const path = require('path');
const pino = require('pino');
const { globalLimiter } = require('./middleware/rateLimiter');
const swapRouter = require('./routes/swap');
const keysRouter = require('./routes/keys');
const db = require('./db/database');

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const app = express();

const cors = require('cors');
app.set('trust proxy', 1);
app.use(cors({
  origin: 'https://agents.veertx.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
}));

app.use(express.json());

const cookieParser = require('cookie-parser');
app.use(cookieParser());

const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://challenges.cloudflare.com"],
      frameSrc: ["'self'", "https://challenges.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      connectSrc: ["'self'", "https://challenges.cloudflare.com"],
      upgradeInsecureRequests: [],
      objectSrc: ["'none'"],
    },
  }
}));

// Log all requests
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      ms: Date.now() - start,
    });
  });
  next();
});

// Global rate limiter
app.use(globalLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

// Routes
app.use('/v1/swap', swapRouter);
app.use('/v1/keys', keysRouter);
const portalRouter = require('./routes/portal');
app.use('/v1/portal', portalRouter);

// Static files and clean URLs
app.use(express.static(path.join(__dirname, '../public'), { index: false }));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../public/login.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, '../public/dashboard.html')));

// Error handler
app.use((err, _req, res, _next) => {
  logger.error({ err: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`VeerTx Agent API listening on port ${PORT}`);
});

// Hourly cleanup of expired sessions and magic tokens
setInterval(() => {
  const now = Math.floor(Date.now() / 1000);
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now);
  db.prepare('DELETE FROM magic_tokens WHERE expires_at < ?').run(now);
}, 60 * 60 * 1000);
