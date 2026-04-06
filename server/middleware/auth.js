const argon2 = require('argon2');
const db = require('../db/database');

async function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid Authorization header',
      },
    });
  }

  const apiKey = header.slice(7);

  if (!apiKey.startsWith('vrtx_live_') && !apiKey.startsWith('vrtx_test_')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid API key format',
      },
    });
  }

  const mode = apiKey.startsWith('vrtx_live_') ? 'vrtx_live_' : 'vrtx_test_';
  const prefix = mode + apiKey.slice(mode.length, mode.length + 8);

  const row = db
    .prepare(
      `SELECT ak.id AS api_key_id, ak.key_hash, d.id AS developer_id, d.email
       FROM api_keys ak
       JOIN developers d ON ak.developer_id = d.id
       WHERE ak.prefix = ? AND ak.status = 'active'`
    )
    .get(prefix);

  if (!row) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or revoked API key',
      },
    });
  }

  let valid;
  try {
    valid = await argon2.verify(row.key_hash, apiKey);
  } catch (_) {
    valid = false;
  }

  if (!valid) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid API key',
      },
    });
  }

  req.developer = {
    id: row.developer_id,
    email: row.email,
    apiKeyId: row.api_key_id,
  };

  next();
}

module.exports = auth;
