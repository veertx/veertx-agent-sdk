# VeerTx Agent API - Project Memory

## Project

- **Name:** VeerTx Agent API
- **Status:** NOT STARTED
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
