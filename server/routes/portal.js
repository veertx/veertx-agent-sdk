const { Router } = require('express');
const crypto = require('crypto');
const { Resend } = require('resend');
const db = require('../db/database');
const portalAuth = require('../middleware/portalAuth');
const rateLimit = require('express-rate-limit');

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Try again in 15 minutes.' } },
});

// POST /v1/portal/auth/login
router.post('/auth/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, turnstileToken } = req.body;

    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid email' },
      });
    }

    // Verify Turnstile
    const tsRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
      }),
    });
    const tsData = await tsRes.json();

    if (!tsData.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'TURNSTILE_FAILED', message: 'Bot verification failed' },
      });
    }

    // Find or create developer
    let developer = db
      .prepare('SELECT id FROM developers WHERE email = ?')
      .get(email);

    if (!developer) {
      const result = db
        .prepare('INSERT INTO developers (email) VALUES (?)')
        .run(email);
      developer = { id: result.lastInsertRowid };
    }

    // Generate magic token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const now = Math.floor(Date.now() / 1000);

    db.prepare(
      'INSERT INTO magic_tokens (developer_id, token_hash, expires_at, used) VALUES (?, ?, ?, 0)'
    ).run(developer.id, tokenHash, now + 15 * 60);

    // Send magic link email
    await resend.emails.send({
      from: 'noreply@veertx.com',
      to: email,
      subject: 'VeerTx Login Link',
      html: `<p>Click to log in:</p><p><a href="https://agents.veertx.com/v1/portal/auth/verify?token=${rawToken}">Log in to VeerTx</a></p><p>This link expires in 15 minutes.</p>`,
    });

    return res.json({
      success: true,
      message: 'Check your email for a login link',
    });
  } catch (err) {
    next(err);
  }
});

// GET /v1/portal/auth/verify
router.get('/auth/verify', async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Missing token' },
      });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const now = Math.floor(Date.now() / 1000);

    const row = db
      .prepare('SELECT id, developer_id FROM magic_tokens WHERE token_hash = ? AND used = 0 AND expires_at > ?')
      .get(tokenHash, now);

    if (!row) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Token expired or already used' },
      });
    }

    db.prepare('UPDATE magic_tokens SET used = 1 WHERE id = ?').run(row.id);

    // Create session
    const rawSession = crypto.randomBytes(32).toString('hex');
    const sessionHash = crypto.createHash('sha256').update(rawSession).digest('hex');
    const sevenDays = 7 * 24 * 60 * 60;

    db.prepare(
      'INSERT INTO sessions (developer_id, session_hash, expires_at) VALUES (?, ?, ?)'
    ).run(row.developer_id, sessionHash, now + sevenDays);

    res.cookie('vrtx_session', rawSession, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: sevenDays * 1000,
    });

    return res.redirect('/dashboard');
  } catch (err) {
    next(err);
  }
});

// GET /v1/portal/keys
router.get('/keys', portalAuth, (req, res) => {
  const keys = db
    .prepare('SELECT id, prefix, status, created_at FROM api_keys WHERE developer_id = ?')
    .all(req.developerId);

  return res.json({ success: true, data: { keys } });
});

// POST /v1/portal/keys
router.post('/keys', portalAuth, (req, res, next) => {
  try {
    const random = crypto.randomBytes(16).toString('hex');
    const apiKey = `vrtx_live_${random}`;
    const prefix = `vrtx_live_${random.slice(0, 8)}`;
    const keyHash = crypto.createHmac('sha256', process.env.API_KEY_SECRET).update(apiKey).digest('hex');

    db.prepare(
      'INSERT INTO api_keys (developer_id, key_hash, prefix) VALUES (?, ?, ?)'
    ).run(req.developerId, keyHash, prefix);

    return res.status(201).json({
      success: true,
      data: {
        apiKey,
        prefix,
        message: 'Save this key now. It will not be shown again.',
      },
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /v1/portal/keys/:id
router.delete('/keys/:id', portalAuth, (req, res) => {
  const keyId = parseInt(req.params.id, 10);

  if (isNaN(keyId)) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid key ID' },
    });
  }

  const result = db
    .prepare("UPDATE api_keys SET status = 'revoked' WHERE id = ? AND developer_id = ?")
    .run(keyId, req.developerId);

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'API key not found or already revoked' },
    });
  }

  return res.json({ success: true, data: { message: 'API key revoked' } });
});

// POST /v1/portal/auth/logout
router.post('/auth/logout', (req, res) => {
  const raw = req.cookies?.vrtx_session;

  if (raw) {
    const sessionHash = crypto.createHash('sha256').update(raw).digest('hex');
    db.prepare('DELETE FROM sessions WHERE session_hash = ?').run(sessionHash);
  }

  res.clearCookie('vrtx_session', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  });

  return res.json({ success: true, message: 'Logged out' });
});

// GET /v1/portal/stats
router.get('/stats', portalAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT strftime('%Y-%m-%d', t.created_at) AS date, COUNT(*) AS count
    FROM transactions t
    JOIN api_keys ak ON ak.id = t.api_key_id
    WHERE ak.developer_id = ?
      AND t.created_at >= datetime('now', '-7 days')
    GROUP BY date
    ORDER BY date
  `).all(req.developerId);

  const counts = Object.fromEntries(rows.map(r => [r.date, r.count]));
  const stats = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    stats.push({ date: key, count: counts[key] || 0 });
  }

  return res.json({ success: true, data: { timezone: 'UTC', stats } });
});

module.exports = router;
