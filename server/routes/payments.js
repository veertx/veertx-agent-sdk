const { Router } = require('express');
const auth = require('../middleware/auth');

const router = Router();

router.get('/:id/status', auth, async (req, res, next) => {
  try {
    const response = await fetch(`http://127.0.0.1:3000/internal/payments/${req.params.id}/status`);
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    return res.json(data);
  } catch (err) {
    next(err);
  }
});

const { randomUUID } = require('crypto');

router.post('/create', auth, async (req, res, next) => {
  try {
    const idempotencyKey = req.headers['idempotency-key'];
    if (!idempotencyKey) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_IDEMPOTENCY_KEY', message: 'Idempotency-Key header is required' }
      });
    }

    const { amount, currency, target_username, memo, webhook_url } = req.body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'amount must be a positive number' } });
    }
    if (!currency || !['SOL', 'USDC'].includes(currency)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'currency must be SOL or USDC' } });
    }
    if (!target_username || typeof target_username !== 'string') {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'target_username is required' } });
    }
    if (memo && memo.length > 140) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'memo must be 140 chars or less' } });
    }

    const response = await fetch('http://127.0.0.1:3000/internal/payments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency, target_username, memo, webhook_url, idempotency_key: idempotencyKey })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    return res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
