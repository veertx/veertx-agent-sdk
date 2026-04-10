const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || './agents.sqlite';
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');

const schema = fs.readFileSync(
  path.join(__dirname, '../../db/schema.sql'),
  'utf8'
);
db.exec(schema);

// Idempotency key column for swap deduplication
try {
  db.exec('ALTER TABLE transactions ADD COLUMN idempotency_key TEXT');
} catch (_) {
  // Column already exists
}

try {
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_idempotency ON transactions(idempotency_key) WHERE idempotency_key IS NOT NULL');
} catch (_) {
  // Index already exists
}

module.exports = db;
