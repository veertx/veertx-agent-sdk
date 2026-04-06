# VeerTx Agent SDK - Roadmap

## Phase 1: Secure MVP

The foundation. A working API that accepts swap intent and returns a signable transaction.

- [ ] Project scaffolding with Express, TypeScript, and SQLite
- [ ] Database setup with `better-sqlite3` (developers, api_keys, transactions tables)
- [ ] API key generation system with `argon2` hashing
- [ ] Key format: `vrtx_live_` prefix for production, `vrtx_test_` for sandbox
- [ ] Zod validation schemas for all request payloads
- [ ] Jupiter integration via `@jup-ag/api` for swap routing
- [ ] `POST /v1/swap` endpoint that accepts swap parameters and returns base64 unsigned transaction
- [ ] Hardcoded `feeBps: 50` on all Jupiter routes (non-overridable)
- [ ] Fee account routing to VeerTx treasury (server-side config)
- [ ] Rate limiting: 100 req/min per IP, 50 req/min per API key
- [ ] `Idempotency-Key` header enforcement on execution endpoints
- [ ] Pino structured logging on all requests and errors
- [ ] Transaction logging to SQLite for audit trail
- [ ] Health check endpoint `GET /v1/health`
- [ ] Error response format standardization

## Phase 2: Developer Portal

A frontend at `agents.veertx.com` where developers manage their API access.

- [ ] Dark matrix/terminal-themed frontend
- [ ] Developer signup and authentication flow
- [ ] API key creation, rotation, and revocation dashboard
- [ ] Transaction history viewer with filtering and search
- [ ] Revenue metrics: fees collected, volume routed, transaction counts
- [ ] Usage analytics: requests per day, rate limit hits, error rates
- [ ] API documentation integrated into the portal
- [ ] Interactive API playground for testing endpoints

## Phase 3: Public SDK

Official client libraries so developers can integrate in minutes.

- [ ] TypeScript SDK published to npm as `@veertx/agent-sdk`
  - Typed methods for all API endpoints
  - Built-in retry logic and error handling
  - Transaction signing helpers (client-side only)
  - ESM and CJS builds
- [ ] Python SDK published to PyPI as `veertx-agent`
  - Async support with `httpx`
  - Pydantic models for request/response types
  - Transaction signing helpers (client-side only)
- [ ] Documentation site with guides, API reference, and examples
- [ ] Example projects for common agent patterns

## Phase 4: Natural Language Interface

AI-native endpoint that accepts plain English and returns executable transactions.

- [ ] `POST /v1/execute` endpoint accepting natural language input
- [ ] Example: `"swap 1 SOL to WIF"` returns a base64 swap transaction
- [ ] LLM-powered intent parsing (token resolution, amount parsing, action detection)
- [ ] Support for common actions: swap, transfer, check balance
- [ ] Confidence scoring on parsed intents
- [ ] Disambiguation responses when intent is unclear
- [ ] Token alias resolution (e.g., "bonk" -> BONK mint address)
- [ ] Safety guardrails on parsed intents (sanity checks on amounts, slippage)
