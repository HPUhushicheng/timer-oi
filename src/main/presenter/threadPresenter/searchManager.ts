import { app, BrowserWindow } from 'electron'
import path from 'path'
import { SearchEngineTemplate } from '@shared/chat'
import { ContentEnricher } from './contentEnricher'
import { SearchResult } from '@shared/presenter'
import { is } from '@electron-toolkit/utils'
const helperPage = path.join(app.getAppPath(), 'resources', 'blankSearch.html')

const defaultEngines: SearchEngineTemplate[] = [
  {
    name: 'sogou',
    selector: '.news-list',
    searchUrl:
      'https://weixin.sogou.com/weixin?ie=utf8&s_from=input&_sug_=y&_sug_type_=&type=2&query={query}',
    extractorScript: `
      const results = []
      const items = document.querySelectorAll('.news-list li')
      items.forEach((item, index) => {
        const titleEl = item.querySelector('h3 a')
        const linkEl = item.querySelector('h3 a')
        const descEl = item.querySelector('p.txt-info')
        const faviconEl = item.querySelector('a[data-z="art"] img')
        if (titleEl && linkEl) {
          results.push({
            title: titleEl.textContent,
            url: linkEl.href,
            rank: index + 1,
            description: descEl ? descEl.textContent : '',
            icon: faviconEl ? faviconEl.src : ''
          })
        }
      })
      return results
    `
  },
  {
    name: 'google',
    selector: '#search',
    searchUrl: 'https://www.google.com/search?q={query}',
    extractorScript: `
      const results = []
      const items = document.querySelectorAll('#search .g')
      items.forEach((item, index) => {
        const titleEl = item.querySelector('h3')
        const linkEl = item.querySelector('a')
        const descEl = item.querySelector('.VwiC3b')
        const faviconEl = item.querySelector('img.XNo5Ab')
        if (titleEl && linkEl) {
          results.push({
            title: titleEl.textContent,
            url: linkEl.href,
            rank: index + 1,
            description: descEl ? descEl.textContent : '',
            icon: faviconEl ? faviconEl.src : ''
          })
        }
      })
      return results
    `
  },
  {
    name: 'baidu',
    selector: '#content_left',
    searchUrl: 'https://www.baidu.com/s?wd={query}',
    extractorScript: `
      const results = []
      const items = document.querySelectorAll('#content_left .result')
      items.forEach((item, index) => {
        const titleEl = item.querySelector('.t')
        const linkEl = item.querySelector('a')
        const descEl = item.querySelector('.c-abstract')
        const faviconEl = item.querySelector('.c-img')
        if (titleEl && linkEl) {
          results.push({
            title: titleEl.textContent,
            url: linkEl.href,
            rank: index + 1,
            description: descEl ? descEl.textContent : '',
            icon: faviconEl ? faviconEl.getAttribute('src') : ''
          })
        }
      })
      return results
    `
  },
  {
    name: 'bing',
    selector: '',
    searchUrl: 'https://www.bing.com/search?q={query}',
    extractorScript: `
      const results = []
      const items = document.querySelectorAll('#b_content .b_algo')
      items.forEach((item, index) => {
        const titleEl = item.querySelector('h2 a')
        const linkEl = item.querySelector('h2 a')
        const descEl = item.querySelector('.b_caption p')
        const faviconEl = item.querySelector('.wr_fav img')
        if (titleEl && linkEl) {
          results.push({
            title: titleEl.textContent,
            url: linkEl.href,
            rank: index + 1,
            description: descEl ? descEl.textContent : '',
            icon: faviconEl?.src ? faviconEl.src : ''
          })
        }
      })
      return results
    `
  },
  {
    name: 'google-scholar',
    selector: '#gs_res_ccl',
    searchUrl: 'https://scholar.google.com/scholar?q={query}',
    extractorScript: `
      const results = []
      const items = document.querySelectorAll('.gs_r')
      items.forEach((item, index) => {
        const titleEl = item.querySelector('.gs_rt')
        const linkEl = item.querySelector('.gs_rt a')
        const descEl = item.querySelector('.gs_rs')
        const faviconEl = item.querySelector('.gs_rt img')
        if (titleEl && linkEl) {
          results.push({
            title: titleEl.textContent,
            url: linkEl.href,
            rank: index + 1,
            description: descEl ? descEl.textContent : '',
            icon: faviconEl ? faviconEl.src : ''
          })
        }
      })
      return results
    `
  },
  {
    name: 'baidu-xueshu',
    selector: '#bdxs_result_lists',
    searchUrl: 'https://xueshu.baidu.com/s?wd={query}',
    extractorScript: `
      const results = []
      const items = document.querySelectorAll('#bdxs_result_lists .sc_default_result')
      items.forEach((item, index) => {
        const titleEl = item.querySelector('.sc_content .t')
        const linkEl = item.querySelector('.sc_content a')
        const descEl = item.querySelector('.c_abstract')
        if (titleEl && linkEl) {
          results.push({
            title: titleEl.textContent?.trim(),
            url: linkEl.href,
            rank: index + 1,
            description: descEl ? descEl.textContent?.trim() : '',
            icon:  ''
          })
        }
      })
      return results
    `
  },
  {
    name: 'duckduckgo',
    selector: 'button.cxQwADb9kt3UnKwcXKat',
    searchUrl: 'https://duckduckgo.com/?q={query}',
    extractorScript: `
      const results = []
      const items = document.querySelectorAll('article.yQDlj3B5DI5YO8c8Ulio')
      items.forEach((item, index) => {
        const titleEl = item.querySelector('.EKtkFWMYpwzMKOYr0GYm.LQVY1Jpkk8nyJ6HBWKAk')
        const linkEl = item.querySelector('a')
        const descEl = item.querySelector('.E2eLOJr8HctVnDOTM8fs')
        const icon = item.querySelector('.DpVR46dTZaePK29PDkz8 img')
        if (titleEl && linkEl) {
          results.push({
            title: titleEl.textContent,
            url: linkEl.href,
            rank: index + 1,
            description: descEl ? descEl.textContent : '',
            icon: icon ? icon.src : ''
          })
        }
      })
      return results
    `
  }
]

