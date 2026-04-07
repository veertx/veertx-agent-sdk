const { Router } = require('express');
const auth = require('../middleware/auth');
const db = require('../db/database');

const router = Router();

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
