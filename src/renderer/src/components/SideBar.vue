<template>
  <div class="flex p-2 flex-col items-center border-r bg-background">
    <!-- Navigation Items -->
    <nav class="flex flex-1 flex-col gap-2">

      <!-- echart Section -->

      <Button
        variant="ghost"
        size="icon"
        class="rounded-lg w-9 h-9"
        :class="{ 'bg-accent': modelValue === 'echart' }"
        @click="echart"  
      >
        <Icon
          icon="lucide:atom"
          :class="['h-5 w-5', modelValue === 'echart ' ? ' text-primary' : 'text-muted-foreground']"
        />
        <span class="sr-only">echart</span>
      </Button>


      <!-- Chat Section -->
      <Button
        variant="ghost"
        size="icon"
        class="rounded-lg w-9 h-9"
        :class="{ 'bg-accent': modelValue === 'chat' }"
        @click="$emit('update:modelValue', 'chat')"
      >
        <Icon
          icon="lucide:message-circle"
          :class="['h-5 w-5', modelValue === 'chat' ? ' text-primary' : 'text-muted-foreground']"
        />
        <span class="sr-only">Chat</span>
      </Button>

      <!-- ZhuYe Section -->
      <!-- <Button
        variant="ghost"
        size="icon"
        class="rounded-lg w-9 h-9"
        :class="{ 'bg-accent': modelValue === 'ZhuYe' }"
        @click="router.push('/zhuye')"
      >
        <Icon
          icon="lucide:activity"
          :class="['h-5 w-5', modelValue === 'ZhuYe ' ? ' text-primary' : 'text-muted-foreground']"
        />
        <span class="sr-only">ZhuYe</span>
      </Button> -->



    <!-- note Section -->

    <Button
        variant="ghost"
        size="icon"
        class="rounded-lg w-9 h-9"
        :class="{ 'bg-accent': modelValue === 'note' }"
        @click="noteClick"  
      >
        <Icon
          icon="lucide:book-type"
          :class="['h-5 w-5', modelValue === 'note ' ? ' text-primary' : 'text-muted-foreground']"
        />
        <span class="sr-only">note</span>
      </Button>

    <!-- card Section -->

    <!-- <Button
        variant="ghost"
        size="icon"
        class="rounded-lg w-9 h-9"
        :class="{ 'bg-accent': modelValue === 'card' }"
        @click="cardClick"  
      >
        <Icon
          icon="lucide:instagram"
          :class="['h-5 w-5', modelValue === 'card ' ? ' text-primary' : 'text-muted-foreground']"
        />
        <span class="sr-only">card</span>
      </Button> -->


      <!-- Settings Section -->

      <Button
        variant="ghost"
        size="icon"
        class="rounded-lg w-9 h-9"
        :class="{ 'bg-accent': modelValue === 'settings' }"
        @click="$emit('update:modelValue', 'settings')"
      >
        <Icon
          icon="lucide:bolt"
          :class="[
            'h-5 w-5',
            modelValue === 'settings' ? ' text-primary' : 'text-muted-foreground'
          ]"
        />
        <span class="sr-only">Settings</span>
      </Button>

    </nav>

    <!-- User Profile Section -->
    <div class="mt-auto relative flex flex-col items-center">
      <Button
        variant="ghost"
        size="icon"
        class="w-9 h-9 rounded-lg text-muted-foreground"
        @click="toggleDark()"
      >
        <Icon :icon="isDark ? 'lucide:sun' : 'lucide:moon'" class="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        class="rounded-lg w-9 h-9 text-muted-foreground relative"
        @click="handleProfileClick"
      >
        <Icon icon="lucide:user" class="h-5 w-5" />
        <span
          v-if="settings.hasUpdate"
          class="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse"
        ></span>
        <span class="sr-only">User Profile</span>
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { useSettingsStore } from '@/stores/settings'
import { onMounted, watch } from 'vue'
import { useDark, useToggle } from '@vueuse/core'
import { useRouter } from 'vue-router'

function noteClick(){
  router.push('/note');
}
function echart(){
  router.push('/echart');
}

// function cardClick(){
//   router.push('/card');
// }



defineProps<{
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
const settings = useSettingsStore()
const isDark = useDark()
const toggleDark = useToggle(isDark)
const router = useRouter()


const handleProfileClick = async () => {
  if (!settings.hasUpdate) {
    await settings.checkUpdate()
  } else {
    settings.openUpdateDialog()
  }
}

// 监听更新状态变化，当有新更新时自动显示更新弹窗
watch(
  () => settings.hasUpdate,
  (newVal, oldVal) => {
    if (newVal && !oldVal) {
      settings.openUpdateDialog()
    }
  }
)

onMounted(() => {
  settings.checkUpdate()
})
</script>
