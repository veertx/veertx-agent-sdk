# VeerTx Agent SDK - Security Checklist

## Non-Custodial Guarantee

- [ ] The server NEVER accepts private keys, seed phrases, or keypair data in any request
- [ ] The server NEVER stores any signing material
- [ ] All transaction endpoints return base64-encoded unsigned transactions only
- [ ] Signing and submission is always the client's responsibility
- [ ] No endpoint exists that could be used to extract or infer private keys

## API Key Security

- [ ] API keys are hashed with `argon2` before storage — plaintext keys are never persisted
- [ ] Keys use distinguishable prefixes: `vrtx_live_` for production, `vrtx_test_` for sandbox
- [ ] The full API key is shown exactly once at creation time, then only the prefix is retrievable
- [ ] Register key prefixes with GitHub secret scanning partner program to alert on leaks
- [ ] API keys can be revoked immediately by the developer
- [ ] Revoked keys return `401` on all subsequent requests

## Payload Validation

- [ ] Every endpoint validates its request body with a Zod schema before any processing
- [ ] Solana public keys are validated as 32-byte base58-encoded strings
- [ ] Token mint addresses are validated against known formats
- [ ] Numeric amounts are validated as positive finite numbers
- [ ] Reject unexpected fields — do not silently ignore extra payload properties

## Rate Limiting

- [ ] Global rate limit: 100 requests per minute per IP address
- [ ] Per-key rate limit: 50 requests per minute per API key
- [ ] Rate limit headers included in all responses (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`)
- [ ] Rate-limited requests return `429 Too Many Requests` with standard error format

## Idempotency

- [ ] `Idempotency-Key` header is required on all execution endpoints (`POST /v1/swap`, `POST /v1/execute`)
- [ ] Duplicate idempotency keys within a time window return the cached response
- [ ] Idempotency keys are scoped per API key (different API keys can use the same idempotency key)

## Fee Protection

- [ ] Jupiter `feeAccount` is hardcoded server-side from environment configuration
- [ ] The `feeBps` value (50) is set server-side and is not configurable by the client
- [ ] No client input can override, modify, or redirect fee routing
- [ ] Fee parameters are validated before transaction construction

## Logging

- [ ] All requests are logged with `pino` structured JSON logger
- [ ] Log entries include: timestamp, request ID, method, path, status code, response time
- [ ] All errors are logged with full context (but no sensitive data)
- [ ] **NEVER** log private keys, seed phrases, mnemonics, or any signing material
- [ ] **NEVER** log full API keys — only log the prefix (`vrtx_live_...`, `vrtx_test_...`)
- [ ] Log level is configurable via `LOG_LEVEL` environment variable

## Infrastructure

- [ ] HTTPS enforced in production (TLS termination at reverse proxy)
- [ ] CORS configured to allow only authorized origins
- [ ] Helmet middleware for HTTP security headers
- [ ] Request body size limited to prevent payload abuse
- [ ] Graceful shutdown handling for in-flight requests
