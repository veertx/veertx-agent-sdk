const { Router } = require('express');
const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const db = require('../db/database');

const router = Router();

const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  maxRetriesPerRequest: null,
});

const webhookQueue = new Queue('webhookDispatch', { connection: redisConnection });

function isValidWebhookUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    const h = parsed.hostname;
    if (h === 'localhost') return false;
    if (/^127\./.test(h)) return false;
    if (/^10\./.test(h)) return false;
    if (/^192\.168\./.test(h)) return false;
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(h)) return false;
    if (h === '169.254.169.254') return false;
    return true;
  } catch {
    return false;
  }
}

router.post('/trigger', (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  if (ip !== '127.0.0.1' && ip !== '::1' && ip !== '::ffff:127.0.0.1') {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }

  const { payment_id, deposit_address, amount_sol, target_username, claimed_at, webhook_url, agent_developer_id } = req.body;

  if (!webhook_url || !isValidWebhookUrl(webhook_url)) {
    return res.status(400).json({ success: false, error: 'Invalid or missing webhook_url' });
  }

  const developer = db.prepare('SELECT webhook_secret FROM developers WHERE id = ?').get(agent_developer_id);
  if (!developer || !developer.webhook_secret) {
    return res.status(404).json({ success: false, error: 'Developer or webhook secret not found' });
  }

  const payload = {
    event: 'payment.claimed',
    payment_id,
    deposit_address,
    amount_sol,
    target_username,
    claimed_at,
  };

  webhookQueue.add('dispatch', {
    webhook_url,
    webhook_secret: developer.webhook_secret,
    payload,
  });

  return res.json({ success: true, message: 'Webhook queued' });
});

module.exports = router;
module.exports.webhookQueue = webhookQueue;
