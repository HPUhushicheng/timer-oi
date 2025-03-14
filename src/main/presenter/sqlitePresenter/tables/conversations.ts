import { BaseTable } from './baseTable'
import type Database from 'better-sqlite3-multiple-ciphers'

export class ConversationsTable extends BaseTable {
  constructor(db: Database.Database) {
    super(db, 'conversations')
  }

  getCreateTableSQL(): string {
    return `
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conv_id TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        user_id INTEGER DEFAULT 0,
        is_pinned INTEGER DEFAULT 0,
        model_id TEXT DEFAULT 'gpt-4',
        provider_id TEXT DEFAULT 'openai',
        context_length INTEGER DEFAULT 10,
        max_tokens INTEGER DEFAULT 2000,
        temperature REAL DEFAULT 0.7,
        system_prompt TEXT DEFAULT '',
        context_chain TEXT DEFAULT '[]'
      );
      CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);
      CREATE INDEX idx_conversations_pinned ON conversations(is_pinned);
    `
  }

  getMigrationSQL(version: number): string | null {
    if (version === 1) {
      return `
        -- 添加 is_new 字段
        ALTER TABLE conversations ADD COLUMN is_new INTEGER DEFAULT 1;

        -- 移除 user_id 字段
        ALTER TABLE conversations DROP COLUMN user_id;

        -- 更新所有现有会话的 is_new 为 0
        UPDATE conversations SET is_new = 0;
      `
    }
    if (version === 2) {
      return `
        -- 添加 artifacts 开关
        ALTER TABLE conversations ADD COLUMN artifacts INTEGER DEFAULT 0;
        UPDATE conversations SET artifacts = 0;
      `
    }
    return null
  }

  getLatestVersion(): number {
    return 2
  }
}
