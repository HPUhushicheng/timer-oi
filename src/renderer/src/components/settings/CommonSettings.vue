<template>
  <ScrollArea class="w-full h-full p-2">
    <div class="w-full h-full flex flex-col gap-1.5">
      <div class="flex flex-row p-2 items-center gap-2 px-2">
        <span class="flex flex-row items-center gap-2 flex-grow w-full">
          <Icon icon="lucide:languages" class="w-4 h-4 text-muted-foreground" />
          <span class="text-sm font-medium">{{ t('settings.common.language') }}</span>
        </span>
        <div class="flex-shrink-0 min-w-64 max-w-96">
          <Select v-model="selectedLanguage" class="">
            <SelectTrigger>
              <SelectValue :placeholder="t('settings.common.languageSelect')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="lang in languageOptions" :key="lang.value" :value="lang.value">
                {{ lang.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div class="flex flex-row p-2 items-center gap-2 px-2">
        <span class="flex flex-row items-center gap-2 flex-grow w-full">
          <Icon icon="lucide:search" class="w-4 h-4 text-muted-foreground" />
          <span class="text-sm font-medium">{{ t('settings.common.searchEngine') }}</span>
        </span>
        <div class="flex-shrink-0 min-w-64 max-w-96">
          <Select v-model="selectedSearchEngine" class="">
            <SelectTrigger>
              <SelectValue :placeholder="t('settings.common.searchEngineSelect')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="engine in settingsStore.searchEngines"
                :key="engine.name"
                :value="engine.name"
              >
                {{ engine.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div class="flex flex-row p-2 items-center gap-2 px-2">
        <span class="flex flex-row items-center gap-2 flex-grow w-full">
          <Icon icon="lucide:bot" class="w-4 h-4 text-muted-foreground" />
          <span class="text-sm font-medium">{{ t('settings.common.searchAssistantModel') }}</span>
        </span>
        <div class="flex-shrink-0 min-w-64 max-w-96">
          <Popover v-model:open="modelSelectOpen">
            <PopoverTrigger as-child>
              <Button variant="outline" class="w-full justify-between">
                <div class="flex items-center gap-2">
                  <ModelIcon :model-id="selectedSearchModel?.id || ''" class="h-4 w-4" />
                  <span class="truncate">{{
                    selectedSearchModel?.name || t('settings.common.selectModel')
                  }}</span>
                </div>
                <ChevronDown class="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-80 p-0">
              <ModelSelect @update:model="handleSearchModelSelect" />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div class="flex flex-row p-2 items-center gap-2 px-2">
        <span class="flex flex-row items-center gap-2 flex-grow w-full">
          <Icon icon="lucide:globe" class="w-4 h-4 text-muted-foreground" />
          <span class="text-sm font-medium">{{ t('settings.common.proxyMode') }}</span>
        </span>
        <div class="flex-shrink-0 min-w-64 max-w-96">
          <Select v-model="selectedProxyMode" class="">
            <SelectTrigger>
              <SelectValue :placeholder="t('settings.common.proxyModeSelect')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="mode in proxyModes" :key="mode.value" :value="mode.value">
                {{ mode.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div v-if="selectedProxyMode === 'custom'" class="flex flex-col p-2 gap-2 px-2">
        <div class="flex flex-row items-center gap-2">
          <span class="flex flex-row items-center gap-2 flex-grow w-full">
            <Icon icon="lucide:link" class="w-4 h-4 text-muted-foreground" />
            <span class="text-sm font-medium">{{ t('settings.common.customProxyUrl') }}</span>
          </span>
          <div class="flex-shrink-0 min-w-64 max-w-96">
            <Input
              v-model="customProxyUrl"
              :placeholder="t('settings.common.customProxyUrlPlaceholder')"
              :class="{ 'border-red-500': showUrlError }"
              @input="validateProxyUrl"
              @blur="validateProxyUrl"
            />
          </div>
        </div>
        <div v-if="showUrlError" class="text-xs text-red-500 ml-6">
          {{ t('settings.common.invalidProxyUrl') }}
        </div>
      </div>
      <Dialog v-model:open="isDialogOpen">
        <DialogTrigger as-child>
          <div
            class="p-2 flex flex-row items-center gap-2 hover:bg-accent rounded-lg cursor-pointer"
          >
            <Icon icon="lucide:trash" class="w-4 h-4 text-muted-foreground" />
            <span class="text-sm font-medium">{{ t('settings.common.resetData') }}</span>
          </div>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{{ t('common.resetDataConfirmTitle') }}</DialogTitle>
            <DialogDescription>
              {{ t('common.resetDataConfirmDescription') }}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" @click="closeDialog">
              {{ t('dialog.cancel') }}
            </Button>
            <Button variant="destructive" @click="handleResetData">
              {{ t('dialog.confirm') }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </ScrollArea>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { ScrollArea } from '@/components/ui/scroll-area'
import { usePresenter } from '@/composables/usePresenter'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { ref, onMounted, watch, computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChevronDown } from 'lucide-vue-next'
import ModelSelect from '@/components/ModelSelect.vue'
import ModelIcon from '@/components/icons/ModelIcon.vue'
import { Input } from '@/components/ui/input'
import type { RENDERER_MODEL_META } from '@shared/presenter'

const devicePresenter = usePresenter('devicePresenter')
const configPresenter = usePresenter('configPresenter')
const settingsStore = useSettingsStore()
const { t } = useI18n()

const selectedLanguage = ref('system')
const selectedSearchEngine = ref(settingsStore.activeSearchEngine?.name ?? 'google')
const selectedSearchModel = computed(() => settingsStore.searchAssistantModel)

const selectedProxyMode = ref('system')
const customProxyUrl = ref('')
const showUrlError = ref(false)

let proxyUrlDebounceTimer: number | null = null

const languageOptions = [
  { value: 'system', label: '🌐 跟随系统' },
  { value: 'zh-CN', label: '🇨🇳 简体中文' },
  { value: 'en-US', label: '🇺🇸 English (US)' },
  { value: 'zh-HK', label: '🇭🇰 繁體中文' },
  { value: 'ko-KR', label: '🇰🇷 한국어' },
  { value: 'ru-RU', label: '🇷🇺 Русский' },
  { value: 'ja-JP', label: '🇯🇵 日本語' }
]

const proxyModes = [
  { value: 'system', label: t('settings.common.proxyModeSystem') },
  { value: 'none', label: t('settings.common.proxyModeNone') },
  { value: 'custom', label: t('settings.common.proxyModeCustom') }
]

const validateProxyUrl = () => {
  if (!customProxyUrl.value.trim()) {
    showUrlError.value = false
    return
  }

  const urlPattern =
    /^(http|https):\/\/([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(:[0-9]+)?(\/[^\s]*)?$/
  const isValid = urlPattern.test(customProxyUrl.value)

  showUrlError.value = !isValid

  if (isValid || !customProxyUrl.value.trim()) {
    configPresenter.setCustomProxyUrl(customProxyUrl.value)
  }
}

onMounted(async () => {
  selectedLanguage.value = settingsStore.language
  selectedSearchEngine.value = settingsStore.activeSearchEngine?.name ?? 'google'

  selectedProxyMode.value = await configPresenter.getProxyMode()
  customProxyUrl.value = await configPresenter.getCustomProxyUrl()
  if (selectedProxyMode.value === 'custom' && customProxyUrl.value) {
    validateProxyUrl()
  }
})

watch(selectedLanguage, async (newValue) => {
  await settingsStore.updateLanguage(newValue)
})

watch(selectedSearchEngine, async (newValue) => {
  await settingsStore.setSearchEngine(newValue)
})

watch(selectedProxyMode, (newValue) => {
  configPresenter.setProxyMode(newValue)
})

watch(customProxyUrl, () => {
  if (proxyUrlDebounceTimer !== null) {
    clearTimeout(proxyUrlDebounceTimer)
  }
  proxyUrlDebounceTimer = window.setTimeout(() => {
    validateProxyUrl()
  }, 300)
})

const isDialogOpen = ref(false)
const modelSelectOpen = ref(false)

const closeDialog = () => {
  isDialogOpen.value = false
}

const handleResetData = () => {
  devicePresenter.resetData()
  closeDialog()
}

const handleSearchModelSelect = (model: RENDERER_MODEL_META, providerId: string) => {
  settingsStore.setSearchAssistantModel(model, providerId)
  modelSelectOpen.value = false
}
</script>
