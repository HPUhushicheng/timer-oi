<template>
  <li
    :class="[
      ' select-none px-2 py-2 rounded-md text-accent-foreground text-xs cursor-pointer group flex items-center justify-between',
      isActive ? 'bg-slate-200 dark:bg-accent' : 'hover:bg-accent'
    ]"
    @click="$emit('select', thread)"
  >
    <span class="truncate">{{ thread.title }}</span>

    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          class="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Icon icon="lucide:more-horizontal" class="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem @select="$emit('rename', thread)">
          <Icon icon="lucide:pencil" class="mr-2 h-4 w-4" />
          <span>{{ t('thread.actions.rename') }}</span>
        </DropdownMenuItem>

        <DropdownMenuItem @select="$emit('cleanmsgs', thread)">
          <Icon icon="lucide:eraser" class="mr-2 h-4 w-4" />
          <span>{{ t('thread.actions.cleanMessages') }}</span>
        </DropdownMenuItem>

        <DropdownMenuItem class="text-destructive" @select="$emit('delete', thread)">
          <Icon icon="lucide:trash-2" class="mr-2 h-4 w-4" />
          <span>{{ t('thread.actions.delete') }}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </li>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/vue'
import type { CONVERSATION } from '@shared/presenter'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu'

defineProps<{
  thread: CONVERSATION
  isActive: boolean
}>()

defineEmits<{
  select: [thread: CONVERSATION]
  rename: [thread: CONVERSATION]
  delete: [thread: CONVERSATION]
  cleanmsgs: [thread: CONVERSATION]
}>()

const { t } = useI18n()
</script>
