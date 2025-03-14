import { BaseTable } from './baseTable'
import type Database from 'better-sqlite3-multiple-ciphers'

export type AttachmentType = 'search_results' | 'file' | 'image' | 'audio'

export class MessageAttachmentsTable extends BaseTable {
  constructor(db: Database.Database) {
    super(db, 'message_attachments')
  }

  getCreateTableSQL(): string {
    return `
      CREATE TABLE IF NOT EXISTS message_attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        attachment_id TEXT UNIQUE NOT NULL,
        message_id TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        metadata TEXT,
        FOREIGN KEY(message_id) REFERENCES messages(msg_id) ON DELETE CASCADE
      );
      CREATE INDEX idx_message_attachments ON message_attachments(message_id, type);
      CREATE INDEX idx_message_attachment_type ON message_attachments(type);
    `
  }

  getMigrationSQL(): string | null {
    return null
  }

  getLatestVersion(): number {
    return 0
  }
}
