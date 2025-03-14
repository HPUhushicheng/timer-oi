import { BaseFileAdapter } from './BaseFileAdapter'
import fs from 'fs/promises'
import path from 'path'

export class TextFileAdapter extends BaseFileAdapter {
  public async getLLMContent(): Promise<string | undefined> {
    const fullPath = path.join(this.filePath)
    const stats = await fs.stat(fullPath)
    const content = await this.getContent()

    const fileDescription = `# File Description

  ## Basic File Information

  * **File Name:** ${path.basename(this.filePath)}
  * **File Type:** Text File
  * **File Format:** ${path.extname(this.filePath).substring(1)}
  * **File Size:** ${stats.size} bytes
  * **Creation Date:** ${stats.birthtime.toISOString().split('T')[0]}
  * **Updated Date:** ${stats.mtime.toISOString().split('T')[0]}
  `
    if (content) {
      return `${fileDescription}

## File Content
  \`\`\`
  ${content}
  \`\`\`
  `
    } else {
      return fileDescription
    }
  }
  private maxFileSize: number
  private fileContent: string | undefined

  constructor(filePath: string, maxFileSize: number) {
    super(filePath)
    this.maxFileSize = maxFileSize
    this.fileContent = undefined
  }

  protected getFileDescription(): string | undefined {
    return 'Text File'
  }

  async getContent(): Promise<string | undefined> {
    if (this.fileContent === undefined) {
      const fullPath = path.join(this.filePath)
      const stats = await fs.stat(fullPath)
      if (stats.size <= this.maxFileSize) {
        this.fileContent = await fs.readFile(fullPath, 'utf-8')
      }
    }
    return this.fileContent
  }
}
