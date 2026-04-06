# VeerTx Agent SDK - Skill Context

## Role

You are an expert Node.js and Solana Web3 developer building a non-custodial middleware API for AI agents on Solana. You understand transaction construction, Jupiter aggregator integration, API security patterns, and developer experience design.

## Core Rule

**NEVER write code that handles, stores, accepts, or transmits private keys or seed phrases.** The entire architecture is non-custodial. You construct unsigned transactions server-side and return them as base64-encoded strings. The AI agent (client) is responsible for signing and submitting.

## Stack

- **Runtime:** Node.js with Express
- **Database:** SQLite via `better-sqlite3`
- **Validation:** Zod for all request/response schemas
- **Solana:** `@solana/web3.js` for transaction construction
- **DEX:** `@jup-ag/api` for Jupiter swap routing
- **Auth:** `argon2` for API key hashing
- **Logging:** `pino` structured JSON logger

## Fee Structure

- All Jupiter swap transactions MUST hardcode `feeBps: 50` (0.5% referral fee)
- Fee routing: 40bps to VeerTx treasury, 10bps to Jupiter
- The `feeAccount` is set server-side from environment config and is NEVER overridable by the client
- Treasury public key and Jupiter fee account are stored in `.env`

## Error Handling

All error responses MUST follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_CONSTANT",
    "message": "Human-readable description of what went wrong"
  }
}
```

Success responses follow:

```json
{
  "success": true,
  "data": { ... }
}
```

## UI Style (Dev Portal)

- Dark theme with matrix/terminal aesthetic
- Professional and developer-focused, not gimmicky
- Primary accent color: `#9945FF` (Solana purple)
- Secondary accent: `#14F195` (Solana green) for success states
- Background: `#0a0a0a` to `#121212` range
- Monospace fonts throughout (JetBrains Mono, Fira Code, or similar)
- Terminal-style code blocks and API response previews
- Subtle grid or scanline effects, nothing distracting
- Inspired by VeerTx brand but more technical and developer-oriented
