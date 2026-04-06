const windows = new Map();

function createLimiter(max, windowMs, keyFn) {
  return (req, res, next) => {
    const key = keyFn(req);
    const now = Date.now();

    let timestamps = windows.get(key);
    if (!timestamps) {
      timestamps = [];
      windows.set(key, timestamps);
    }

    // Drop timestamps outside the window
    while (timestamps.length && timestamps[0] <= now - windowMs) {
      timestamps.shift();
    }

    if (timestamps.length >= max) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded. Maximum ${max} requests per minute.`,
        },
      });
    }

    timestamps.push(now);
    next();
  };
}

const globalLimiter = createLimiter(100, 60_000, (req) => req.ip);

const keyLimiter = createLimiter(50, 60_000, (req) =>
  req.developer ? `key:${req.developer.apiKeyId}` : req.ip
);

module.exports = { globalLimiter, keyLimiter };
