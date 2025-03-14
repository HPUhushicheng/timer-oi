import mermaid from 'mermaid'

// 渲染 Mermaid 图表
export const renderMermaidDiagram = async (container: HTMLElement, code: string, id: string) => {
  try {
    // 创建一个包含编辑器和图表的容器，使用 Tailwind 类
    const containerParent = container.parentElement!
    containerParent.innerHTML = `
      <div class="relative w-full border border-border bg-background dark:bg-muted rounded-lg">
        <!-- 视图切换按钮 -->
        <div class="absolute top-2 left-2 z-10 rounded-lg">
          <div class="flex items-center gap-1 backdrop-blur rounded-lg">
            <button 
              id="preview-btn-${id}" 
              class="px-2 py-1 text-xs rounded text-muted-foreground data-[active=true]:bg-slate-200 dark:data-[active=true]:bg-background data-[active=true]:text-foreground transition-colors flex items-center gap-1"
              data-id="${id}"
            >
              <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </button>
            <button 
              id="code-btn-${id}" 
              class="px-2 py-1 text-xs rounded text-muted-foreground data-[active=true]:bg-slate-200 dark:data-[active=true]:bg-background data-[active=true]:text-foreground transition-colors flex items-center gap-1"
              data-id="${id}"
            >
              <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
              </svg>
              Code
            </button>
          </div>
        </div>

        <!-- 缩放控制按钮 -->
        <div class="absolute top-2 right-2 z-10 rounded-lg">
          <div class="flex items-center gap-1 backdrop-blur rounded-lg">
            <button 
              id="zoom-in-btn-${id}" 
              class="px-2 py-1 text-xs rounded text-muted-foreground hover:bg-slate-200 dark:hover:bg-background transition-colors flex items-center gap-1"
              data-id="${id}"
            >
              <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </button>
            <button 
              id="zoom-out-btn-${id}" 
              class="px-2 py-1 text-xs rounded text-muted-foreground hover:bg-slate-200 dark:hover:bg-background transition-colors flex items-center gap-1"
              data-id="${id}"
            >
              <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </button>
            <button 
              id="zoom-reset-btn-${id}" 
              class="px-2 py-1 text-xs rounded text-muted-foreground hover:bg-slate-200 dark:hover:bg-background transition-colors flex items-center gap-1"
              data-id="${id}"
            >
              <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 12h8"></path>
                <path d="M12 8v8"></path>
              </svg>
              100%
            </button>
          </div>
        </div>

        <!-- 内容区域 -->
        <div class="rounded-lg overflow-hidden">
          <!-- 代码视图 -->
          <div id="code-view-${id}" class="hidden p-2 rounded font-mono text-xs leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-[360px]">
            <pre class="text-muted-foreground !p-2 bg-muted dark:bg-background" >${code}</pre>
          </div>
          <!-- 预览视图 -->
          <div id="preview-view-${id}" class="rounded p-4 flex justify-center items-center min-h-[360px] max-h-[360px] overflow-auto relative">
            <div id="mermaid-container-${id}" class="w-full h-full absolute inset-0 overflow-hidden" style="cursor: grab; touch-action: none;">
              <div id="mermaid-${id}" class="mermaid w-full text-center absolute" 
                   style="transform-origin: center; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%) scale(1);">${code}</div>
            </div>
          </div>
        </div>

        <!-- 导出按钮组 -->
        <div class="mt-2 flex justify-end gap-1 p-2">
          <button class="save-svg-btn px-2 py-1 bg-background text-foreground border border-border hover:bg-accent text-xs rounded  cursor-pointer transition-colors flex items-center gap-1" id="save-svg-btn-${id}" data-id="${id}">
            <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Export SVG
          </button>
          <button class="save-code-btn px-2 py-1 bg-background text-foreground border border-border hover:bg-accent text-xs rounded  cursor-pointer transition-colors flex items-center gap-1" id="save-code-btn-${id}" data-id="${id}">
            <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            Save Code
          </button>
        </div>
      </div>
    `

    // 初始化 mermaid
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      fontFamily: 'monospace',
      // logLevel: 3,
      darkMode: true
    })

    // 渲染图表
    const mermaidElement = document.getElementById(`mermaid-${id}`)
    if (mermaidElement) {
      mermaid
        .run({
          nodes: [mermaidElement]
        })
        .catch((e) => {
          console.info('Failed to render mermaid diagram:', e)
        })
    }

    // 添加视图切换事件监听器
    const previewBtn = containerParent.querySelector(`#preview-btn-${id}`)
    const codeBtn = containerParent.querySelector(`#code-btn-${id}`)
    const previewView = containerParent.querySelector(`#preview-view-${id}`)
    const codeView = containerParent.querySelector(`#code-view-${id}`)

    if (previewBtn && codeBtn && previewView && codeView) {
      previewBtn.setAttribute('data-active', 'true')
      codeBtn.setAttribute('data-active', 'false')
      previewBtn.addEventListener('click', () => {
        previewView.classList.remove('hidden')
        codeView.classList.add('hidden')
        previewBtn.setAttribute('data-active', 'true')
        codeBtn.setAttribute('data-active', 'false')
      })

      codeBtn.addEventListener('click', () => {
        previewView.classList.add('hidden')
        codeView.classList.remove('hidden')
        previewBtn.setAttribute('data-active', 'false')
        codeBtn.setAttribute('data-active', 'true')
      })
    }

    // 添加导出按钮事件监听器
    const saveSvgBtn = containerParent.querySelector('.save-svg-btn')
    const saveCodeBtn = containerParent.querySelector('.save-code-btn')

    if (saveSvgBtn) {
      saveSvgBtn.addEventListener('click', () => saveMermaidAsSVG(id))
    }

    if (saveCodeBtn) {
      saveCodeBtn.addEventListener('click', () => {
        try {
          const blob = new Blob([code], { type: 'text/plain;charset=utf-8' })
          const url = URL.createObjectURL(blob)
          const downloadLink = document.createElement('a')
          downloadLink.href = url
          downloadLink.download = `diagram-${Date.now()}.mmd`
          document.body.appendChild(downloadLink)
          downloadLink.click()
          document.body.removeChild(downloadLink)
          URL.revokeObjectURL(url)
        } catch (error) {
          console.error('Failed to save code:', error)
        }
      })
    }

    // 添加缩放功能
    const zoomInBtn = containerParent.querySelector(`#zoom-in-btn-${id}`)
    const zoomOutBtn = containerParent.querySelector(`#zoom-out-btn-${id}`)
    const zoomResetBtn = containerParent.querySelector(`#zoom-reset-btn-${id}`)
    const mermaidContainer = containerParent.querySelector(`#mermaid-${id}`)
    const mermaidWrapper = containerParent.querySelector(`#mermaid-container-${id}`)

    let currentZoom = 1.0
    const zoomStep = 0.1
    const minZoom = 0.5
    const maxZoom = 3.0

    // 拖动相关变量
    let isDragging = false
    let startX = 0
    let startY = 0
    let translateX = 0
    let translateY = 0

    if (zoomInBtn && zoomOutBtn && zoomResetBtn && mermaidContainer && mermaidWrapper) {
      // 缩放功能
      const updateZoom = () => {
        if (mermaidContainer) {
          // 移除transition以避免拖动时的延迟感
          ;(mermaidContainer as HTMLElement).style.transition = isDragging
            ? 'none'
            : 'transform 0.2s ease'
          ;(mermaidContainer as HTMLElement).style.transform =
            `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) scale(${currentZoom})`
          if (zoomResetBtn) {
            zoomResetBtn.textContent = `${Math.round(currentZoom * 100)}%`
          }
        }
      }

      zoomInBtn.addEventListener('click', () => {
        if (currentZoom < maxZoom) {
          currentZoom += zoomStep
          updateZoom()
        }
      })

      zoomOutBtn.addEventListener('click', () => {
        if (currentZoom > minZoom) {
          currentZoom -= zoomStep
          updateZoom()
        }
      })

      zoomResetBtn.addEventListener('click', () => {
        currentZoom = 1.0
        translateX = 0
        translateY = 0
        updateZoom()
      })

      // 添加拖动功能
      mermaidWrapper.addEventListener('mousedown', (e: Event) => {
        const mouseEvent = e as MouseEvent
        isDragging = true
        startX = mouseEvent.clientX
        startY = mouseEvent.clientY
        ;(mermaidWrapper as HTMLElement).style.cursor = 'grabbing'
        // 立即移除transition以避免拖动开始时的延迟
        if (mermaidContainer) {
          ;(mermaidContainer as HTMLElement).style.transition = 'none'
        }
        e.preventDefault()
      })

      // 使用requestAnimationFrame优化mousemove事件处理
      let ticking = false
      document.addEventListener('mousemove', (e: Event) => {
        if (!isDragging) return

        const mouseEvent = e as MouseEvent

        if (!ticking) {
          requestAnimationFrame(() => {
            const deltaX = mouseEvent.clientX - startX
            const deltaY = mouseEvent.clientY - startY

            translateX += deltaX
            translateY += deltaY

            updateZoom()

            startX = mouseEvent.clientX
            startY = mouseEvent.clientY
            ticking = false
          })
          ticking = true
        }
      })

      document.addEventListener('touchend', () => {
        isDragging = false
        // 恢复transition
        if (mermaidContainer) {
          ;(mermaidContainer as HTMLElement).style.transition = 'transform 0.2s ease'
        }
      })

      document.addEventListener('mouseup', () => {
        isDragging = false
        // 恢复transition
        if (mermaidContainer) {
          ;(mermaidContainer as HTMLElement).style.transition = 'transform 0.2s ease'
        }
        if (mermaidWrapper) {
          ;(mermaidWrapper as HTMLElement).style.cursor = 'grab'
        }
      })

      // 添加触摸板支持
      mermaidWrapper.addEventListener(
        'touchstart',
        (e: Event) => {
          const touchEvent = e as TouchEvent
          if (touchEvent.touches.length === 1) {
            isDragging = true
            startX = touchEvent.touches[0].clientX
            startY = touchEvent.touches[0].clientY
            e.preventDefault()
          }
        },
        { passive: false }
      )

      // 同样优化touchmove事件
      document.addEventListener(
        'touchmove',
        (e: Event) => {
          const touchEvent = e as TouchEvent
          if (!isDragging || touchEvent.touches.length !== 1) return

          if (!ticking) {
            requestAnimationFrame(() => {
              const deltaX = touchEvent.touches[0].clientX - startX
              const deltaY = touchEvent.touches[0].clientY - startY

              translateX += deltaX
              translateY += deltaY

              updateZoom()

              startX = touchEvent.touches[0].clientX
              startY = touchEvent.touches[0].clientY
              ticking = false
            })
            ticking = true
          }
        },
        { passive: false }
      )
    }
  } catch (error: unknown) {
    console.error('Failed to render mermaid diagram:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    container.innerHTML = `<div class="text-red-500 p-2 bg-red-100 rounded">Failed to render diagram: ${errorMessage}</div>`
  }
}

// 保存 Mermaid 图表为 SVG
export const saveMermaidAsSVG = (id: string) => {
  try {
    const svgElement = document.querySelector(`#mermaid-${id} svg`)
    if (!svgElement) {
      console.error('SVG element not found')
      return
    }

    // 获取 SVG 内容
    const svgData = new XMLSerializer().serializeToString(svgElement)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)

    // 创建下载链接
    const downloadLink = document.createElement('a')
    downloadLink.href = svgUrl
    downloadLink.download = `diagram-${Date.now()}.svg`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
    URL.revokeObjectURL(svgUrl)
  } catch (error) {
    console.error('Failed to save SVG:', error)
  }
}
