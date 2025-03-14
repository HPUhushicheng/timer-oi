<template>
  <div class="flex flex-row items-center gap-2 p-2 border-b last:border-none">
    <span class="text-xs flex-1">{{ modelName }}</span>
    <span v-if="group" class="text-xs text-muted-foreground">{{ group }}</span>
    <Button
      v-if="!enabled"
      variant="link"
      size="icon"
      class="w-7 h-7 text-xs text-normal rounded-lg"
      @click="onEnabledChange(true)"
    >
      <Icon icon="lucide:circle-minus" class="w-4 h-4 text-destructive" />
    </Button>
    <Button
      v-if="enabled"
      variant="link"
      size="icon"
      class="w-7 h-7 text-xs text-normal rounded-lg"
      @click="onEnabledChange(false)"
    >
      <Icon icon="lucide:circle-check" class="w-4 h-4 text-green-500" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/vue'

defineProps<{
  modelName: string
  modelId: string
  group?: string
  enabled: boolean
}>()

const emit = defineEmits<{
  enabledChange: [boolean]
}>()

const onEnabledChange = (enabled: boolean) => emit('enabledChange', enabled)
</script>
