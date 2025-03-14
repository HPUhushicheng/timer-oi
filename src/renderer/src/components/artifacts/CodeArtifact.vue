<template>
  <div class="code-artifact h-full">
    <div class="h-full p-4">
      <div class="code-block">
        <div class="code-header">
          <div class="flex items-center gap-2">
            <div class="code-lang">{{ displayLanguage }}</div>
          </div>
          <div class="flex items-center gap-2">
            <button class="copy-button" @click="handleCopy">
              <Icon icon="lucide:clipboard" class="w-4 h-4 mr-1" />
              {{ copied ? t('common.copySuccess') : t('common.copyCode') }}
            </button>
          </div>
        </div>
        <div class="code-content" ref="editorContainer"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { java } from '@codemirror/lang-java'
import { cpp } from '@codemirror/lang-cpp'
import { php } from '@codemirror/lang-php'
import { rust } from '@codemirror/lang-rust'
import { sql } from '@codemirror/lang-sql'
import { json } from '@codemirror/lang-json'
import { xml } from '@codemirror/lang-xml'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'

const { t } = useI18n()
const copied = ref(false)
const editorContainer = ref<HTMLElement>()
let editor: EditorView | null = null

const props = defineProps<{
  block: {
    artifact: {
      type: string
      title: string
      language?: string
    }
    content: string
  }
  isPreview: boolean
}>()

// 语言映射表
const languageAliases: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  rb: 'ruby',
  sh: 'bash',
  yml: 'yaml',
  md: 'markdown',
  vue: 'javascript',
  jsx: 'javascript',
  tsx: 'typescript'
}

// 获取显示用的语言名称
const displayLanguage = computed(() => {
  const lang = props.block.artifact?.language?.toLowerCase() || 'text'
  const displayNames: Record<string, string> = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    python: 'Python',
    java: 'Java',
    cpp: 'C++',
    csharp: 'C#',
    php: 'PHP',
    ruby: 'Ruby',
    go: 'Go',
    rust: 'Rust',
    swift: 'Swift',
    kotlin: 'Kotlin',
    html: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    sql: 'SQL',
    json: 'JSON',
    yaml: 'YAML',
    markdown: 'Markdown',
    bash: 'Bash',
    shell: 'Shell',
    dockerfile: 'Dockerfile',
    vue: 'Vue',
    react: 'React',
    xml: 'XML',
    text: 'Plain Text'
  }
  return displayNames[lang] || lang.toUpperCase()
})

// 获取对应的 CodeMirror 语言支持
const getLanguageSupport = (lang: string) => {
  const mappedLang = languageAliases[lang] || lang
  switch (mappedLang.toLowerCase()) {
    case 'javascript':
    case 'typescript':
    case 'jsx':
    case 'tsx':
      return javascript()
    case 'python':
      return python()
    case 'java':
      return java()
    case 'cpp':
    case 'c++':
    case 'c':
      return cpp()
    case 'php':
      return php()
    case 'rust':
      return rust()
    case 'sql':
      return sql()
    case 'json':
      return json()
    case 'xml':
    case 'html':
    case 'vue':
      return xml()
    case 'markdown':
    case 'md':
      return markdown()
    default:
      return null
  }
}

const handleCopy = async () => {
  try {
    window.api.copyText(props.block.content)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

const initEditor = () => {
  if (!editorContainer.value) return

  const lang = props.block.artifact?.language?.toLowerCase() || ''
  const languageSupport = getLanguageSupport(lang)

  const extensions = [
    basicSetup,
    oneDark,
    EditorState.readOnly.of(true),
    EditorView.editable.of(false),
    EditorView.lineWrapping
  ]

  if (languageSupport) {
    extensions.push(languageSupport)
  }

  const state = EditorState.create({
    doc: props.block.content || '',
    extensions
  })

  editor = new EditorView({
    state,
    parent: editorContainer.value
  })
}

onMounted(() => {
  initEditor()
})

onBeforeUnmount(() => {
  if (editor) {
    editor.destroy()
    editor = null
  }
})
</script>

<style scoped>
.code-artifact {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.code-block {
  @apply rounded-lg overflow-hidden border border-border;
  background-color: #1e1e1e;
}

.code-header {
  @apply flex justify-between items-center px-4 py-2;
  background-color: #181818;
  border-bottom: 1px solid rgb(55, 55, 55);
}

.code-lang {
  @apply text-xs text-muted-foreground px-2 py-1 rounded-md bg-muted;
}

.copy-button {
  @apply text-xs text-muted-foreground hover:text-foreground flex items-center px-2 py-1 rounded-md transition-colors duration-200 hover:bg-muted;
}

.code-content {
  @apply p-4;
  background-color: #1e1e1e;
  min-height: 2.5rem;
}

/* CodeMirror 自定义样式 */
.code-content .cm-editor {
  height: 100%;
  min-height: 2.5rem;
}

.code-content .cm-editor.cm-focused {
  outline: none;
}

.code-content .cm-scroller {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  font-size: 0.875rem;
  line-height: 1.5;
}

.code-content .cm-gutters {
  background-color: #1e1e1e;
  border-right: 1px solid #333;
}

.code-content .cm-lineNumbers {
  color: #666;
}

.code-content .cm-activeLineGutter {
  background-color: #282828;
}

/* 滚动条样式 */
.code-content .cm-scroller::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.code-content .cm-scroller::-webkit-scrollbar-track {
  background: transparent;
}

.code-content .cm-scroller::-webkit-scrollbar-thumb {
  @apply bg-muted-foreground/20 rounded-full;
}

.code-content .cm-scroller::-webkit-scrollbar-thumb:hover {
  @apply bg-muted-foreground/40;
}
</style>
