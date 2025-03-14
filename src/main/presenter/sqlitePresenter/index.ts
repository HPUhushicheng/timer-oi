import Database from 'better-sqlite3-multiple-ciphers'
import path from 'path'
import fs from 'fs'
import { BaseTable } from './tables/baseTable'
import { ConversationsTable } from './tables/conversations'
import { MessagesTable } from './tables/messages'
import { AttachmentsTable } from './tables/attachments'
import { nanoid } from 'nanoid'
import {
  ISQLitePresenter,
  SQLITE_MESSAGE,
  CONVERSATION,
  CONVERSATION_SETTINGS
} from '@shared/presenter'
import { MessageAttachmentsTable } from './tables/messageAttachments'

type ConversationRow = {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  systemPrompt: string
  temperature: number
  contextLength: number
  maxTokens: number
  providerId: string
  modelId: string
  artifacts: number
}

export class SQLitePresenter implements ISQLitePresenter {
  private db!: Database.Database
  private tables: BaseTable[] = []
  private currentVersion: number = 0
  private dbPath: string

  constructor(dbPath: string, password?: string) {
    this.dbPath = dbPath
    try {
      // 确保数据库目录存在
      const dbDir = path.dirname(dbPath)
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true })
      }

      // 初始化数据库连接
      this.db = new Database(dbPath)
      this.db.pragma('journal_mode = WAL')

      if (password) {
        this.db.pragma(`cipher='sqlcipher'`)
        this.db.pragma(`key='${password}'`)
      }

      // 尝试执行一个简单的查询来验证数据库是否正常
      this.db.prepare('SELECT 1').get()

      // 初始化所有表
      this.initTables()

      // 初始化版本表
      this.initVersionTable()

      // 执行迁移
      this.migrate()
    } catch (error) {
      console.error('Database initialization failed:', error)

      // 如果数据库已经打开，先关闭它
      if (this.db) {
        try {
          this.db.close()
        } catch (closeError) {
          console.error('Error closing database:', closeError)
        }
      }

      // 备份现有的损坏数据库
      this.backupDatabase()

      // 删除现有的数据库文件和相关的 WAL/SHM 文件
      this.cleanupDatabaseFiles()

      // 重新创建一个新的数据库
      this.db = new Database(dbPath)
      this.db.pragma('journal_mode = WAL')

      if (password) {
        this.db.pragma(`cipher='sqlcipher'`)
        this.db.pragma(`key='${password}'`)
      }

      // 重新初始化数据库
      this.initTables()
      this.initVersionTable()
      this.migrate()
    }
  }
  async deleteAllMessagesInConversation(conversationId: string): Promise<void> {
    const deleteStmt = this.db.prepare(
      `
    DELETE FROM messages
    WHERE conversation_id = ?
    `
    )
    deleteStmt.run(conversationId)
    return
  }

  private backupDatabase(): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = `${this.dbPath}.${timestamp}.bak`

    try {
      if (fs.existsSync(this.dbPath)) {
        fs.copyFileSync(this.dbPath, backupPath)
        console.log(`Database backed up to: ${backupPath}`)
      }
    } catch (error) {
      console.error('Error creating database backup:', error)
    }
  }

  private cleanupDatabaseFiles(): void {
    const filesToDelete = [this.dbPath, `${this.dbPath}-wal`, `${this.dbPath}-shm`]

    for (const file of filesToDelete) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file)
          console.log(`Deleted file: ${file}`)
        }
      } catch (error) {
        console.error(`Error deleting file ${file}:`, error)
      }
    }
  }

  renameConversation(conversationId: string, title: string): Promise<CONVERSATION> {
    const updateStmt = this.db.prepare(
      `
    UPDATE conversations
    SET title = ?, is_new = 0
    WHERE conv_id = ?
    `
    )
    updateStmt.run(title, conversationId)

    return this.getConversation(conversationId)
  }

  private initTables() {
    this.tables = [
      new ConversationsTable(this.db),
      new MessagesTable(this.db),
      new AttachmentsTable(this.db),
      new MessageAttachmentsTable(this.db)
    ]

    // 创建所有表
    this.tables.forEach((table) => table.createTable())
  }

  private initVersionTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_versions (
        version INTEGER PRIMARY KEY,
        applied_at INTEGER NOT NULL
      )
    `)

    const result = this.db.prepare('SELECT MAX(version) as version FROM schema_versions').get() as {
      version: number
      applied_at: number
    }
    this.currentVersion = result?.version || 0
  }

  private migrate() {
    // 获取所有表的迁移脚本
    const migrations = new Map<number, string[]>()

    // 获取最新的迁移版本
    const latestVersion = this.tables.reduce((maxVersion, table) => {
      const tableMaxVersion = table.getLatestVersion?.() || 0
      return Math.max(maxVersion, tableMaxVersion)
    }, 0)

    // 只迁移未执行的版本
    this.tables.forEach((table) => {
      for (let version = this.currentVersion + 1; version <= latestVersion; version++) {
        const sql = table.getMigrationSQL?.(version)
        if (sql) {
          if (!migrations.has(version)) {
            migrations.set(version, [])
          }
          migrations.get(version)?.push(sql)
        }
      }
    })

    // 按版本号顺序执行迁移
    const versions = Array.from(migrations.keys()).sort((a, b) => a - b)

    for (const version of versions) {
      const migrationSQLs = migrations.get(version) || []
      if (migrationSQLs.length > 0) {
        console.log(`Executing migration version ${version}`)
        this.db.transaction(() => {
          migrationSQLs.forEach((sql) => {
            console.log(`Executing SQL: ${sql}`)
            this.db.exec(sql)
          })
          this.db
            .prepare('INSERT INTO schema_versions (version, applied_at) VALUES (?, ?)')
            .run(version, Date.now())
        })()
      }
    }
  }

  // 关闭数据库连接
  public close() {
    this.db.close()
  }

  // 创建新对话
  public async createConversation(
    title: string,
    settings: Partial<CONVERSATION_SETTINGS> = {}
  ): Promise<string> {
    const insert = this.db.prepare(
      `
      INSERT INTO conversations (
        conv_id,
        title,
        created_at,
        updated_at,
        system_prompt,
        temperature,
        context_length,
        max_tokens,
        provider_id,
        model_id,
        is_new,
        artifacts
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    const conv_id = nanoid()
    const now = Date.now()
    insert.run(
      conv_id,
      title,
      now,
      now,
      settings.systemPrompt || '',
      settings.temperature || 0.7,
      settings.contextLength || 4000,
      settings.maxTokens || 2000,
      settings.providerId || 'openai',
      settings.modelId || 'gpt-4',
      1,
      settings.artifacts || 0
    )
    return conv_id
  }

  // 获取对话信息
  public async getConversation(conversationId: string): Promise<CONVERSATION> {
    const result = this.db
      .prepare(
        `
      SELECT
        conv_id as id,
        title,
        created_at as createdAt,
        updated_at as updatedAt,
        system_prompt as systemPrompt,
        temperature,
        context_length as contextLength,
        max_tokens as maxTokens,
        provider_id as providerId,
        model_id as modelId,
        is_new,
        artifacts
      FROM conversations
      WHERE conv_id = ?
    `
      )
      .get(conversationId) as ConversationRow & { is_new: number }

    if (!result) {
      throw new Error(`Conversation ${conversationId} not found`)
    }

    return {
      id: result.id,
      title: result.title,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      is_new: result.is_new,
      settings: {
        systemPrompt: result.systemPrompt,
        temperature: result.temperature,
        contextLength: result.contextLength,
        maxTokens: result.maxTokens,
        providerId: result.providerId,
        modelId: result.modelId,
        artifacts: result.artifacts as 0 | 1
      }
    }
  }

  // 更新对话信息
  public async updateConversation(
    conversationId: string,
    data: Partial<CONVERSATION>
  ): Promise<void> {
    const updates: string[] = []
    const params: (string | number)[] = []

    if (data.title !== undefined) {
      updates.push('title = ?')
      params.push(data.title)
    }

    if (data.is_new !== undefined) {
      updates.push('is_new = ?')
      params.push(data.is_new)
    }

    if (data.settings) {
      if (data.settings.systemPrompt !== undefined) {
        updates.push('system_prompt = ?')
        params.push(data.settings.systemPrompt)
      }
      if (data.settings.temperature !== undefined) {
        updates.push('temperature = ?')
        params.push(data.settings.temperature)
      }
      if (data.settings.contextLength !== undefined) {
        updates.push('context_length = ?')
        params.push(data.settings.contextLength)
      }
      if (data.settings.maxTokens !== undefined) {
        updates.push('max_tokens = ?')
        params.push(data.settings.maxTokens)
      }
      if (data.settings.providerId !== undefined) {
        updates.push('provider_id = ?')
        params.push(data.settings.providerId)
      }
      if (data.settings.modelId !== undefined) {
        updates.push('model_id = ?')
        params.push(data.settings.modelId)
      }
      if (data.settings.artifacts !== undefined) {
        updates.push('artifacts = ?')
        params.push(data.settings.artifacts)
      }
    }

    if (updates.length > 0) {
      updates.push('updated_at = ?')
      params.push(Date.now())

      const updateStmt = this.db.prepare(
        `
        UPDATE conversations
        SET ${updates.join(', ')}
        WHERE conv_id = ?
      `
      )
      params.push(conversationId)
      updateStmt.run(...params)
    }
  }

  // 获取对话列表
  public async getConversationList(
    page: number,
    pageSize: number
  ): Promise<{ total: number; list: CONVERSATION[] }> {
    const offset = (page - 1) * pageSize

    // 获取总数
    const totalResult = this.db.prepare('SELECT COUNT(*) as count FROM conversations').get() as {
      count: number
    }

    // 获取分页数据
    const results = this.db
      .prepare(
        `
      SELECT
        conv_id as id,
        title,
        created_at as createdAt,
        updated_at as updatedAt,
        system_prompt as systemPrompt,
        temperature,
        context_length as contextLength,
        max_tokens as maxTokens,
        provider_id as providerId,
        model_id as modelId,
        is_new
      FROM conversations
      ORDER BY updated_at DESC
      LIMIT ? OFFSET ?
    `
      )
      .all(pageSize, offset) as (ConversationRow & { is_new: number })[]

    return {
      total: totalResult.count,
      list: results.map((row) => ({
        id: row.id,
        title: row.title,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        is_new: row.is_new,
        settings: {
          systemPrompt: row.systemPrompt,
          temperature: row.temperature,
          contextLength: row.contextLength,
          maxTokens: row.maxTokens,
          providerId: row.providerId,
          modelId: row.modelId,
          artifacts: row.artifacts as 0 | 1
        }
      }))
    }
  }

  // 删除对话
  public async deleteConversation(conversationId: string): Promise<void> {
    const deleteStmt = this.db.prepare(
      `
      DELETE FROM conversations WHERE conv_id = ?
    `
    )
    deleteStmt.run(conversationId)
  }

  // 插入消息
  public async insertMessage(
    conversationId: string,
    content: string,
    role: string,
    parentId: string,
    metadata: string = '{}',
    orderSeq: number = 0,
    tokenCount: number = 0,
    status: string = 'pending',
    isContextEdge: number = 0,
    isVariant: number = 0
  ): Promise<string> {
    const insert = this.db.prepare(
      `
      INSERT INTO messages (
        msg_id,
        conversation_id,
        parent_id,
        content,
        role,
        created_at,
        order_seq,
        token_count,
        status,
        metadata,
        is_context_edge,
        is_variant
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    const msgId = nanoid()
    insert.run(
      msgId,
      conversationId,
      parentId,
      content,
      role,
      Date.now(),
      orderSeq,
      tokenCount,
      status,
      metadata,
      isContextEdge,
      isVariant
    )
    return msgId
  }

  // 查询消息
  public async queryMessages(conversationId: string): Promise<SQLITE_MESSAGE[]> {
    // 首先获取所有非变体消息
    const mainMessages = this.db
      .prepare(
        `
        SELECT
          msg_id as id,
          conversation_id,
          parent_id,
          content,
          role,
          created_at,
          order_seq,
          token_count,
          status,
          metadata,
          is_context_edge,
          is_variant
        FROM messages
        WHERE conversation_id = ? AND is_variant != 1
        ORDER BY created_at ASC, order_seq ASC
      `
      )
      .all(conversationId) as SQLITE_MESSAGE[]

    // 对于每个助手消息，获取其变体
    const getVariants = this.db.prepare(
      `
      SELECT
        msg_id as id,
        conversation_id,
        parent_id,
        content,
        role,
        created_at,
        order_seq,
        token_count,
        status,
        metadata,
        is_context_edge,
        is_variant
      FROM messages
      WHERE parent_id = ? AND is_variant = 1
      ORDER BY created_at ASC
    `
    )

    // 为每个助手消息添加变体
    return mainMessages.map((msg) => {
      if (msg.role === 'assistant') {
        const variants = getVariants.all(msg.parent_id) as SQLITE_MESSAGE[]
        if (variants.length > 0) {
          return {
            ...msg,
            variants
          }
        }
      }
      return msg
    })
  }

  // 更新消息
  public async updateMessage(
    messageId: string,
    data: {
      content?: string
      status?: string
      metadata?: string
      isContextEdge?: number
      tokenCount?: number
    }
  ): Promise<void> {
    const updates: string[] = []
    const params: (string | number)[] = []

    if (data.content !== undefined) {
      updates.push('content = ?')
      params.push(data.content)
    }
    if (data.status !== undefined) {
      updates.push('status = ?')
      params.push(data.status)
    }
    if (data.metadata !== undefined) {
      updates.push('metadata = ?')
      params.push(data.metadata)
    }
    if (data.isContextEdge !== undefined) {
      updates.push('is_context_edge = ?')
      params.push(data.isContextEdge)
    }
    if (data.tokenCount !== undefined) {
      updates.push('token_count = ?')
      params.push(data.tokenCount)
    }

    if (updates.length > 0) {
      const updateStmt = this.db.prepare(
        `
        UPDATE messages
        SET ${updates.join(', ')}
        WHERE msg_id = ?
      `
      )
      params.push(messageId)
      updateStmt.run(...params)
    }
  }

  // 删除消息
  public async deleteMessage(messageId: string): Promise<void> {
    const deleteStmt = this.db.prepare('DELETE FROM messages WHERE msg_id = ?')
    deleteStmt.run(messageId)
  }

  // 获取单条消息
  public async getMessage(messageId: string): Promise<SQLITE_MESSAGE | null> {
    return (await this.db
      .prepare(
        `
        SELECT
          msg_id as id,
          conversation_id,
          parent_id,
          content,
          role,
          created_at,
          order_seq,
          token_count,
          status,
          metadata,
          is_context_edge,
          is_variant
        FROM messages
        WHERE msg_id = ?
      `
      )
      .get(messageId)) as SQLITE_MESSAGE | null
  }

  // 获取消息变体
  public async getMessageVariants(messageId: string): Promise<SQLITE_MESSAGE[]> {
    return (await this.db
      .prepare(
        `
        SELECT
          msg_id as id,
          conversation_id,
          parent_id,
          content,
          role,
          created_at,
          order_seq,
          token_count,
          status,
          metadata,
          is_context_edge,
          is_variant
        FROM messages
        WHERE parent_id = ?
        ORDER BY created_at ASC
      `
      )
      .all(messageId)) as SQLITE_MESSAGE[]
  }

  // 获取会话的最大消息序号
  public async getMaxOrderSeq(conversationId: string): Promise<number> {
    const result = this.db
      .prepare('SELECT MAX(order_seq) as maxSeq FROM messages WHERE conversation_id = ?')
      .get(conversationId) as { maxSeq: number }
    return result.maxSeq || 0
  }

  // 删除所有消息
  public async deleteAllMessages(): Promise<void> {
    const deleteStmt = this.db.prepare(`DELETE FROM messages`)
    deleteStmt.run()
  }

  // 执行事务
  public async runTransaction(operations: () => void): Promise<void> {
    await this.db.transaction(operations)
  }

  // 添加消息附件
  public async addMessageAttachment(
    messageId: string,
    attachmentType: string,
    attachmentData: string
  ): Promise<void> {
    const attachmentId = nanoid()
    const insert = this.db.prepare(
      `
      INSERT INTO message_attachments (
        attachment_id,
        message_id,
        type,
        content,
        created_at
      )
      VALUES (?, ?, ?, ?, ?)
    `
    )
    insert.run(attachmentId, messageId, attachmentType, attachmentData, Date.now())
  }

  // 获取消息附件
  public async getMessageAttachments(
    messageId: string,
    type: string
  ): Promise<{ content: string }[]> {
    return this.db
      .prepare(
        `
        SELECT content
        FROM message_attachments
        WHERE message_id = ? AND type = ?
        ORDER BY created_at ASC
      `
      )
      .all(messageId, type) as { content: string }[]
  }

  public async getLastUserMessage(conversationId: string): Promise<SQLITE_MESSAGE | null> {
    return this.db
      .prepare(
        `
        SELECT
          msg_id as id,
          conversation_id,
          parent_id,
          content,
          role,
          created_at,
          order_seq,
          token_count,
          status,
          metadata,
          is_context_edge,
          is_variant
        FROM messages
        WHERE conversation_id = ? AND role = 'user'
        ORDER BY created_at DESC
        LIMIT 1
      `
      )
      .get(conversationId) as SQLITE_MESSAGE | null
  }

  public async getMainMessageByParentId(
    conversationId: string,
    parentId: string
  ): Promise<SQLITE_MESSAGE | null> {
    const mainMessage = this.db
      .prepare(
        `
        SELECT
          msg_id as id,
          conversation_id,
          parent_id,
          content,
          role,
          created_at,
          order_seq,
          token_count,
          status,
          metadata,
          is_context_edge,
          is_variant
        FROM messages
        WHERE conversation_id = ?
        AND parent_id = ?
        AND is_variant = 0
        ORDER BY created_at ASC
        LIMIT 1
      `
      )
      .get(conversationId, parentId) as SQLITE_MESSAGE | null

    if (mainMessage) {
      const variants = this.db
        .prepare(
          `
          SELECT
            msg_id as id,
            conversation_id,
            parent_id,
            content,
            role,
            created_at,
            order_seq,
            token_count,
            status,
            metadata,
            is_context_edge,
            is_variant
          FROM messages
          WHERE conversation_id = ?
          AND parent_id = ?
          AND is_variant = 1
          ORDER BY created_at ASC
        `
        )
        .all(conversationId, parentId) as SQLITE_MESSAGE[]

      mainMessage.variants = variants // 拼凑variants对象
    }

    return mainMessage
  }
}
