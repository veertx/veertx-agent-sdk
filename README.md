# VeerTx Agent API

The VeerTx Agent API is a non-custodial middleware layer designed specifically for AI agents trading on Solana.

We abstract away the complexity of blockchain routing by preparing optimal transactions via the Jupiter Aggregator. **We never hold your funds or private keys.** You send us the swap parameters, we return a serialized Base64 transaction, and your agent signs and executes it locally.

**Base URL:** `https://agents.veertx.com`

---

## Overview

- **Non-Custodial:** Private keys never leave your agent's local environment.
- **Optimal Routing:** Powered by Jupiter for the best prices and execution across all Solana DEXs.
- **Simple Integration:** One API call returns a ready-to-sign transaction.
- **Transparent Fees:** A standard 0.5% referral fee is applied to the swap via Jupiter's protocol. No hidden markups.

---

## Authentication

All API requests require an active API key. Generate one instantly at the [VeerTx Developer Portal](https://agents.veertx.com).
```http
Authorization: Bearer vrtx_live_your_api_key_here
```

---

## Endpoints

### POST /v1/swap

Constructs an unsigned transaction for your AI agent to sign.

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer vrtx_live_...`
- `Idempotency-Key: <UUID>` (Required -- prevents duplicate execution on retries)

**Request Payload:**

| Field | Type | Description |
| :--- | :--- | :--- |
| inputToken | string | Solana mint address of the token you are selling |
| outputToken | string | Solana mint address of the token you are buying |
| amount | string | Amount in lamports as a string |
| agentPublicKey | string | Base58 public key of the wallet that will sign |
| slippageBps | number | Slippage tolerance in basis points (e.g. 50 = 0.5%) |

**Example Request:**
```bash
curl -X POST https://agents.veertx.com/v1/swap \
  -H "Authorization: Bearer vrtx_live_..." \
  -H "Idempotency-Key: 123e4567-e89b-12d3-a456-426614174000" \
  -H "Content-Type: application/json" \
  -d '{
    "inputToken": "So11111111111111111111111111111111111111112",
    "outputToken": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "amount": "100000000",
    "agentPublicKey": "YourAgentWalletPublicKeyHere",
    "slippageBps": 50
  }'
```

**Example Response:**
```json
{
  "success": true,
  "transaction": "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA...",
  "quote": {
    "inputAmount": "100000000",
    "outputAmount": "785204",
    "fee": {
      "amount": "3945",
      "feeBps": 50
    }
  }
}
```

---

## Execution Guide (Node.js)
```typescript
import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';

const connection = new Connection('https://api.mainnet-beta.solana.com');
const agentKeypair = Keypair.fromSecretKey(bs58.decode('YOUR_PRIVATE_KEY'));

async function executeSwap() {
  const response = await fetch('https://agents.veertx.com/v1/swap', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer vrtx_live_...',
      'Idempotency-Key': crypto.randomUUID()
    },
    body: JSON.stringify({
      inputToken: 'So11111111111111111111111111111111111111112',
      outputToken: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      amount: '10000000',
      agentPublicKey: agentKeypair.publicKey.toBase58(),
      slippageBps: 50
    })
  });

  const { transaction } = await response.json();
  const txBuffer = Buffer.from(transaction, 'base64');
  const tx = VersionedTransaction.deserialize(txBuffer);

  tx.sign([agentKeypair]);

  const signature = await connection.sendTransaction(tx, {
    maxRetries: 3,
    preflightCommitment: 'confirmed'
  });

  console.log(`Swap executed! Signature: ${signature}`);
}

executeSwap();
```

---

## Links

- [Developer Portal](https://agents.veertx.com)
- [Documentation](https://veertx.gitbook.io/veertx-docs)
- [X](https://x.com/VeerTx) · [Discord](https://discord.gg/tNf5pDVVCe) · [Telegram](https://t.me/VeerTx)
