import axios from 'axios'
import * as cheerio from 'cheerio'
import { SearchResult } from '../../../shared/presenter'

// 统一的搜索结果类型

/**
 * 内容丰富工具类，用于处理URL内容提取和丰富
 */
export class ContentEnricher {
  /**
   * 从文本中提取并丰富URL内容
   * @param text 包含URL的文本
   * @returns 丰富后的URL结果数组
   */
  static async extractAndEnrichUrls(text: string): Promise<SearchResult[]> {
    // 用正则表达式匹配http和https链接
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const matches = text.match(urlRegex)

    if (!matches || matches.length === 0) {
      return []
    }

    const results: SearchResult[] = []

    for (const url of matches) {
      const result = await this.enrichUrl(url, results.length + 1)
      results.push(result as SearchResult)
    }

    return results
  }

  /**
   * 丰富单个URL的内容
   * @param url 需要丰富的URL
   * @param rank 结果排名（可选）
   * @returns 丰富后的SearchResult对象
   */
  static async enrichUrl(url: string, rank: number = 1): Promise<SearchResult> {
    const timeout = 5000 // 5秒超时

    try {
      // 使用axios获取页面内容
      const response = await axios.get(url, {
        timeout,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })

      const $ = cheerio.load(response.data)
      // 移除不需要的元素
      $('script, style, nav, header, footer, iframe, .ad, #ad, .advertisement').remove()

      // 获取页面标题
      const title = $('title').text().trim() || url

      // 尝试获取主要内容
      const mainContent = this.extractMainContent($)
      console.log('maincontent', mainContent)
      // 获取图标
      const icon = this.extractFavicon($, url)

      // 获取页面描述
      const description =
        $('meta[name="description"]').attr('content') ||
        $('meta[property="og:description"]').attr('content') ||
        ''

      return {
        title,
        url,
        content: mainContent,
        icon,
        description,
        rank
      }
    } catch (error: Error | unknown) {
      console.error(`提取URL内容失败 ${url}:`, error instanceof Error ? error.message : '')
      // 如果获取失败，只添加URL信息
      return {
        title: url,
        url,
        rank,
        description: '',
        icon: ''
      }
    }
  }

  /**
   * 批量丰富搜索结果内容
   * @param results 搜索结果数组
   * @param limit 处理结果的数量限制（可选）
   * @returns 丰富后的搜索结果数组
   */
  static async enrichResults(results: SearchResult[], limit?: number): Promise<SearchResult[]> {
    const enrichedResults: SearchResult[] = []
    const resultsToProcess = limit ? results.slice(0, limit) : results

    for (const result of resultsToProcess) {
      try {
        const enrichedResult = await this.enrichUrl(result.url, result.rank)
        // 合并原始结果和丰富的结果
        enrichedResults.push({
          ...result,
          content: enrichedResult.content || result.description || '',
          icon: result.icon || enrichedResult.icon || ''
        })
      } catch (error) {
        console.error(`Error enriching content for ${result.url}:`, error)
        // 获取失败保留原始结果
        enrichedResults.push(result)
      }
    }

    return enrichedResults
  }

  /**
   * 从HTML中提取主要内容
   * @param $ cheerio加载的HTML
   * @returns 提取的内容文本
   */
  private static extractMainContent($: cheerio.CheerioAPI): string {
    // 尝试获取主要内容
    let mainContent = ''
    const possibleSelectors = [
      'article',
      'main',
      '.content',
      '#content',
      '.post-content',
      '.article-content',
      '.entry-content',
      '[role="main"]',
      '.container'
    ]

    for (const selector of possibleSelectors) {
      const element = $(selector)
      if (element.length > 0) {
        mainContent = element.text()
        break
      }
    }
    mainContent = mainContent
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .trim()

    // 如果没有找到主要内容，使用body
    if (!mainContent) {
      mainContent = $('body').text()
    }
    // 清理文本内容
    mainContent = mainContent
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000)
    return mainContent
  }

  /**
   * 从HTML中提取网站图标
   * @param $ cheerio加载的HTML
   * @param url 页面URL
   * @returns 图标URL
   */
  private static extractFavicon($: cheerio.CheerioAPI, url: string): string {
    // 尝试获取网站图标
    let icon = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href')

    // 如果找到了相对路径的图标，转换为绝对路径
    if (icon && !icon.startsWith('http')) {
      const urlObj = new URL(url)
      icon = icon.startsWith('/')
        ? `${urlObj.protocol}//${urlObj.host}${icon}`
        : `${urlObj.protocol}//${urlObj.host}/${icon}`
    }

    // 如果没有找到图标，使用默认的favicon.ico
    if (!icon) {
      const urlObj = new URL(url)
      icon = `${urlObj.protocol}//${urlObj.host}/favicon.ico`
    }

    return icon
  }

  /**
   * 根据提取的URL内容丰富用户消息
   * @param userText 原始用户消息
   * @param urlResults 提取的URL内容结果
   * @returns 丰富后的用户消息
   */
  static enrichUserMessageWithUrlContent(userText: string, urlResults: SearchResult[]): string {
    if (urlResults.length === 0) {
      return userText
    }

    let enrichedContent = `---
  如下url-content的标签中包含了用户上述提到的一些链接的具体信息:
  <url-content>
  \n
  `
    for (let i = 0; i < urlResults.length; i++) {
      const result = urlResults[i]
      if (result.content) {
        enrichedContent += `<url-content-item><url>${result.url}</url>\n<content>${result.content}</content>\n</url-content-item>`
      }
    }
    enrichedContent += `</url-content>`

    return enrichedContent
  }
}
