import { computed } from 'vue'
export interface ProcessedPart {
  type: 'text' | 'thinking' | 'artifact'
  content: string
  loading?: boolean
  artifact?: {
    identifier: string
    title: string
    type:
      | 'application/vnd.ant.code'
      | 'text/markdown'
      | 'text/html'
      | 'image/svg+xml'
      | 'application/vnd.ant.mermaid'
    language?: string
  }
}
export const useBlockContent = (props: {
  block: {
    content: string
    status?: 'loading' | 'success' | 'error'
    timestamp: number
  }
}) => {
  const processedContent = computed<ProcessedPart[]>(() => {
    if (!props.block.content) return [{ type: 'text', content: '' }]
    // if (props.block.status === 'loading') {
    //   return [
    //     {
    //       type: 'text',
    //       content: props.block.content
    //     }
    //   ]
    // }
    // 调试代码：
    // 严格的Markdown代码块检测

    // 正常的内容处理逻辑（提取代码块和Mermaid图表）
    const parts: ProcessedPart[] = []
    let content = props.block.content
    let lastIndex = 0

    // 处理 antThinking 标签
    const thinkingRegex = /<antThinking>(.*?)<\/antThinking>/gs
    let match
    let hasMatchedClosedThinkingTags = false

    while ((match = thinkingRegex.exec(content)) !== null) {
      hasMatchedClosedThinkingTags = true
      // 添加思考前的普通文本
      if (match.index > lastIndex) {
        const text = content.substring(lastIndex, match.index)
        if (text.trim()) {
          parts.push({
            type: 'text',
            content: text
          })
        }
      }

      // 添加思考内容
      parts.push({
        type: 'thinking',
        content: match[1].trim(),
        loading: false
      })

      //console.log(match[0], '\n\n', match[1])

      lastIndex = match.index + match[0].length
    }

    // 如果没有找到闭合的思考标签，尝试查找未闭合的 antThinking 标签
    if (!hasMatchedClosedThinkingTags) {
      // 重置 lastIndex 以便从头开始搜索
      lastIndex = 0
      // 只匹配开始标签的正则表达式
      const unclosedThinkingRegex = /<antThinking>([\s\S]*)/gs

      while ((match = unclosedThinkingRegex.exec(content)) !== null) {
        // 添加 thinking 前的普通文本
        if (match.index > lastIndex) {
          const text = content.substring(lastIndex, match.index)
          if (text.trim()) {
            parts.push({
              type: 'text',
              content: text
            })
          }
        }

        // 添加未闭合标签的思考内容（将剩余所有内容视为思考内容）
        parts.push({
          type: 'thinking',
          content: match[1].trim(),
          loading: false
        })

        lastIndex = match.index + match[0].length
      }
    }

    // 处理 antArtifact 标签
    const artifactRegex =
      /<antArtifact\s+(?=.*\btype="([^"]+)")(?=.*\bidentifier="([^"]+)")(?=.*\btitle="([^"]+)")(?:\s+language="([^"]+)")?\s*(?:[^>]*?)>([\s\S]*?)<\/antArtifact>/gs
    content = props.block.content
    let hasMatchedClosedTags = false
    while ((match = artifactRegex.exec(content)) !== null) {
      hasMatchedClosedTags = true
      // 添加 artifact 前的普通文本
      if (match.index > lastIndex) {
        const text = content.substring(lastIndex, match.index)
        if (text.trim()) {
          parts.push({
            type: 'text',
            content: text
          })
        }
      }

      // 提取完整的标签内容用于属性匹配
      const fullTag = match[0]
      const typeMatch = fullTag.match(/type="([^"]+)"/)
      const identifierMatch = fullTag.match(/identifier="([^"]+)"/)
      const titleMatch = fullTag.match(/title="([^"]+)"/)
      const languageMatch = fullTag.match(/language="([^"]+)"/)
      // 修复内容匹配，使用非贪婪模式匹配所有内容
      const closedContentMatch = fullTag.match(/<antArtifact[^>]*>([\s\S]*?)<\/antArtifact>/s)

      // 添加 artifact 内容
      parts.push({
        type: 'artifact',
        content: closedContentMatch ? closedContentMatch[1].trim() : '',
        artifact: {
          identifier: identifierMatch ? identifierMatch[1] : '',
          type: typeMatch
            ? (typeMatch[1] as
                | 'application/vnd.ant.code'
                | 'text/markdown'
                | 'text/html'
                | 'image/svg+xml'
                | 'application/vnd.ant.mermaid')
            : 'text/markdown',
          title: titleMatch ? titleMatch[1] : '',
          language: languageMatch ? languageMatch[1] : undefined
        },
        loading: false
      })

      lastIndex = match.index + match[0].length
    }

    // 如果没有找到闭合的标签，尝试查找未闭合的 antArtifact 标签
    if (!hasMatchedClosedTags) {
      // 重置 lastIndex 以便从头开始搜索
      // 只匹配开始标签的正则表达式
      const unclosedArtifactRegex =
        /<antArtifact\s+(?=.*\btype="([^"]+)")(?=.*\bidentifier="([^"]+)")(?=.*\btitle="([^"]+)")(?:\s+language="([^"]+)")?\s*(?:[^>]*?)>([\s\S]*)/gs

      while ((match = unclosedArtifactRegex.exec(content)) !== null) {
        // 添加 artifact 前的普通文本
        if (match.index > lastIndex) {
          const text = content.substring(lastIndex, match.index)
          if (text.trim()) {
            parts.push({
              type: 'text',
              content: text
            })
          }
        }

        // 提取完整的标签内容用于属性匹配
        const fullTag = match[0]
        const typeMatch = fullTag.match(/type="([^"]+)"/)
        const identifierMatch = fullTag.match(/identifier="([^"]+)"/)
        const titleMatch = fullTag.match(/title="([^"]+)"/)
        const languageMatch = fullTag.match(/language="([^"]+)"/)
        // 提取未闭合标签后的所有内容
        const unclosedContentMatch = fullTag.match(/<antArtifact[^>]*>([\s\S]*)/s)

        // 添加未闭合标签的 artifact 内容
        parts.push({
          type: 'artifact',
          content: unclosedContentMatch ? unclosedContentMatch[1].trim() : '',
          artifact: {
            identifier: identifierMatch ? identifierMatch[1] : '',
            type: typeMatch
              ? (typeMatch[1] as
                  | 'application/vnd.ant.code'
                  | 'text/markdown'
                  | 'text/html'
                  | 'image/svg+xml'
                  | 'application/vnd.ant.mermaid')
              : 'text/markdown',
            title: titleMatch ? titleMatch[1] : '',
            language: languageMatch ? languageMatch[1] : undefined
          },
          loading: true
        })

        lastIndex = match.index + match[0].length
      }
    }

    // 添加剩余的普通文本
    if (lastIndex < content.length) {
      const text = content.substring(lastIndex)
      if (text.trim()) {
        parts.push({
          type: 'text',
          content: text
        })
      }
    }

    // 如果没有任何特殊标签，返回原始内容
    if (parts.length === 0) {
      return [
        {
          type: 'text',
          content: content
        }
      ]
    }

    // console.log(parts)
    return parts
  })
  return {
    processedContent
  }
}
