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

module.exports = router;
