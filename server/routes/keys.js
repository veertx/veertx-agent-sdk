const { Router } = require('express');
const { z } = require('zod');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const db = require('../db/database');

const router = Router();

const createKeySchema = z.object({
  email: z.string().email(),
});

// POST /v1/keys -- create new API key for developer
router.post('/', async (req, res, next) => {
  try {
    const parsed = createKeySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues.map((i) => i.message).join('; '),
        },
      });
    }

    const { email } = parsed.data;

    // Find or create developer
    let developer = db
      .prepare('SELECT id, email FROM developers WHERE email = ?')
      .get(email);

    if (!developer) {
      const result = db
        .prepare('INSERT INTO developers (email) VALUES (?)')
        .run(email);
      developer = { id: result.lastInsertRowid, email };
    }

    // Generate API key: vrtx_live_ + 32 random hex chars
    const random = crypto.randomBytes(16).toString('hex');
    const apiKey = `vrtx_live_${random}`;
    const prefix = `vrtx_live_${random.slice(0, 8)}`;

    // Hash with HMAC-SHA256
    const keyHash = crypto.createHmac('sha256', process.env.API_KEY_SECRET).update(apiKey).digest('hex');

    db.prepare(
      'INSERT INTO api_keys (developer_id, key_hash, prefix) VALUES (?, ?, ?)'
    ).run(developer.id, keyHash, prefix);

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

// GET /v1/keys -- list developer's keys (prefix only)
router.get('/', auth, (req, res) => {
  const keys = db
    .prepare(
      'SELECT id, prefix, status, created_at FROM api_keys WHERE developer_id = ?'
    )
    .all(req.developer.id);

  return res.json({
    success: true,
    data: { keys },
  });
});

// DELETE /v1/keys/:id -- revoke a key
router.delete('/:id', auth, (req, res) => {
  const keyId = parseInt(req.params.id, 10);

  if (isNaN(keyId)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid key ID',
      },
    });
  }

  const result = db
    .prepare(
      "UPDATE api_keys SET status = 'revoked' WHERE id = ? AND developer_id = ?"
    )
    .run(keyId, req.developer.id);

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'API key not found or already revoked',
      },
    });
  }

  return res.json({
    success: true,
    data: { message: 'API key revoked' },
  });
});

module.exports = router;
