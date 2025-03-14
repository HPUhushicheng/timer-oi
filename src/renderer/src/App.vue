<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import AppBar from './components/AppBar.vue'
import SideBar from './components/SideBar.vue'
import UpdateDialog from './components/ui/UpdateDialog.vue'
import { usePresenter } from './composables/usePresenter'
import ArtifactDialog from './components/artifacts/ArtifactDialog.vue'
import { useArtifactStore } from './stores/artifact'
import { useChatStore } from '@/stores/chat'

const route = useRoute()
const configPresenter = usePresenter('configPresenter')
const artifactStore = useArtifactStore()
const chatStore = useChatStore()

const router = useRouter()
const activeTab = ref('chat')

const getInitComplete = async () => {
  const initComplete = await configPresenter.getSetting('init_complete')
  if (!initComplete) {
    router.push({ name: 'welcome' })
  }
}

getInitComplete()

onMounted(() => {
  watch(
    () => activeTab.value,
    (newVal) => {
      router.push({ name: newVal })
    }
  )

  watch(
    () => route.fullPath,
    (newVal) => {
      const pathWithoutQuery = newVal.split('?')[0]
      const newTab =
        pathWithoutQuery === '/'
          ? (route.name as string)
          : pathWithoutQuery.split('/').filter(Boolean)[0] || ''
      if (newTab !== activeTab.value) {
        activeTab.value = newTab
      }
      // 路由变化时关闭 artifacts 页面
      artifactStore.hideArtifact()
    }
  )

  // 监听当前对话的变化
  watch(
    () => chatStore.activeThreadId,
    () => {
      // 当切换对话时关闭 artifacts 页面
      artifactStore.hideArtifact()
    }
  )

  watch(
    () => artifactStore.isOpen,
    () => {
      chatStore.isSidebarOpen = false
    }
  )
})
</script>

<template>
  <div class="flex flex-col h-screen">
    <AppBar />
    <div class="flex flex-row h-0 flex-grow relative overflow-hidden">
      <!-- 侧边导航栏 -->
      <SideBar
        v-show="route.name !== 'welcome'"
        v-model:model-value="activeTab"
        class="h-full z-10"
      />

      <!-- 主内容区域 -->
      <div
        :class="{
          'flex-1 w-0 h-full transition-all duration-200': true,
          'mr-[calc(60%_-_104px)]': artifactStore.isOpen && route.name === 'chat'
        }"
      >
        <RouterView />
      </div>

      <!-- Artifacts 预览区域 -->
      <ArtifactDialog />
    </div>
    <!-- 全局更新弹窗 -->
    <UpdateDialog />
  </div>
</template>
