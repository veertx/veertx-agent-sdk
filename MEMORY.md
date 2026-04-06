# VeerTx Agent API - Project Memory

## Project

- **Name:** VeerTx Agent API
- **Status:** Phase 1 in progress (blocked on Jupiter API key)
- **What we build:** Non-custodial middleware API. AI agents send intent (e.g., swap parameters), we construct the transaction server-side and return base64 for the agent to sign locally. Private keys never touch our server.
- **Revenue:** Jupiter referral fee 0.5% (50bps total: 40bps to VeerTx treasury, 10bps to Jupiter)

## Environment

- **Local path:** `C:\Users\gbram\Downloads\veertx-agents`
- **GitHub public SDK:** `github.com/veertx/veertx-agent-sdk`
- **Subdomain:** `agents.veertx.com` on port `3001`
- **Database:** `agents.sqlite` (SQLite via better-sqlite3)
- **Separate from:** Main VeerTx application running on port `3000`

## Next Step

Phase 1: Secure MVP

## Session 2026-04-06 progress
- Phase 1 code complete: server/index.js, auth middleware, rate limiting, Jupiter service, /v1/swap, /v1/keys
- Health endpoint working, API key creation working, auth working
- BLOCKED: Jupiter migrated to api.jup.ag requiring API key from portal.jup.ag -- portal in maintenance, new keys blocked
- Next session: create Jupiter API key, add JUPITER_API_KEY to .env on server, update jupiter.js to use api.jup.ag with Authorization Bearer header, test full swap flow
