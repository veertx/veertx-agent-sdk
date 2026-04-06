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

## Phase 2 -- Dev Portal (IN PROGRESS)
- agents.veertx.com live with HTTPS
- Nginx + Certbot SSL configured
- CORS locked to agents.veertx.com
- Resend domain verified, emails send from noreply@veertx.com
- Cloudflare Turnstile configured, site key: 0x4AAAAAACwDAtG1Pj7vnQyq
- Magic link auth complete -- POST /v1/portal/auth/login, GET /v1/portal/auth/verify
- Session management complete -- vrtx_session httpOnly cookie, 7 day expiry, SHA-256 hashed
- Portal routes complete -- GET/POST/DELETE /v1/portal/keys, GET /v1/portal/stats, POST /v1/portal/auth/logout
- DB tables added -- magic_tokens, sessions
- Frontend pages live -- index.html (Vercel style landing), login.html, dashboard.html

## KNOWN FIXES NEEDED NEXT SESSION
- Dashboard sidebar not showing -- CSS issue, margin-left not applied correctly
- Status card "Operational" font too large
- Chart empty -- expected, no swaps yet for this developer account
- Login page needs review
- Overall dashboard UI polish pass needed
