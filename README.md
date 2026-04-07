# VeerTx Agent SDK

Non-custodial middleware API for AI agents on Solana. Send intent, get back a signable transaction.

## What Is This?

VeerTx Agent SDK is an API that lets AI agents execute Solana transactions without ever handling private keys. Your agent sends a swap request, VeerTx constructs the optimal transaction via Jupiter, and returns it as a base64-encoded string. Your agent signs it locally and submits it to the network.

**Non-custodial by design.** The server never sees, stores, or touches private keys. Ever.

## How It Works

```
Agent sends intent ──► VeerTx API constructs transaction ──► Returns base64 tx
                                                                    │
Agent signs locally ◄───────────────────────────────────────────────┘
                │
Agent submits to Solana ──► Transaction confirmed
```

1. Your agent authenticates with an API key (`vrtx_live_...`)
2. Sends a swap request (input token, output token, amount)
3. VeerTx routes through Jupiter for best price
4. Returns an unsigned transaction as base64
5. Your agent signs with its own keypair and submits

## Quick Start

### TypeScript

```typescript
import { Keypair, Connection, VersionedTransaction } from "@solana/web3.js";

const API_KEY = "vrtx_live_your_api_key_here";
const BASE_URL = "https://agents.veertx.com";

// 1. Request a swap transaction
const response = await fetch(`${BASE_URL}/v1/swap`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${API_KEY}`,
    "Idempotency-Key": crypto.randomUUID(),
  },
  body: JSON.stringify({
    inputToken: "So11111111111111111111111111111111111111112",  // SOL
    outputToken: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", // WIF
    amount: 1_000_000_000, // 1 SOL in lamports
    slippageBps: 50,
    agentPublicKey: "YourWalletPublicKeyHere",
  }),
});

const { data } = await response.json();

// 2. Sign the transaction locally
const txBuffer = Buffer.from(data.transaction, "base64");
const transaction = VersionedTransaction.deserialize(txBuffer);
transaction.sign([yourKeypair]);

// 3. Submit to Solana
const connection = new Connection("https://api.mainnet-beta.solana.com");
const signature = await connection.sendTransaction(transaction);
console.log(`Transaction confirmed: ${signature}`);
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v1/swap` | Construct a swap transaction |
| `GET` | `/v1/health` | Service health check |

## Revenue Model

A 0.5% referral fee (50bps) is applied to all Jupiter swaps routed through VeerTx. This fee is embedded in the transaction at construction time and is non-overridable.

## Project Structure

```
veertx-agents/
├── server/          # Express API server
│   ├── routes/      # API route handlers
│   ├── middleware/   # Auth, rate limiting, validation
│   ├── services/    # Jupiter, transaction construction
│   └── db/          # Database access layer
├── sdk/
│   ├── typescript/  # @veertx/agent-sdk npm package
│   └── python/      # veertx-agent PyPI package
├── db/              # Database schema
├── docs/            # Documentation
└── examples/        # Example integrations
```

## Security

- Non-custodial: private keys never touch the server
- API keys hashed with HMAC-SHA256 with a secret pepper
- Zod validation on every endpoint
- Rate limiting per IP and per API key
- All fees hardcoded server-side

See [SECURITY.md](./SECURITY.md) for the full checklist.

## License

Proprietary. All rights reserved.
