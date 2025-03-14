import { renderMermaidDiagram } from '@/lib/mermaid.helper'
import { EditorView, basicSetup } from 'codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { json } from '@codemirror/lang-json'
import { java } from '@codemirror/lang-java'
import { go } from '@codemirror/lang-go'
import { markdown } from '@codemirror/lang-markdown'
import { sql } from '@codemirror/lang-sql'
import { xml } from '@codemirror/lang-xml'
import { cpp } from '@codemirror/lang-cpp'
import { rust } from '@codemirror/lang-rust'
import { shell } from '@codemirror/legacy-modes/mode/shell'
import { swift } from '@codemirror/legacy-modes/mode/swift'
import { ruby } from '@codemirror/legacy-modes/mode/ruby'
import { perl } from '@codemirror/legacy-modes/mode/perl'
import { lua } from '@codemirror/legacy-modes/mode/lua'
import { haskell } from '@codemirror/legacy-modes/mode/haskell'
import { erlang } from '@codemirror/legacy-modes/mode/erlang'
import { clojure } from '@codemirror/legacy-modes/mode/clojure'
import { StreamLanguage } from '@codemirror/language'
import { php } from '@codemirror/lang-php'
import { yaml } from '@codemirror/lang-yaml'
import { EditorState } from '@codemirror/state'
import { anysphereTheme } from '@/lib/code.theme'

export const editorInstances: Map<string, EditorView> = new Map()
// Initialize code editors
export const useCodeEditor = (id: string) => {
  const initCodeEditors = (status?: 'loading' | 'success' | 'error') => {
    const codeBlocks = document.querySelectorAll(`#${id} .code-block`)

    codeBlocks.forEach((block) => {
      const editorId = block.getAttribute('id')
      const editorContainer = block.querySelector('.code-editor')
      const code = block.getAttribute('data-code')
      const lang = block.getAttribute('data-lang')

      if (!editorId || !editorContainer || !code || !lang) {
        return
      }

      const decodedCode = decodeURIComponent(escape(atob(code)))

      // 如果是 mermaid 代码块，渲染图表
      if (lang.toLowerCase() === 'mermaid' && status !== 'loading') {
        renderMermaidDiagram(editorContainer as HTMLElement, decodedCode, editorId)
        return
      }

      // 如果编辑器已存在，更新内容而不是重新创建
      if (editorInstances.has(editorId)) {
        const existingEditor = editorInstances.get(editorId)
        const currentContent = existingEditor?.state.doc.toString()

        // 只在内容变化时更新
        if (currentContent !== decodedCode) {
          existingEditor?.dispatch({
            changes: {
              from: 0,
              to: currentContent?.length || 0,
              insert: decodedCode
            }
          })
        }
        return
      }

      // 创建新的编辑器实例
      const extensions = [
        basicSetup,
        anysphereTheme,
        EditorView.lineWrapping,
        EditorState.tabSize.of(2)
      ]

      switch (lang.toLowerCase()) {
        case 'javascript':
        case 'js':
        case 'ts':
        case 'typescript':
          extensions.push(javascript())
          break
        case 'react':
        case 'vue':
        case 'html':
          extensions.push(html())
          break
        case 'css':
          extensions.push(css())
          break
        case 'json':
          extensions.push(json())
          break
        case 'python':
        case 'py':
          extensions.push(python())
          break
        case 'kotlin':
        case 'kt':
        case 'java':
          extensions.push(java())
          break
        case 'go':
        case 'golang':
          extensions.push(go())
          break
        case 'markdown':
        case 'md':
          extensions.push(markdown())
          break
        case 'sql':
          extensions.push(sql())
          break
        case 'xml':
          extensions.push(xml())
          break
        case 'cpp':
        case 'c++':
        case 'c':
          extensions.push(cpp())
          break
        case 'rust':
        case 'rs':
          extensions.push(rust())
          break
        case 'bash':
        case 'sh':
        case 'shell':
        case 'zsh':
          extensions.push(StreamLanguage.define(shell))
          break
        case 'php':
          extensions.push(php())
          break
        case 'yaml':
        case 'yml':
          extensions.push(yaml())
          break
        case 'swift':
          extensions.push(StreamLanguage.define(swift))
          break
        case 'ruby':
          extensions.push(StreamLanguage.define(ruby))
          break
        case 'perl':
          extensions.push(StreamLanguage.define(perl))
          break
        case 'lua':
          extensions.push(StreamLanguage.define(lua))
          break
        case 'haskell':
          extensions.push(StreamLanguage.define(haskell))
          break
        case 'erlang':
          extensions.push(StreamLanguage.define(erlang))
          break
        case 'clojure':
          extensions.push(StreamLanguage.define(clojure))
          break
        case 'mermaid':
          // 使用简单的文本编辑器，不使用 StreamLanguage
          extensions.push(markdown())
          break
      }

      try {
        if (editorContainer instanceof HTMLElement) {
          try {
            const editorView = new EditorView({
              state: EditorState.create({
                doc: decodedCode,
                extensions: [
                  ...extensions,
                  EditorState.readOnly.of(true)
                  // Remove the inline theme configuration
                ]
              }),
              parent: editorContainer
            })
            editorInstances.set(editorId, editorView)
          } catch (innerError) {
            console.error('Failed with standard method, trying fallback:', innerError)
            // Fallback if CodeMirror fails - create a basic pre element with escaped HTML
            const escapedCode = decodedCode
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;')
            editorContainer.innerHTML = `<pre style="white-space: pre-wrap; color: #ffffff; margin: 0;">${escapedCode}</pre>`
          }
        } else {
          console.error('Editor container is not a valid HTMLElement')
        }
      } catch (error) {
        console.error('Failed to initialize editor:', error)
      }
    })
  }

  const cleanupEditors = () => {
    editorInstances.forEach((editor) => {
      editor.destroy()
    })
    editorInstances.clear()
  }

  return {
    initCodeEditors,
    cleanupEditors
  }
}
