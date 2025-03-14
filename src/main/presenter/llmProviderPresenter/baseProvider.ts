import { LLM_PROVIDER, MODEL_META, LLMResponse, LLMResponseStream } from '@shared/presenter'
import { ConfigPresenter } from '../configPresenter'

// 定义ChatMessage接口用于统一消息格式
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content:
    | string
    | {
        type: 'text' | 'image_url'
        text?: string
        image_url?: {
          url: string
          detail?: 'auto' | 'low' | 'high'
        }
      }[]
}

export abstract class BaseLLMProvider {
  protected provider: LLM_PROVIDER
  protected models: MODEL_META[] = []
  protected customModels: MODEL_META[] = []
  protected isInitialized: boolean = false
  protected configPresenter: ConfigPresenter

  constructor(provider: LLM_PROVIDER, configPresenter: ConfigPresenter) {
    this.provider = provider
    this.configPresenter = configPresenter
  }

  protected async init() {
    if (this.provider.enable) {
      try {
        await this.fetchModels()
        // 检查是否需要自动启用所有模型
        await this.autoEnableModelsIfNeeded()
        this.isInitialized = true
        console.info('Provider initialized successfully:', this.provider.name)
      } catch (error) {
        console.warn('Provider initialization failed:', this.provider.name, error)
      }
    }
  }

  // 检查并自动启用模型
  protected async autoEnableModelsIfNeeded() {
    if (!this.models || this.models.length === 0) return

    const providerId = this.provider.id

    // 检查是否有自定义模型
    const customModels = this.configPresenter.getCustomModels(providerId)
    if (customModels && customModels.length > 0) return

    // 检查是否有任何模型的状态被手动修改过
    const hasManuallyModifiedModels = this.models.some((model) =>
      this.configPresenter.getModelStatus(providerId, model.id)
    )
    if (hasManuallyModifiedModels) return

    // 检查是否有任何已启用的模型
    const hasEnabledModels = this.models.some((model) =>
      this.configPresenter.getModelStatus(providerId, model.id)
    )

    // 如果没有任何已启用的模型，则自动启用所有模型
    // 这部分后续应该改为启用推荐模型
    if (!hasEnabledModels) {
      console.info(`Auto enabling all models for provider: ${this.provider.name}`)
      this.models.forEach((model) => {
        this.configPresenter.enableModel(providerId, model.id)
      })
    }
  }

  public async fetchModels(): Promise<MODEL_META[]> {
    try {
      const models = await this.fetchProviderModels()
      console.log('Fetched models:', models?.length)
      this.models = models
      return models
    } catch (e) {
      console.error('Failed to fetch models:', e)
      if (!this.models) {
        this.models = []
      }
      return []
    }
  }

  // 这个方法由具体子类实现，用于获取特定提供商的模型
  protected abstract fetchProviderModels(): Promise<MODEL_META[]>

  public getModels(): MODEL_META[] {
    return [...this.models, ...this.customModels]
  }

  public addCustomModel(model: Omit<MODEL_META, 'providerId' | 'isCustom' | 'group'>): MODEL_META {
    const newModel: MODEL_META = {
      ...model,
      providerId: this.provider.id,
      isCustom: true,
      group: 'default'
    }

    // 检查是否已存在相同ID的自定义模型
    const existingIndex = this.customModels.findIndex((m) => m.id === newModel.id)
    if (existingIndex !== -1) {
      this.customModels[existingIndex] = newModel
    } else {
      this.customModels.push(newModel)
    }

    return newModel
  }

  public removeCustomModel(modelId: string): boolean {
    const index = this.customModels.findIndex((model) => model.id === modelId)
    if (index !== -1) {
      this.customModels.splice(index, 1)
      return true
    }
    return false
  }

  public updateCustomModel(modelId: string, updates: Partial<MODEL_META>): boolean {
    const model = this.customModels.find((m) => m.id === modelId)
    if (model) {
      // 应用更新
      Object.assign(model, updates)
      return true
    }
    return false
  }

  public getCustomModels(): MODEL_META[] {
    return this.customModels
  }

  // 验证提供商API是否可用
  public abstract check(): Promise<{ isOk: boolean; errorMsg: string | null }>

  // 生成对话标题
  public abstract summaryTitles(messages: ChatMessage[], modelId: string): Promise<string>

  // 基础LLM调用函数
  abstract completions(
    messages: ChatMessage[],
    modelId: string,
    temperature?: number,
    maxTokens?: number
  ): Promise<LLMResponse>

  abstract summaries(
    text: string,
    modelId: string,
    temperature?: number,
    maxTokens?: number
  ): Promise<LLMResponse>

  abstract generateText(
    prompt: string,
    modelId: string,
    temperature?: number,
    maxTokens?: number
  ): Promise<LLMResponse>

  abstract suggestions(
    context: string,
    modelId: string,
    temperature?: number,
    maxTokens?: number
  ): Promise<string[]>

  // 流式接口
  abstract streamCompletions(
    messages: ChatMessage[],
    modelId: string,
    temperature?: number,
    maxTokens?: number
  ): AsyncGenerator<LLMResponseStream>

  abstract streamSummaries(
    text: string,
    modelId: string,
    temperature?: number,
    maxTokens?: number
  ): AsyncGenerator<LLMResponseStream>

  abstract streamGenerateText(
    prompt: string,
    modelId: string,
    temperature?: number,
    maxTokens?: number
  ): AsyncGenerator<LLMResponseStream>
}
