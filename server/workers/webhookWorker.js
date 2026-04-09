const { Worker } = require('bullmq');
const { createHmac } = require('crypto');
const IORedis = require('ioredis');

const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  maxRetriesPerRequest: null,
});

const worker = new Worker('webhookDispatch', async (job) => {
  const { webhook_url, webhook_secret, payload } = job.data;

  const timestamp = Math.floor(Date.now() / 1000);
  const body = JSON.stringify(payload);
  const signedPayload = `${timestamp}.${body}`;
  const signature = createHmac('sha256', webhook_secret).update(signedPayload).digest('hex');
  const sigHeader = `t=${timestamp},v1=${signature}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'VeerTx-Signature': sigHeader,
      },
      body,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) {
      throw new Error(`Webhook returned ${response.status}`);
    }
    console.log(`[webhook] Delivered to ${webhook_url} -- status ${response.status}`);
  } catch (err) {
    clearTimeout(timeout);
    console.error(`[webhook] Failed to deliver to ${webhook_url}: ${err.message}`);
    throw err;
  }
}, {
  connection: redisConnection,
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
});

worker.on('failed', (job, err) => {
  console.error(`[webhook] Job ${job.id} failed after all retries: ${err.message}`);
});

console.log('[webhook] Worker started');

module.exports = worker;
