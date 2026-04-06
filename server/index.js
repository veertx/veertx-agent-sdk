require('dotenv').config();

const express = require('express');
const pino = require('pino');
const { globalLimiter } = require('./middleware/rateLimiter');
const swapRouter = require('./routes/swap');
const keysRouter = require('./routes/keys');

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const app = express();

app.use(express.json());

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