export class SearchManager {
  private searchWindows: Map<string, BrowserWindow> = new Map()
  private isDevelopment = process.env.NODE_ENV === 'development'
  private maxConcurrentSearches = 3
  private engines: SearchEngineTemplate[] = defaultEngines
  private activeEngine: SearchEngineTemplate = this.engines[0]

  constructor() {}

  getEngines(): SearchEngineTemplate[] {
    return this.engines
  }

  getActiveEngine(): SearchEngineTemplate {
    return this.activeEngine
  }

  setActiveEngine(engineName: string): boolean {
    const engine = this.engines.find((e) => e.name === engineName)
    if (engine) {
      this.activeEngine = engine
      return true
    }
    return false
  }

  updateEngines(newEngines: SearchEngineTemplate[]): void {
    this.engines = newEngines
    if (!this.engines.find((e) => e.name === this.activeEngine.name)) {
      this.activeEngine = this.engines[0]
    }
  }

  private initSearchWindow(conversationId: string): BrowserWindow {
    if (this.searchWindows.size >= this.maxConcurrentSearches) {
      // 找到最早创建的窗口并销毁
      const [oldestConversationId] = this.searchWindows.keys()
      this.destroySearchWindow(oldestConversationId)
    }

    const searchWindow = new BrowserWindow({
      width: 800,
      height: 600,
      show: this.isDevelopment,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        devTools: is.dev
      }
    })

    searchWindow.webContents.session.webRequest.onBeforeSendHeaders(
      { urls: ['*://*/*'] },
      (details, callback) => {
        const headers = {
          ...details.requestHeaders,
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        callback({ requestHeaders: headers })
      }
    )
    if (is.dev) {
      searchWindow.webContents.openDevTools()
    }
    this.searchWindows.set(conversationId, searchWindow)
    return searchWindow
  }

  private destroySearchWindow(conversationId: string) {
    const window = this.searchWindows.get(conversationId)
    if (window) {
      window.destroy()
      this.searchWindows.delete(conversationId)
    }
  }

  async search(conversationId: string, query: string): Promise<SearchResult[]> {
    let searchWindow = this.searchWindows.get(conversationId)
    if (!searchWindow) {
      searchWindow = this.initSearchWindow(conversationId)
    }

    const searchUrl = this.activeEngine.searchUrl.replace('{query}', encodeURIComponent(query))
    console.log('开始加载搜索URL:', searchUrl)

    const loadTimeout = setTimeout(() => {
      searchWindow?.webContents.stop()
    }, 8000)

    try {
      await searchWindow.loadURL(searchUrl)
      console.log('搜索URL加载成功')
    } catch (error) {
      console.error('加载URL失败:', error)
    } finally {
      clearTimeout(loadTimeout)
    }

    await this.waitForSelector(searchWindow, this.activeEngine.selector)
    console.log('搜索结果加载完成')

    const results = await this.extractSearchResults(searchWindow)
    console.log('搜索结果提取完成:', results?.length)

    const enrichedResults = await this.enrichResults(results.slice(0, 5))
    console.log('详细内容获取完成')

    searchWindow
      .loadFile(helperPage)
      .then(() => {
        this.destroySearchWindow(conversationId)
      })
      .catch((error) => {
        console.error('加载空白页失败:', error)
        this.destroySearchWindow(conversationId)
      })
    const remainingResults = results.slice(5) // 获取剩余的结果
    const combinedResults = [...enrichedResults, ...remainingResults] // 合并enrichedResults和剩余的results
    return combinedResults
  }

  private async waitForSelector(window: BrowserWindow, selector: string): Promise<void> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve() // 12秒后自动返回
      }, 12000)
      // 如果selector不为空，就等待selector出现
      if (selector) {
        window.webContents
          .executeJavaScript(
            `
        new Promise((innerResolve) => {
          if (document.querySelector('${selector}')) {
            innerResolve();
          } else {
            const observer = new MutationObserver(() => {
              if (document.querySelector('${selector}')) {
                observer.disconnect();
                innerResolve();
              }
            });
            observer.observe(document.body, { childList: true, subtree: true });
          }
        })
      `
          )
          .then(() => {
            resolve()
          })
          .catch(() => {
            resolve()
          })

        clearTimeout(timeout)
        resolve()
      }
    })
  }

  private async extractSearchResults(window: BrowserWindow): Promise<SearchResult[]> {
    return await window.webContents.executeJavaScript(`
      (function() {
        ${this.activeEngine.extractorScript}
      })()
    `)
  }

  private async enrichResults(results: SearchResult[]): Promise<SearchResult[]> {
    return await ContentEnricher.enrichResults(results)
  }

  destroy() {
    for (const [conversationId] of this.searchWindows) {
      this.destroySearchWindow(conversationId)
    }
  }
}
