const crypto = require('crypto');
const db = require('../db/database');

function portalAuth(req, res, next) {
  const sessionId = req.cookies && req.cookies.vrtx_session;
  if (!sessionId) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Not logged in' },
    });
  }

  const sessionHash = crypto.createHash('sha256').update(sessionId).digest('hex');
  const now = Math.floor(Date.now() / 1000);

  const session = db
    .prepare('SELECT developer_id FROM sessions WHERE session_hash = ? AND expires_at > ?')
    .get(sessionHash, now);

  if (!session) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Session expired or invalid' },
    });
  }

  req.developerId = session.developer_id;
  next();
}

module.exports = portalAuth;
