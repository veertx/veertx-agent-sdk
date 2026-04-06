const { Router } = require('express');
const { z } = require('zod');
const { PublicKey } = require('@solana/web3.js');
const auth = require('../middleware/auth');
const { keyLimiter } = require('../middleware/rateLimiter');
const db = require('../db/database');
const jupiter = require('../services/jupiter');

const router = Router();

const swapSchema = z.object({
  inputToken: z.string().min(1),
  outputToken: z.string().min(1),
  amount: z.number().positive().finite(),
  agentPublicKey: z.string().refine(
    (val) => {
      try {
        new PublicKey(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Invalid Solana public key (must be valid base58)' }
  ),
  slippageBps: z.number().int().min(0).max(10000).optional().default(50),
});

router.post('/', auth, keyLimiter, async (req, res, next) => {
  try {
    // Require Idempotency-Key header
    const idempotencyKey = req.headers['idempotency-key'];
    if (!idempotencyKey) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_IDEMPOTENCY_KEY',
          message: 'Idempotency-Key header is required',
        },
      });
    }

    // Check for duplicate idempotency key
    const existing = db
      .prepare(
        'SELECT id FROM transactions WHERE idempotency_key = ? AND api_key_id = ?'
      )
      .get(idempotencyKey, req.developer.apiKeyId);

    if (existing) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_IDEMPOTENCY_KEY',
          message: 'This Idempotency-Key has already been used',
        },
      });
    }

    // Validate request body
    const parsed = swapSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues.map((i) => i.message).join('; '),
        },
      });
    }

    const { inputToken, outputToken, amount, agentPublicKey, slippageBps } =
      parsed.data;

    // Resolve mint addresses (accept either symbol or mint address)
    const inputMint = jupiter.getMintAddress(inputToken) || inputToken;
    const outputMint = jupiter.getMintAddress(outputToken) || outputToken;

    // Get Jupiter quote
    const quoteResponse = await jupiter.getQuote(
      inputMint,
      outputMint,
      amount,
      slippageBps
    );

    // Build unsigned transaction
    const transaction = await jupiter.buildSwapTransaction(
      quoteResponse,
      agentPublicKey
    );

    // Log transaction to database
    db.prepare(
      `INSERT INTO transactions (api_key_id, input_token, output_token, amount, fee_bps, idempotency_key)
       VALUES (?, ?, ?, ?, 50, ?)`
    ).run(
      req.developer.apiKeyId,
      inputMint,
      outputMint,
      String(amount),
      idempotencyKey
    );

    return res.json({
      success: true,
      transaction,
      quote: {
        inputAmount: quoteResponse.inAmount,
        outputAmount: quoteResponse.outAmount,
        fee: quoteResponse.platformFee || null,
      },
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

module.exports = router;
