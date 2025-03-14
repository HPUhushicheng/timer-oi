<template>
  <span
    ref="cursor"
    class="absolute w-2 h-[1.1em] rounded-[2px] bg-muted-foreground align-middle animate-pulse"
    :style="{
      left: `${position.x}px`,
      top: `${position.y}px`,
      transition: 'left 25ms, top 25ms'
    }"
    >&#8203;</span
  >
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

const cursor = ref<HTMLSpanElement | null>(null)
const position = ref({ x: 0, y: 0 })

// 使用零宽空格作为标记
const CURSOR_MARKER = '\u200C\u200C\u200C'

const updateCursorPosition = (container: HTMLElement) => {
  setTimeout(() => {
    nextTick(() => {
      if (cursor.value && container) {
        const proseElement = container.querySelector('.prose')
        if (proseElement) {
          const text = proseElement.textContent || ''
          const cursorPosition = text.lastIndexOf(CURSOR_MARKER)

          if (cursorPosition !== -1) {
            const range = document.createRange()
            const walker = document.createTreeWalker(proseElement, NodeFilter.SHOW_TEXT, null)

            let currentPos = 0
            let node = walker.nextNode()

            while (node) {
              const nodeLength = node.textContent?.length || 0
              if (currentPos + nodeLength > cursorPosition) {
                const offset = cursorPosition - currentPos
                range.setStart(node, offset)
                range.setEnd(node, offset + 1)
                break
              }
              currentPos += nodeLength
              node = walker.nextNode()
            }

            const rect = range.getBoundingClientRect()
            const blockRect = container.getBoundingClientRect()

            position.value = {
              x: rect.left - blockRect.left + 8,
              y: rect.top - blockRect.top
            }
          }
        }
        cursor.value.style.opacity = '1'
      }
    })
  }, 5)
}

defineExpose({
  CURSOR_MARKER,
  updateCursorPosition
})
</script>
