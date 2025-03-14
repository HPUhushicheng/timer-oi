<template>
  <div
    class="text-xs text-secondary-foreground items-start justify-between flex flex-row opacity-0 group-hover:opacity-100 transition-opacity"
  >
    <span v-show="!loading" class="flex flex-row gap-2">
      <Button
        v-show="isAssistant && hasVariants"
        variant="ghost"
        size="icon"
        class="w-4 h-4 text-muted-foreground hover:text-primary hover:bg-transparent"
        @click="emit('prev')"
      >
        <Icon icon="lucide:chevron-left" class="w-4 h-4" />
      </Button>
      <span v-show="isAssistant && hasVariants">
        {{ currentVariantIndex !== undefined ? currentVariantIndex + 1 : 1 }} / {{ totalVariants }}
      </span>
      <Button
        v-show="isAssistant && hasVariants"
        variant="ghost"
        size="icon"
        class="w-4 h-4 text-muted-foreground hover:text-primary hover:bg-transparent"
        @click="emit('next')"
      >
        <Icon icon="lucide:chevron-right" class="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        class="w-4 h-4 text-muted-foreground hover:text-primary hover:bg-transparent"
        @click="emit('copy')"
      >
        <Icon icon="lucide:copy" class="w-4 h-4" />
      </Button>
      <Button
        v-show="isAssistant"
        variant="ghost"
        size="icon"
        class="w-4 h-4 text-muted-foreground hover:text-primary hover:bg-transparent"
        @click="emit('retry')"
      >
        <Icon icon="lucide:refresh-cw" class="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        class="w-4 h-4 text-muted-foreground hover:text-primary hover:bg-transparent"
        @click="emit('delete')"
      >
        <Icon icon="lucide:trash-2" class="w-4 h-4" />
      </Button>
    </span>
    <span class="flex flex-row gap-2">
      <template v-if="usage.input_tokens > 0 || usage.output_tokens > 0">
        <span class="text-xs flex flex-row items-center">
          <Icon icon="lucide:arrow-up" class="w-4 h-4" />{{ usage.input_tokens }}
        </span>
        <span class="text-xs flex flex-row items-center">
          <Icon icon="lucide:arrow-down" class="w-4 h-4" />{{ usage.output_tokens }}
        </span>
      </template>
      <template v-if="hasTokensPerSecond">{{ usage.tokens_per_second?.toFixed(2) }}/s</template>
    </span>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { computed } from 'vue'

const props = defineProps<{
  usage: {
    tokens_per_second: number
    total_tokens: number
    reasoning_start_time: number
    reasoning_end_time: number
    input_tokens: number
    output_tokens: number
  }
  loading: boolean
  isAssistant: boolean
  currentVariantIndex?: number
  totalVariants?: number
}>()
const emit = defineEmits<{
  (e: 'retry'): void
  (e: 'delete'): void
  (e: 'copy'): void
  (e: 'prev'): void
  (e: 'next'): void
}>()

const hasTokensPerSecond = computed(() => props.usage.tokens_per_second > 0)
const hasVariants = computed(() => (props.totalVariants || 0) > 1)
</script>
