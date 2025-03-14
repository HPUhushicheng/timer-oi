import { BaseTable } from './baseTable'
import type Database from 'better-sqlite3-multiple-ciphers'

export class MessagesTable extends BaseTable {
  constructor(db: Database.Database) {
    super(db, 'messages')
  }

  getCreateTableSQL(): string {
    return `
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        msg_id TEXT UNIQUE NOT NULL,
        conversation_id TEXT NOT NULL,
        parent_id TEXT DEFAULT '',
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system', 'function')),
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        order_seq INTEGER NOT NULL DEFAULT 0,
        token_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'sent' CHECK(status IN ('sent', 'pending', 'error')),
        metadata TEXT,
        is_context_edge INTEGER DEFAULT 0,
        is_variant INTEGER DEFAULT 0,
        FOREIGN KEY(conversation_id) REFERENCES conversations(conv_id) ON DELETE CASCADE
      );
      CREATE INDEX idx_messages_session ON messages(conversation_id, order_seq);
      CREATE INDEX idx_message_timeline ON messages(created_at DESC);
      CREATE INDEX idx_message_context_edge ON messages(is_context_edge);
    `
  }

  getMigrationSQL(): string | null {
    return null
  }

  getLatestVersion(): number {
    return 0
  }
}
