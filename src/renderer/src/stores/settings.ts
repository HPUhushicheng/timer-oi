import { defineStore } from 'pinia'
import { ref, onMounted, toRaw, computed } from 'vue'
import type { LLM_PROVIDER, RENDERER_MODEL_META } from '@shared/presenter'
import { usePresenter } from '@/composables/usePresenter'
import { useI18n } from 'vue-i18n'
import { SearchEngineTemplate } from '@shared/chat'
import { CONFIG_EVENTS, UPDATE_EVENTS, OLLAMA_EVENTS } from '@/events'
import type { OllamaModel } from '@shared/presenter'

export const useSettingsStore = defineStore('settings', () => {
  const configP = usePresenter('configPresenter')
  const llmP = usePresenter('llmproviderPresenter')
  const upgradeP = usePresenter('upgradePresenter')
  const threadP = usePresenter('threadPresenter')
  const { locale } = useI18n()
  const providers = ref<LLM_PROVIDER[]>([])
  const theme = ref<string>('system')
  const language = ref<string>('system')
  const enabledModels = ref<{ providerId: string; models: RENDERER_MODEL_META[] }[]>([])
  const allProviderModels = ref<{ providerId: string; models: RENDERER_MODEL_META[] }[]>([])
  const customModels = ref<{ providerId: string; models: RENDERER_MODEL_META[] }[]>([])
  const hasUpdate = ref(false)
  const updateInfo = ref<{
    version: string
    releaseDate: string
    releaseNotes: string
    githubUrl?: string
    downloadUrl?: string
  } | null>(null)
  const showUpdateDialog = ref(false)
  const isUpdating = ref(false)
  const isChecking = ref(false)
  const searchEngines = ref<SearchEngineTemplate[]>([])
  const activeSearchEngine = ref<SearchEngineTemplate | null>(null)

  // Ollama 相关状态
  const ollamaRunningModels = ref<OllamaModel[]>([])
  const ollamaLocalModels = ref<OllamaModel[]>([])
  const ollamaPullingModels = ref<Map<string, number>>(new Map()) // 模型名 -> 进度

  // 搜索助手模型相关
  const searchAssistantModelRef = ref<RENDERER_MODEL_META | null>(null)
  const searchAssistantProviderRef = ref<string>('')

  // 搜索助手模型计算属性
  const searchAssistantModel = computed(() => searchAssistantModelRef.value)

  // 模型匹配字符串数组，按优先级排序
  const searchAssistantModelPriorities = [
    'gpt-3.5',
    'Qwen2.5-32B',
    'Qwen2.5-14B',
    'Qwen2.5-7B',
    '14B',
    '7B',
    '32B',
    'deepseek-chat'
  ]
  const defaultProviders = ref<LLM_PROVIDER[]>([])
  // 查找符合优先级的模型
  const findPriorityModel = (): { model: RENDERER_MODEL_META; providerId: string } | null => {
    if (!enabledModels.value || enabledModels.value.length === 0) {
      return null
    }

    for (const priorityKey of searchAssistantModelPriorities) {
      for (const providerModels of enabledModels.value) {
        for (const model of providerModels.models) {
          if (
            model.id.toLowerCase().includes(priorityKey.toLowerCase()) ||
            model.name.toLowerCase().includes(priorityKey.toLowerCase())
          ) {
            return {
              model,
              providerId: providerModels.providerId
            }
          }
        }
      }
    }

    // 如果没有找到匹配优先级的模型，返回第一个可用的模型
    if (enabledModels.value[0]?.models.length > 0) {
      return {
        model: enabledModels.value[0].models[0],
        providerId: enabledModels.value[0].providerId
      }
    }

    return null
  }

  // 设置搜索助手模型
  const setSearchAssistantModel = async (model: RENDERER_MODEL_META, providerId: string) => {
    const _model = toRaw(model)
    searchAssistantModelRef.value = _model
    searchAssistantProviderRef.value = providerId

    await configP.setSetting('searchAssistantModel', {
      model: _model,
      providerId
    })

    // 通知更新搜索助手模型
    threadP.setSearchAssistantModel(_model, providerId)
  }

  // 初始化或更新搜索助手模型
  const initOrUpdateSearchAssistantModel = async () => {
    // 尝试从配置中加载搜索助手模型
    let savedModel = await configP.getSetting<{ model: RENDERER_MODEL_META; providerId: string }>(
      'searchAssistantModel'
    )
    savedModel = toRaw(savedModel)
    if (savedModel) {
      // 检查保存的模型是否仍然可用
      const provider = enabledModels.value.find((p) => p.providerId === savedModel.providerId)
      const modelExists = provider?.models.some((m) => m.id === savedModel.model.id)

      if (modelExists) {
        searchAssistantModelRef.value = savedModel.model
        searchAssistantProviderRef.value = savedModel.providerId
        // 通知线程处理器更新搜索助手模型
        threadP.setSearchAssistantModel(savedModel.model, savedModel.providerId)
        return
      }
    }

    // 如果没有保存的模型或模型不再可用，查找符合优先级的模型
    let priorityModel = findPriorityModel()
    priorityModel = toRaw(priorityModel)
    if (priorityModel) {
      searchAssistantModelRef.value = priorityModel.model
      searchAssistantProviderRef.value = priorityModel.providerId

      await configP.setSetting('searchAssistantModel', {
        model: {
          id: priorityModel.model.id,
          name: priorityModel.model.name,
          contextLength: priorityModel.model.contextLength,
          maxTokens: priorityModel.model.maxTokens,
          providerId: priorityModel.providerId,
          group: priorityModel.model.group,
          enabled: true,
          isCustom: priorityModel.model.isCustom
        },
        providerId: priorityModel.providerId
      })

      // 通知线程处理器更新搜索助手模型
      threadP.setSearchAssistantModel(
        {
          id: priorityModel.model.id,
          name: priorityModel.model.name,
          contextLength: priorityModel.model.contextLength,
          maxTokens: priorityModel.model.maxTokens,
          providerId: priorityModel.providerId,
          group: priorityModel.model.group,
          isCustom: priorityModel.model.isCustom
        },
        toRaw(priorityModel.providerId)
      )
    }
  }

  // 初始化设置
  const initSettings = async () => {
    // 获取全部 provider
    providers.value = await configP.getProviders()
    defaultProviders.value = await configP.getDefaultProviders()
    // 获取主题
    theme.value = (await configP.getSetting('theme')) || 'system'

    // 获取语言
    language.value = (await configP.getSetting('language')) || 'system'
    // 设置语言
    locale.value = await configP.getLanguage()

    // 获取全部模型
    await refreshAllModels()

    // 初始化搜索助手模型
    await initOrUpdateSearchAssistantModel()

    // 设置 Ollama 事件监听器
    setupOllamaEventListeners()

    // 单独刷新一次 Ollama 模型，确保即使没有启用 Ollama provider 也能获取模型列表
    if (providers.value.some((p) => p.id === 'ollama')) {
      await refreshOllamaModels()
    }

    // 获取搜索引擎
    searchEngines.value = await threadP.getSearchEngines()
    const savedEngineName = await configP.getSetting<string>('searchEngine')
    const savedEngine = searchEngines.value.find((e) => e.name === savedEngineName)
    if (savedEngine) {
      activeSearchEngine.value = savedEngine
      threadP.setActiveSearchEngine(savedEngine.name)
    } else {
      activeSearchEngine.value = searchEngines.value[0]
      threadP.setActiveSearchEngine(searchEngines.value[0].name)
    }

    // 设置事件监听
    setupProviderListener()
    setupUpdateListener()
  }

  // 刷新所有模型列表
  const refreshAllModels = async () => {
    const activeProviders = providers.value.filter((p) => p.enable)
    allProviderModels.value = []
    enabledModels.value = []
    customModels.value = []

    // 刷新 Ollama 模型
    if (activeProviders.some((p) => p.id === 'ollama')) {
      await refreshOllamaModels()
    }

    for (const provider of activeProviders) {
      // 如果是 Ollama 提供者，已经在 refreshOllamaModels 中处理过了
      if (provider.id === 'ollama') continue

      try {
        // 获取在线模型
        let models = await configP.getProviderModels(provider.id)
        if (!models || models.length === 0) {
          const modelMetas = await llmP.getModelList(provider.id)
          if (modelMetas) {
            models = modelMetas.map((meta) => ({
              id: meta.id,
              name: meta.name,
              contextLength: meta.contextLength || 4096,
              maxTokens: meta.maxTokens || 2048,
              provider: provider.id,
              group: meta.group,
              enabled: false,
              isCustom: meta.isCustom,
              providerId: provider.id
            }))
          }
        }

        // 获取模型状态并合并
        const modelsWithStatus = await Promise.all(
          models.map(async (model) => {
            // 获取模型状态
            const enabled = await configP.getModelStatus(provider.id, model.id)
            return {
              ...model,
              enabled
            }
          })
        )

        // 获取自定义模型
        const customModelsList = await llmP.getCustomModels(provider.id)
        // 获取自定义模型状态并合并
        const customModelsWithStatus = await Promise.all(
          customModelsList.map(async (model) => {
            // 获取模型状态
            const enabled = await configP.getModelStatus(provider.id, model.id)

            return {
              ...model,
              enabled,
              isCustom: true
            } as RENDERER_MODEL_META
          })
        )

        const existingIndex = customModels.value.findIndex(
          (item) => item.providerId === provider.id
        )
        if (existingIndex !== -1) {
          customModels.value[existingIndex].models = customModelsWithStatus
        } else {
          customModels.value.push({
            providerId: provider.id,
            models: customModelsWithStatus
          })
        }

        // 合并在线和自定义模型
        const allModels = [
          ...modelsWithStatus,
          ...customModelsWithStatus.map((model) => ({
            ...model,
            isCustom: true
          }))
        ]
        const findAllProviderModelIndex = allProviderModels.value.findIndex(
          (item) => item.providerId === provider.id
        )
        if (findAllProviderModelIndex !== -1) {
          allProviderModels.value[findAllProviderModelIndex].models = allModels
        } else {
          allProviderModels.value.push({
            providerId: provider.id,
            models: allModels
          })
        }

        const existingEnabledIndex = enabledModels.value.findIndex(
          (item) => item.providerId === provider.id
        )
        const enabledModelsData = {
          providerId: provider.id,
          models: allModels.filter((model) => model.enabled !== false)
        }
        if (provider.id === 'ollama') {
          // ollama 管理由 ollama 接管
          enabledModelsData.models = allModels
        }
        if (existingEnabledIndex !== -1) {
          enabledModels.value[existingEnabledIndex].models = enabledModelsData.models
        } else {
          enabledModels.value.push(enabledModelsData)
        }
      } catch (error) {
        console.error(`Failed to fetch models for provider ${provider.id}:`, error)
      }
    }

    // 刷新模型列表后，检查并更新搜索助手模型
    if (searchAssistantModelRef.value) {
      const provider = enabledModels.value.find(
        (p) => p.providerId === searchAssistantProviderRef.value
      )
      const modelExists = provider?.models.some((m) => m.id === searchAssistantModelRef.value?.id)

      if (!modelExists) {
        // 如果当前搜索助手模型不再可用，重新选择
        await initOrUpdateSearchAssistantModel()
      }
    } else {
      // 如果还没有设置搜索助手模型，设置一个
      await initOrUpdateSearchAssistantModel()
    }
  }

  // 搜索模型
  const searchModels = (query: string) => {
    const filteredModels = enabledModels.value
      .map((group) => {
        const filteredGroupModels = group.models.filter((model) => model.id.includes(query))
        return {
          providerId: group.providerId,
          models: filteredGroupModels
        }
      })
      .filter((group) => group.models.length > 0) // 只保留有模型的组

    enabledModels.value = filteredModels
  }

  // 更新 provider
  const updateProvider = async (id: string, provider: LLM_PROVIDER) => {
    await configP.setProviderById(id, provider)
    providers.value = await configP.getProviders()
    // 如果 provider 的启用状态发生变化，刷新模型列表
    if (provider.enable !== providers.value.find((p) => p.id === id)?.enable) {
      await refreshAllModels()
    }
  }

  // 更新主题
  const updateTheme = async (newTheme: string) => {
    await configP.setSetting('theme', newTheme)
    theme.value = newTheme
  }

  // 更新语言
  const updateLanguage = async (newLanguage: string) => {
    await configP.setSetting('language', newLanguage)
    language.value = newLanguage

    // 更新当前语言
    locale.value = await configP.getLanguage()
  }

  // 监听 provider 设置变化
  const setupProviderListener = () => {
    // 监听配置变更事件
    window.electron.ipcRenderer.on(CONFIG_EVENTS.PROVIDER_CHANGED, async () => {
      providers.value = await configP.getProviders()
      await refreshAllModels()
    })
    // 监听模型列表更新事件
    window.electron.ipcRenderer.on(
      CONFIG_EVENTS.MODEL_LIST_CHANGED,
      async (_event, providerId: string) => {
        // 只刷新指定的provider模型，而不是所有模型
        if (providerId) {
          await refreshProviderModels(providerId)
        } else {
          // 兼容旧代码，如果没有提供providerId，则刷新所有模型
          await refreshAllModels()
        }
      }
    )
    // 监听配置中的模型列表变更事件
    window.electron.ipcRenderer.on(
      CONFIG_EVENTS.MODEL_LIST_CHANGED,
      async (_event, providerId: string) => {
        // 只刷新指定的provider模型，而不是所有模型
        if (providerId) {
          await refreshProviderModels(providerId)
        } else {
          // 兼容旧代码，如果没有提供providerId，则刷新所有模型
          await refreshAllModels()
        }
      }
    )

    // 处理模型启用状态变更事件
    window.electron.ipcRenderer.on(
      CONFIG_EVENTS.MODEL_STATUS_CHANGED,
      async (_event, msg: { providerId: string; modelId: string; enabled: boolean }) => {
        // 只更新模型启用状态，而不是刷新所有模型
        updateLocalModelStatus(msg.providerId, msg.modelId, msg.enabled)
      }
    )
  }

  // 更新本地模型状态，不触发后端请求
  const updateLocalModelStatus = (providerId: string, modelId: string, enabled: boolean) => {
    // 更新allProviderModels中的模型状态
    const providerIndex = allProviderModels.value.findIndex((p) => p.providerId === providerId)
    if (providerIndex !== -1) {
      const models = allProviderModels.value[providerIndex].models
      const modelIndex = models.findIndex((m) => m.id === modelId)
      if (modelIndex !== -1) {
        models[modelIndex].enabled = enabled
      }
    }

    // 更新enabledModels中的模型状态
    const enabledProviderIndex = enabledModels.value.findIndex((p) => p.providerId === providerId)
    if (enabledProviderIndex !== -1) {
      const models = enabledModels.value[enabledProviderIndex].models
      if (enabled) {
        // 如果启用，确保模型在列表中
        const modelIndex = models.findIndex((m) => m.id === modelId)
        if (modelIndex === -1) {
          // 模型不在启用列表中，从allProviderModels查找并添加
          const provider = allProviderModels.value.find((p) => p.providerId === providerId)
          const model = provider?.models.find((m) => m.id === modelId)
          if (model) {
            models.push({ ...model, enabled: true })
          }
        }
      } else {
        // 如果禁用，从列表中移除
        const modelIndex = models.findIndex((m) => m.id === modelId)
        if (modelIndex !== -1) {
          models.splice(modelIndex, 1)
        }
      }
    }

    // 更新customModels中的模型状态
    const customProviderIndex = customModels.value.findIndex((p) => p.providerId === providerId)
    if (customProviderIndex !== -1) {
      const models = customModels.value[customProviderIndex].models
      const modelIndex = models.findIndex((m) => m.id === modelId)
      if (modelIndex !== -1) {
        models[modelIndex].enabled = enabled
      }
    }
  }

  // 更新模型状态
  const updateModelStatus = async (providerId: string, modelId: string, enabled: boolean) => {
    try {
      await llmP.updateModelStatus(providerId, modelId, enabled)
      // 注意：这里不再调用refreshAllModels，因为会通过model-status-changed事件更新本地状态
    } catch (error) {
      console.error('Failed to update model status:', error)
    }
  }

  const checkProvider = async (providerId: string) => {
    return await llmP.check(providerId)
  }

  // 添加自定义模型
  const addCustomModel = async (
    providerId: string,
    model: Omit<RENDERER_MODEL_META, 'providerId' | 'isCustom' | 'group'>
  ) => {
    try {
      const newModel = await llmP.addCustomModel(providerId, model)
      await configP.addCustomModel(providerId, newModel)
      await refreshAllModels()
      return newModel
    } catch (error) {
      console.error('Failed to add custom model:', error)
      throw error
    }
  }

  // 删除自定义模型
  const removeCustomModel = async (providerId: string, modelId: string) => {
    try {
      const success = await llmP.removeCustomModel(providerId, modelId)
      if (success) {
        await refreshAllModels()
      }
      return success
    } catch (error) {
      console.error('Failed to remove custom model:', error)
      throw error
    }
  }

  // 更新自定义模型
  const updateCustomModel = async (
    providerId: string,
    modelId: string,
    updates: Partial<RENDERER_MODEL_META> & { enabled?: boolean }
  ) => {
    try {
      // 不包含启用状态的常规更新
      const success = await llmP.updateCustomModel(providerId, modelId, updates)
      if (success) {
        await refreshAllModels()
      }
      return success
    } catch (error) {
      console.error('Failed to update custom model:', error)
      throw error
    }
  }

  // 检查更新
  const checkUpdate = async () => {
    if (isChecking.value) return
    isChecking.value = true
    try {
      await upgradeP.checkUpdate()
      const status = upgradeP.getUpdateStatus()
      hasUpdate.value = status.status === 'available' || status.status === 'downloaded'
      if (hasUpdate.value && status.updateInfo) {
        updateInfo.value = {
          version: status.updateInfo.version,
          releaseDate: status.updateInfo.releaseDate,
          releaseNotes: status.updateInfo.releaseNotes,
          githubUrl: status.updateInfo.githubUrl,
          downloadUrl: status.updateInfo.downloadUrl
        }
      }
    } catch (error) {
      console.error('Failed to check update:', error)
    } finally {
      isChecking.value = false
    }
  }

  // 开始下载更新
  const startUpdate = async (type: 'github' | 'netdisk') => {
    try {
      return await upgradeP.goDownloadUpgrade(type)
    } catch (error) {
      console.error('Failed to start update:', error)
      return false
    }
  }

  // 监听更新状态
  const setupUpdateListener = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.electron.ipcRenderer.on(UPDATE_EVENTS.STATUS_CHANGED, (_, event: any) => {
      const { status, info, error } = event
      hasUpdate.value = status === 'available'
      console.log(UPDATE_EVENTS.STATUS_CHANGED, status, info, error)
      // 根据不同状态更新UI
      switch (status) {
        case 'available':
          if (info) {
            updateInfo.value = {
              version: info.version,
              releaseDate: info.releaseDate,
              releaseNotes: info.releaseNotes,
              githubUrl: info.githubUrl,
              downloadUrl: info.downloadUrl
            }
          }
          break
        case 'not-available':
          updateInfo.value = null
          break
        case 'error':
          updateInfo.value = null
          console.error('Update error:', error)
          break
      }
    })

    // 监听更新错误
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.electron.ipcRenderer.on(UPDATE_EVENTS.ERROR, (_, errorData: any) => {
      console.error(UPDATE_EVENTS.ERROR, errorData.error)
      hasUpdate.value = false
      updateInfo.value = null
    })
  }

  // 原子化的配置更新方法
  const updateProviderConfig = async (
    providerId: string,
    updates: Partial<LLM_PROVIDER>
  ): Promise<void> => {
    const currentProvider = providers.value.find((p) => p.id === providerId)
    if (!currentProvider) {
      throw new Error(`Provider ${providerId} not found`)
    }

    const updatedProvider = {
      ...currentProvider,
      ...updates
    }

    await configP.setProviderById(providerId, updatedProvider)

    // 只在特定字段变化时刷新providers
    const needRefreshProviders = ['name', 'enable'].some((key) => key in updates)
    if (needRefreshProviders) {
      providers.value = await configP.getProviders()
    } else {
      // 只更新当前provider
      const index = providers.value.findIndex((p) => p.id === providerId)
      if (index !== -1) {
        providers.value[index] = updatedProvider
      }
    }

    // 只在特定条件下刷新模型列表
    const needRefreshModels = ['enable', 'apiKey', 'baseUrl'].some((key) => key in updates)
    if (needRefreshModels && updatedProvider.enable) {
      await refreshAllModels()
    }
  }

  // 更新provider的API配置
  const updateProviderApi = async (
    providerId: string,
    apiKey?: string,
    baseUrl?: string
  ): Promise<void> => {
    const updates: Partial<LLM_PROVIDER> = {}
    if (apiKey !== undefined) updates.apiKey = apiKey
    if (baseUrl !== undefined) updates.baseUrl = baseUrl
    await updateProviderConfig(providerId, updates)
  }

  // 更新provider的启用状态
  const updateProviderStatus = async (providerId: string, enable: boolean): Promise<void> => {
    await updateProviderConfig(providerId, { enable })
  }

  // 优化刷新模型列表的逻辑
  const refreshProviderModels = async (providerId: string): Promise<void> => {
    const provider = providers.value.find((p) => p.id === providerId)
    if (!provider || !provider.enable) return

    try {
      // 获取在线模型
      let models = await configP.getProviderModels(providerId)
      if (!models || models.length === 0) {
        const modelMetas = await llmP.getModelList(providerId)
        if (modelMetas) {
          models = modelMetas.map((meta) => ({
            id: meta.id,
            name: meta.name,
            contextLength: meta.contextLength || 4096,
            maxTokens: meta.maxTokens || 2048,
            provider: providerId,
            group: meta.group,
            isCustom: meta.isCustom || false,
            providerId
          }))
        }
      }

      // 获取模型状态并合并
      const modelsWithStatus = await Promise.all(
        models.map(async (model) => {
          // 获取模型状态
          const enabled = await configP.getModelStatus(providerId, model.id)

          return {
            ...model,
            enabled,
            providerId,
            isCustom: model.isCustom || false
          }
        })
      )

      // 更新模型列表
      const existingIndex = allProviderModels.value.findIndex(
        (item) => item.providerId === providerId
      )
      if (existingIndex !== -1) {
        allProviderModels.value[existingIndex].models = modelsWithStatus
      } else {
        allProviderModels.value.push({
          providerId,
          models: modelsWithStatus
        })
      }

      // 更新已启用的模型列表
      const enabledIndex = enabledModels.value.findIndex((item) => item.providerId === providerId)
      if (enabledIndex !== -1) {
        enabledModels.value[enabledIndex].models = modelsWithStatus.filter(
          (model) => model.enabled !== false
        )
      } else {
        enabledModels.value.push({
          providerId,
          models: modelsWithStatus.filter((model) => model.enabled !== false)
        })
      }

      // 同时更新自定义模型
      const customModelsList = await llmP.getCustomModels(providerId)
      if (customModelsList && customModelsList.length > 0) {
        // 获取自定义模型状态并合并
        const customModelsWithStatus = await Promise.all(
          customModelsList.map(async (model) => {
            // 获取模型状态
            const enabled = await configP.getModelStatus(providerId, model.id)

            return {
              ...model,
              enabled,
              providerId,
              isCustom: true
            }
          })
        )

        const customIndex = customModels.value.findIndex((item) => item.providerId === providerId)
        if (customIndex !== -1) {
          customModels.value[customIndex].models = customModelsWithStatus
        } else {
          customModels.value.push({
            providerId,
            models: customModelsWithStatus
          })
        }
      }
    } catch (error) {
      console.error(`Failed to fetch models for provider ${providerId}:`, error)
    }
  }
  const setSearchEngine = async (engineName: string) => {
    const engine = searchEngines.value.find((e) => e.name === engineName)
    if (engine) {
      activeSearchEngine.value = engine
      await configP.setSetting('searchEngine', engineName)
      threadP.setActiveSearchEngine(engineName)
    }
  }

  // 添加自定义Provider
  const addCustomProvider = async (provider: LLM_PROVIDER): Promise<void> => {
    try {
      const currentProviders = await configP.getProviders()
      const newProivider = {
        ...toRaw(provider),
        custom: true
      }
      const newProviders = [...currentProviders, newProivider]
      await configP.setProviders(newProviders)
      providers.value = newProviders

      // 如果新provider启用了，刷新模型列表
      if (provider.enable) {
        await refreshAllModels()
      }
      providers.value = await configP.getProviders()
    } catch (error) {
      console.error('Failed to add custom provider:', error)
      throw error
    }
  }

  // 删除Provider
  const removeProvider = async (providerId: string): Promise<void> => {
    try {
      const currentProviders = await configP.getProviders()
      const filteredProviders = currentProviders.filter((p) => p.id !== providerId)
      await configP.setProviders(filteredProviders)
      providers.value = filteredProviders
      await refreshAllModels()
    } catch (error) {
      console.error('Failed to remove provider:', error)
      throw error
    }
  }
  const enableAllModels = async (providerId: string): Promise<void> => {
    try {
      // 获取提供商的所有模型
      const providerModelsData = allProviderModels.value.find((p) => p.providerId === providerId)
      if (!providerModelsData || providerModelsData.models.length === 0) {
        console.warn(`No models found for provider ${providerId}`)
        return
      }

      // 对每个模型执行启用操作
      for (const model of providerModelsData.models) {
        if (!model.enabled) {
          await llmP.updateModelStatus(providerId, model.id, true)
          // 注意：不需要调用refreshAllModels，因为model-status-changed事件会更新UI
        }
      }
    } catch (error) {
      console.error(`Failed to enable all models for provider ${providerId}:`, error)
      throw error
    }
  }
  // 禁用指定提供商下的所有模型
  const disableAllModels = async (providerId: string): Promise<void> => {
    try {
      // 获取提供商的所有模型
      const providerModelsData = allProviderModels.value.find((p) => p.providerId === providerId)
      if (!providerModelsData || providerModelsData.models.length === 0) {
        console.warn(`No models found for provider ${providerId}`)
        return
      }

      // 获取自定义模型
      const customModelsData = customModels.value.find((p) => p.providerId === providerId)

      // 对每个模型执行禁用操作
      const standardModels = providerModelsData.models
      for (const model of standardModels) {
        if (model.enabled) {
          await llmP.updateModelStatus(providerId, model.id, false)
          // 注意：不需要调用refreshAllModels，因为model-status-changed事件会更新UI
        }
      }

      // 处理自定义模型
      if (customModelsData) {
        for (const model of customModelsData.models) {
          if (model.enabled) {
            await llmP.updateModelStatus(providerId, model.id, false)
            // 注意：不需要调用refreshAllModels，因为model-status-changed事件会更新UI
          }
        }
      }
    } catch (error) {
      console.error(`Failed to disable all models for provider ${providerId}:`, error)
      throw error
    }
  }

  const cleanAllMessages = async (conversationId: string) => {
    await threadP.clearAllMessages(conversationId)
  }

  // 打开更新弹窗
  const openUpdateDialog = () => {
    showUpdateDialog.value = true
  }

  // 关闭更新弹窗
  const closeUpdateDialog = () => {
    showUpdateDialog.value = false
  }

  // 处理更新操作
  const handleUpdate = async (type: 'github' | 'netdisk') => {
    isUpdating.value = true
    try {
      const success = await startUpdate(type)
      if (success) {
        closeUpdateDialog()
      }
    } catch (error) {
      console.error('Update failed:', error)
    } finally {
      isUpdating.value = false
    }
  }

  // Ollama 模型管理方法
  /**
   * 刷新 Ollama 模型列表
   */
  const refreshOllamaModels = async (): Promise<void> => {
    try {
      ollamaRunningModels.value = await llmP.listOllamaRunningModels()
      ollamaLocalModels.value = await llmP.listOllamaModels()

      // 更新到全局模型列表中
      await syncOllamaModelsToGlobal()
    } catch (error) {
      console.error('Failed to refresh Ollama models:', error)
    }
  }

  /**
   * 同步 Ollama 模型到全局模型列表
   */
  const syncOllamaModelsToGlobal = async (): Promise<void> => {
    // 找到 Ollama provider
    const ollamaProvider = providers.value.find((p) => p.id === 'ollama')
    if (!ollamaProvider) return

    // 获取现有的 Ollama 模型，以保留自定义设置
    const existingOllamaModels =
      allProviderModels.value.find((item) => item.providerId === 'ollama')?.models || []

    // 将 Ollama 本地模型转换为全局模型格式
    const ollamaModelsAsGlobal = ollamaLocalModels.value.map((model) => {
      // 检查是否已存在相同ID的模型，如果存在，保留其现有的配置
      const existingModel = existingOllamaModels.find((m) => m.id === model.name)

      return {
        id: model.name,
        name: model.name,
        contextLength: existingModel?.contextLength || 4096, // 使用现有值或默认值
        maxTokens: existingModel?.maxTokens || 2048, // 使用现有值或默认值
        provider: 'ollama',
        group: existingModel?.group || 'local',
        enabled: true,
        isCustom: existingModel?.isCustom || false,
        providerId: 'ollama',
        // 保留现有的其他配置，但确保更新 Ollama 特有数据
        ...(existingModel ? { ...existingModel } : {}),
        ollamaModel: model
      } as RENDERER_MODEL_META & { ollamaModel: OllamaModel }
    })

    // 更新全局模型列表
    const existingIndex = allProviderModels.value.findIndex((item) => item.providerId === 'ollama')

    if (existingIndex !== -1) {
      // 只替换 Ollama 的模型，保留全局数据中的其他字段
      allProviderModels.value[existingIndex].models = ollamaModelsAsGlobal
    } else {
      allProviderModels.value.push({
        providerId: 'ollama',
        models: ollamaModelsAsGlobal
      })
    }

    // 更新已启用的模型列表
    const enabledIndex = enabledModels.value.findIndex((item) => item.providerId === 'ollama')
    const enabledOllamaModels = ollamaModelsAsGlobal.filter((model) => model.enabled)

    if (enabledIndex !== -1) {
      enabledModels.value[enabledIndex].models = enabledOllamaModels
    } else if (enabledOllamaModels.length > 0) {
      enabledModels.value.push({
        providerId: 'ollama',
        models: enabledOllamaModels
      })
    }

    // 触发搜索助手模型更新，确保如果有 Ollama 模型符合条件也能被用作搜索助手
    await initOrUpdateSearchAssistantModel()
  }

  /**
   * 拉取 Ollama 模型
   */
  const pullOllamaModel = async (modelName: string): Promise<boolean> => {
    try {
      // 初始化进度为0
      ollamaPullingModels.value.set(modelName, 0)

      // 开始拉取
      const success = await llmP.pullOllamaModels(modelName)

      if (!success) {
        // 如果拉取失败，删除进度记录
        ollamaPullingModels.value.delete(modelName)
      }

      return success
    } catch (error) {
      console.error(`Failed to pull Ollama model ${modelName}:`, error)
      ollamaPullingModels.value.delete(modelName)
      return false
    }
  }

  /**
   * 删除 Ollama 模型
   */
  const deleteOllamaModel = async (modelName: string): Promise<boolean> => {
    try {
      const success = await llmP.deleteOllamaModel(modelName)
      if (success) {
        await refreshOllamaModels()
      }
      return success
    } catch (error) {
      console.error(`Failed to delete Ollama model ${modelName}:`, error)
      return false
    }
  }

  /**
   * 处理 Ollama 模型拉取事件
   */
  const handleOllamaModelPullEvent = (event: Record<string, unknown>) => {
    if (event?.eventId !== 'pullOllamaModels' || !event?.modelName) return

    const modelName = event.modelName as string
    const status = event.status as string
    const total = event.total as number
    const completed = event.completed as number

    // 如果有 completed 和 total，计算进度
    if (typeof completed === 'number' && typeof total === 'number' && total > 0) {
      const progress = Math.min(Math.round((completed / total) * 100), 100)
      ollamaPullingModels.value.set(modelName, progress)
    }
    // 如果只有 status 是 pulling manifest 或没有 total，设置为初始状态
    else if (status && status.includes('manifest')) {
      ollamaPullingModels.value.set(modelName, 1) // 设置为1%表示开始
    }

    // 如果拉取完成
    if (status === 'success' || status === 'completed') {
      setTimeout(() => {
        ollamaPullingModels.value.delete(modelName)
        refreshOllamaModels()
      }, 1000)
    }
  }

  /**
   * 设置 Ollama 拉取事件监听器
   */
  const setupOllamaEventListeners = () => {
    window.electron?.ipcRenderer?.on(
      OLLAMA_EVENTS.PULL_MODEL_PROGRESS,
      (_event: unknown, data: Record<string, unknown>) => {
        handleOllamaModelPullEvent(data)
      }
    )
  }

  /**
   * 移除 Ollama 事件监听器
   */
  const removeOllamaEventListeners = () => {
    window.electron?.ipcRenderer?.removeAllListeners(OLLAMA_EVENTS.PULL_MODEL_PROGRESS)
  }

  /**
   * 判断模型是否正在运行
   */
  const isOllamaModelRunning = (modelName: string): boolean => {
    return ollamaRunningModels.value.some((m) => m.name === modelName)
  }

  /**
   * 判断模型是否已存在于本地
   */
  const isOllamaModelLocal = (modelName: string): boolean => {
    return ollamaLocalModels.value.some((m) => m.name === modelName)
  }

  /**
   * 获取正在拉取的 Ollama 模型列表
   */
  const getOllamaPullingModels = () => {
    return ollamaPullingModels.value
  }

  // 在 store 创建时初始化
  onMounted(() => {
    initSettings()
    setupProviderListener()
    setupUpdateListener()
  })

  // 清理可能的事件监听器
  const cleanup = () => {
    removeOllamaEventListeners()
  }

  return {
    providers,
    theme,
    language,
    enabledModels,
    allProviderModels,
    customModels,
    updateProvider,
    updateTheme,
    updateLanguage,
    initSettings,
    searchModels,
    refreshAllModels,
    updateModelStatus,
    checkProvider,
    addCustomModel,
    removeCustomModel,
    updateCustomModel,
    hasUpdate,
    updateInfo,
    isChecking,
    checkUpdate,
    startUpdate,
    updateProviderConfig,
    updateProviderApi,
    updateProviderStatus,
    refreshProviderModels,
    setSearchEngine,
    searchEngines,
    activeSearchEngine,
    addCustomProvider,
    removeProvider,
    disableAllModels,
    enableAllModels,
    searchAssistantModel,
    setSearchAssistantModel,
    initOrUpdateSearchAssistantModel,
    cleanAllMessages,
    showUpdateDialog,
    openUpdateDialog,
    closeUpdateDialog,
    handleUpdate,
    defaultProviders,
    ollamaRunningModels,
    ollamaLocalModels,
    ollamaPullingModels,
    refreshOllamaModels,
    pullOllamaModel,
    deleteOllamaModel,
    isOllamaModelRunning,
    isOllamaModelLocal,
    getOllamaPullingModels,
    removeOllamaEventListeners,
    cleanup
  }
})
