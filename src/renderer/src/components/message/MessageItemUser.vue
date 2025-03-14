<template>
  <div :class="['flex flex-row-reverse group p-4 pl-11 gap-2']">
    <!-- 头像 -->
    <div class="w-5 h-5 bg-muted rounded-md overflow-hidden">
      <img v-if="message.avatar" :src="message.avatar" class="w-full h-full" :alt="message.role" />
      <div v-else class="w-full h-full flex items-center justify-center text-muted-foreground">
        <Icon icon="lucide:user" class="w-4 h-4" />
      </div>
    </div>
    <div class="flex flex-col w-full space-y-1.5 items-end">
      <MessageInfo
        class="flex-row-reverse"
        :name="message.name ?? 'user'"
        :timestamp="message.timestamp"
      />
      <!-- 消息内容 -->
      <div class="text-sm bg-[#EFF6FF] dark:bg-muted rounded-lg p-2 border flex flex-col gap-1.5">
        <div v-show="message.content.files.length > 0" class="flex flex-wrap gap-1.5">
          <FileItem
            v-for="file in message.content.files"
            :key="file.name"
            :file-name="file.name"
            :deletable="false"
            :tokens="file.token"
            :mime-type="file.mimeType"
            @click="previewFile(file.path)"
          />
        </div>
        <div class="text-sm whitespace-pre-wrap break-all">{{ message.content.text }}</div>
        <!-- disable for now -->
        <!-- <div class="flex flex-row gap-1.5 text-xs text-muted-foreground">
          <span v-if="message.content.search">联网搜索</span>
          <span v-if="message.content.reasoning_content">深度思考</span>
        </div> -->
      </div>
      <MessageToolbar
        class="flex-row-reverse"
        :usage="message.usage"
        :loading="false"
        :is-assistant="false"
        @delete="handleAction('delete')"
        @copy="handleAction('copy')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { UserMessage } from '@shared/chat'
import { Icon } from '@iconify/vue'
import MessageInfo from './MessageInfo.vue'
import FileItem from '../FileItem.vue'
import MessageToolbar from './MessageToolbar.vue'
import { useChatStore } from '@/stores/chat'
import { usePresenter } from '@/composables/usePresenter'

const chatStore = useChatStore()
const windowPresenter = usePresenter('windowPresenter')

const props = defineProps<{
  message: UserMessage
}>()

defineEmits<{
  fileClick: [fileName: string]
}>()

const previewFile = (filePath: string) => {
  windowPresenter.previewFile(filePath)
}

const handleAction = (action: 'delete' | 'copy') => {
  if (action === 'delete') {
    chatStore.deleteMessage(props.message.id)
  } else if (action === 'copy') {
    window.api.copyText(props.message.content.text)
  }
}
</script>
