import { ModelConfig } from '@shared/presenter'
import { defaultModelsSettings } from '../configPresenter/models'

export interface ProviderModelConfigs {
  [modelId: string]: ModelConfig
}

/**
 * 获取指定provider和model的推荐配置
 * @param modelId 模型ID
 * @returns ModelConfig | undefined 如果找到配置则返回，否则返回undefined
 */
export function getModelConfig(modelId: string): ModelConfig | undefined {
  // Gemini 系列模型
  if (modelId.includes('gemini-2.0-flash')) {
    return {
      maxTokens: 8192,
      contextLength: 1048576,
      temperature: 0.7,
      vision: true
    }
  }

  if (modelId.includes('gemini-1.5-flash')) {
    return {
      maxTokens: 8192,
      contextLength: 1048576,
      temperature: 0.7,
      vision: true
    }
  }

  if (modelId.includes('gemini-1.5-pro')) {
    return {
      maxTokens: 8192,
      contextLength: 2097152,
      temperature: 0.7,
      vision: true
    }
  }

  // DeepSeek系列模型配置
  if (modelId.toLowerCase().includes('deepseek-r1-distill-qwen-32b')) {
    return {
      maxTokens: 16384,
      contextLength: 32768,
      temperature: 0.7,
      vision: false
    }
  }

  if (modelId.toLowerCase().includes('deepseek-r1-distill-qwen-14b')) {
    return {
      maxTokens: 16384,
      contextLength: 32768,
      temperature: 0.7,
      vision: false
    }
  }

  if (modelId.toLowerCase().includes('deepseek-r1-distill-qwen-7b')) {
    return {
      maxTokens: 8192,
      contextLength: 32768,
      temperature: 0.7,
      vision: false
    }
  }

  if (
    modelId.toLowerCase().includes('deepseek-r1-distill-qwen-1.5b') ||
    modelId.toLowerCase().includes('deepseek-r1-distill-qwen-1-5b')
  ) {
    return {
      maxTokens: 32768,
      contextLength: 131072,
      temperature: 0.6,
      vision: false
    }
  }

  if (modelId.toLowerCase().includes('deepseek-r1-distill-llama-8b')) {
    return {
      maxTokens: 32768,
      contextLength: 131072,
      temperature: 0.6,
      vision: false
    }
  }

  if (modelId.toLowerCase().includes('deepseek-r1-distill-llama-70b')) {
    return {
      maxTokens: 32768,
      contextLength: 65536,
      temperature: 0.6,
      vision: false
    }
  }

  if (
    modelId.toLowerCase().includes('deepseek-r1') ||
    modelId.toLowerCase().includes('deepseek-r1-zero')
  ) {
    return {
      maxTokens: 32768,
      contextLength: 65536,
      temperature: 0.6,
      vision: false
    }
  }

  // Claude系列模型配置
  if (
    modelId.toLowerCase().includes('claude-3-7-sonnet') ||
    modelId.toLowerCase().includes('claude-3.7-sonnet')
  ) {
    return {
      maxTokens: 64000, // 支持extended thinking
      contextLength: 200000,
      temperature: 0.7,
      vision: true
    }
  }

  if (
    modelId.toLowerCase().includes('claude-3-5-sonnet') ||
    modelId.toLowerCase().includes('claude-3.5-sonnet')
  ) {
    return {
      maxTokens: 8192,
      contextLength: 200000,
      temperature: 0.7,
      vision: true
    }
  }

  if (
    modelId.toLowerCase().includes('claude-3-opus') ||
    modelId.toLowerCase().includes('claude-3.opus')
  ) {
    return {
      maxTokens: 4096,
      contextLength: 200000,
      temperature: 0.7,
      vision: true
    }
  }

  if (
    modelId.toLowerCase().includes('claude-3-haiku') ||
    modelId.toLowerCase().includes('claude-3.haiku') ||
    modelId.toLowerCase().includes('claude-3-5-haiku') ||
    modelId.toLowerCase().includes('claude-3.5-haiku')
  ) {
    return {
      maxTokens: 4096,
      contextLength: 200000,
      temperature: 0.7,
      vision: true
    }
  }

  // OpenAI GPT系列模型配置
  if (modelId.toLowerCase().includes('gpt-4o')) {
    return {
      maxTokens: 4096,
      contextLength: 128000,
      temperature: 0.7,
      vision: true
    }
  }

  if (
    modelId.toLowerCase().includes('gpt-4-turbo') ||
    modelId.toLowerCase().includes('gpt-4-1106')
  ) {
    return {
      maxTokens: 4096,
      contextLength: 128000,
      temperature: 0.7,
      vision: true
    }
  }

  if (modelId.toLowerCase().includes('gpt-4-32k')) {
    return {
      maxTokens: 4096,
      contextLength: 32768,
      temperature: 0.7,
      vision: false
    }
  }

  if (modelId.toLowerCase().includes('gpt-4-0') && !modelId.toLowerCase().includes('gpt-4o')) {
    return {
      maxTokens: 4096,
      contextLength: 8192,
      temperature: 0.7,
      vision: false
    }
  }

  if (modelId.toLowerCase().includes('gpt-3.5-turbo-16k')) {
    return {
      maxTokens: 4096,
      contextLength: 16384,
      temperature: 0.7,
      vision: false
    }
  }

  if (modelId.toLowerCase().includes('gpt-3.5-turbo')) {
    return {
      maxTokens: 4096,
      contextLength: 4096,
      temperature: 0.7,
      vision: false
    }
  }

  if (modelId.toLowerCase().includes('o1-preview')) {
    return {
      maxTokens: 32768,
      contextLength: 128000,
      temperature: 0.7,
      vision: true
    }
  }

  if (modelId.toLowerCase().includes('o1-mini')) {
    return {
      maxTokens: 65536,
      contextLength: 128000,
      temperature: 0.7,
      vision: true
    }
  }

  // 开源模型配置
  // Llama系列
  if (
    modelId.toLowerCase().includes('llama-3.1-405b') ||
    modelId.toLowerCase().includes('llama-3.1-405-b') ||
    modelId.toLowerCase().includes('llama-3.1-405')
  ) {
    return {
      maxTokens: 32768,
      contextLength: 128000,
      temperature: 0.7,
      vision: false
    }
  }

  if (
    modelId.toLowerCase().includes('llama-3.1-70b') ||
    modelId.toLowerCase().includes('llama-3.1-70-b') ||
    modelId.toLowerCase().includes('llama-3.1-70')
  ) {
    return {
      maxTokens: 16384,
      contextLength: 128000,
      temperature: 0.7,
      vision: false
    }
  }

  if (
    modelId.toLowerCase().includes('llama-3-70b') ||
    modelId.toLowerCase().includes('llama-3-70-b') ||
    modelId.toLowerCase().includes('llama-3-70')
  ) {
    return {
      maxTokens: 8192,
      contextLength: 32768,
      temperature: 0.7,
      vision: false
    }
  }

  if (
    modelId.toLowerCase().includes('llama-3.1-8b') ||
    modelId.toLowerCase().includes('llama-3.1-8-b')
  ) {
    return {
      maxTokens: 8192,
      contextLength: 8192,
      temperature: 0.7,
      vision: false
    }
  }

  if (
    modelId.toLowerCase().includes('llama-3-8b') ||
    modelId.toLowerCase().includes('llama-3-8-b')
  ) {
    return {
      maxTokens: 2048,
      contextLength: 8192,
      temperature: 0.7,
      vision: false
    }
  }

  if (modelId.toLowerCase().includes('llama-2-70b')) {
    return {
      maxTokens: 2048,
      contextLength: 4096,
      temperature: 0.7,
      vision: false
    }
  }

  if (modelId.toLowerCase().includes('llama-2-')) {
    return {
      maxTokens: 2048,
      contextLength: 4096,
      temperature: 0.7,
      vision: false
    }
  }

  // Mistral系列
  if (modelId.toLowerCase().includes('mistral-large-2')) {
    return {
      maxTokens: 8192,
      contextLength: 32768,
      temperature: 0.7,
      vision: false
    }
  }

  if (modelId.toLowerCase().includes('mistral-large')) {
    return {
      maxTokens: 8192,
      contextLength: 32768,
      temperature: 0.7,
      vision: false
    }
  }

  if (
    modelId.toLowerCase().includes('mistral-8x7b') ||
    modelId.toLowerCase().includes('mixtral-8x7b')
  ) {
    return {
      maxTokens: 8192,
      contextLength: 32768,
      temperature: 0.7,
      vision: false
    }
  }

  if (modelId.toLowerCase().includes('mistral-7b')) {
    return {
      maxTokens: 4096,
      contextLength: 8192,
      temperature: 0.7,
      vision: false
    }
  }

  // Qwen系列
  if (
    modelId.toLowerCase().includes('qwen2.5-72b') ||
    modelId.toLowerCase().includes('qwen-2.5-72b')
  ) {
    return {
      maxTokens: 8192,
      contextLength: 131072,
      temperature: 0.7,
      vision: false
    }
  }

  if (
    modelId.toLowerCase().includes('qwen2.5-32b') ||
    modelId.toLowerCase().includes('qwen-2.5-32b')
  ) {
    return {
      maxTokens: 8192,
      contextLength: 131072,
      temperature: 0.7,
      vision: false
    }
  }

  if (
    modelId.toLowerCase().includes('qwen2.5-14b') ||
    modelId.toLowerCase().includes('qwen-2.5-14b')
  ) {
    return {
      maxTokens: 8192,
      contextLength: 131072,
      temperature: 0.7,
      vision: false
    }
  }

  if (
    modelId.toLowerCase().includes('qwen2.5-7b') ||
    modelId.toLowerCase().includes('qwen-2.5-7b')
  ) {
    return {
      maxTokens: 8192,
      contextLength: 131072,
      temperature: 0.7,
      vision: false
    }
  }

  if (modelId.toLowerCase().includes('qwen2.5-') || modelId.toLowerCase().includes('qwen-2.5-')) {
    return {
      maxTokens: 4096,
      contextLength: 128000,
      temperature: 0.7,
      vision: false
    }
  }

  if (modelId.toLowerCase().includes('qwen-')) {
    return {
      maxTokens: 2048,
      contextLength: 32768,
      temperature: 0.7,
      vision: false
    }
  }

  // Yi系列
  if (modelId.toLowerCase().includes('yi-34b')) {
    return {
      maxTokens: 4096,
      contextLength: 32768,
      temperature: 0.7,
      vision: false
    }
  }

  if (modelId.toLowerCase().includes('yi-')) {
    return {
      maxTokens: 4096,
      contextLength: 16384,
      temperature: 0.7,
      vision: false
    }
  }

  // Gemma系列
  if (modelId.toLowerCase().includes('gemma-2-27b')) {
    return {
      maxTokens: 8192,
      contextLength: 8192,
      temperature: 0.7,
      vision: false
    }
  }

  if (modelId.toLowerCase().includes('gemma-2-9b')) {
    return {
      maxTokens: 8192,
      contextLength: 8192,
      temperature: 0.7,
      vision: false
    }
  }

  if (modelId.toLowerCase().includes('gemma-2-2b')) {
    return {
      maxTokens: 8192,
      contextLength: 8192,
      temperature: 0.7,
      vision: false
    }
  }

  if (modelId.toLowerCase().includes('gemma-7b')) {
    return {
      maxTokens: 8192,
      contextLength: 8192,
      temperature: 0.7,
      vision: false
    }
  }

  if (modelId.toLowerCase().includes('gemma-2b')) {
    return {
      maxTokens: 8192,
      contextLength: 8192,
      temperature: 0.7,
      vision: false
    }
  }

  // Phi系列
  if (
    modelId.toLowerCase().includes('phi-4-') ||
    modelId.toLowerCase().includes('phi4-') ||
    modelId.toLowerCase().includes('phi4')
  ) {
    return {
      maxTokens: 4096,
      contextLength: 128000,
      temperature: 0.7,
      vision: false
    }
  }

  if (
    modelId.toLowerCase().includes('phi-3-') ||
    modelId.toLowerCase().includes('phi3-') ||
    modelId.toLowerCase().includes('phi3')
  ) {
    return {
      maxTokens: 4096,
      contextLength: 32768,
      temperature: 0.7,
      vision: false
    }
  }

  // ==== 新增模型提供商 ====

  // Ollama平台模型配置 (默认上下文长度2048，可通过num_ctx参数调整)
  if (modelId.toLowerCase().includes('ollama') || modelId.toLowerCase().startsWith('ollama/')) {
    return {
      maxTokens: 2048,
      contextLength: 2048,
      temperature: 0.7,
      vision: false
    }
  }

  // Doubao (字节跳动)模型配置
  if (modelId.toLowerCase().includes('doubao-1.5-pro-256k')) {
    return {
      maxTokens: 8192,
      contextLength: 262144, // 256k
      temperature: 0.7,
      vision: false
    }
  }

  if (modelId.toLowerCase().includes('doubao-1.5-vision-pro-32k')) {
    return {
      maxTokens: 4096,
      contextLength: 32768, // 32k
      temperature: 0.7,
      vision: true
    }
  }

  if (modelId.toLowerCase().includes('doubao-1.5-pro-32k')) {
    return {
      maxTokens: 4096,
      contextLength: 32768, // 32k
      temperature: 0.7,
      vision: false
    }
  }

  if (modelId.toLowerCase().includes('doubao')) {
    return {
      maxTokens: 4096,
      contextLength: 16384, // 默认假设16k
      temperature: 0.7,
      vision: false
    }
  }

  // MiniMax模型配置
  if (
    modelId.toLowerCase().includes('minimax-01') ||
    modelId.toLowerCase().includes('minimax/minimax-01') ||
    modelId.toLowerCase().includes('minimax-text-01')
  ) {
    return {
      maxTokens: 8192,
      contextLength: 1048576, // 1M token
      temperature: 0.7,
      vision: false
    }
  }

  if (modelId.toLowerCase().includes('glm-4-plus') || modelId.toLowerCase().includes('glm-4-air')) {
    return {
      maxTokens: 8192,
      contextLength: 1048576, // 1M token
      temperature: 0.7,
      vision: false
    }
  }

  if (
    modelId.toLowerCase().includes('step-2-16k-exp') ||
    modelId.toLowerCase().includes('step-2-16k')
  ) {
    return {
      maxTokens: 4096,
      contextLength: 16384, // 16k
      temperature: 0.7,
      vision: false
    }
  }

  if (modelId.toLowerCase().includes('step-2-mini')) {
    return {
      maxTokens: 4096,
      contextLength: 32768, // 假设32k
      temperature: 0.7,
      vision: false
    }
  }

  if (modelId.toLowerCase().includes('minimax')) {
    return {
      maxTokens: 4096,
      contextLength: 32768, // 默认假设32k
      temperature: 0.7,
      vision: false
    }
  }

  // Fireworks AI模型配置
  if (
    modelId.toLowerCase().includes('fireworks') ||
    modelId.toLowerCase().startsWith('accounts/fireworks/')
  ) {
    // 根据模型ID判断基础模型类型
    if (
      modelId.toLowerCase().includes('llama-3.1-405b') ||
      modelId.toLowerCase().includes('llama-3.1-405-b')
    ) {
      return {
        maxTokens: 32768,
        contextLength: 128000,
        temperature: 0.7,
        vision: false
      }
    } else if (
      modelId.toLowerCase().includes('llama-3.1-70b') ||
      modelId.toLowerCase().includes('llama-3.1-70-b')
    ) {
      return {
        maxTokens: 16384,
        contextLength: 128000,
        temperature: 0.7,
        vision: false
      }
    } else if (
      modelId.toLowerCase().includes('llama-3.1-8b') ||
      modelId.toLowerCase().includes('llama-3.1-8-b')
    ) {
      return {
        maxTokens: 8192,
        contextLength: 8192,
        temperature: 0.7,
        vision: false
      }
    } else {
      // 默认配置
      return {
        maxTokens: 4096,
        contextLength: 16384,
        temperature: 0.7,
        vision: false
      }
    }
  }

  // PPIO AI模型配置（信息有限，使用保守估计）
  if (modelId.toLowerCase().includes('ppio')) {
    return {
      maxTokens: 4096,
      contextLength: 16384, // 保守估计
      temperature: 0.7,
      vision: false
    }
  }

  // Moonshot (月之暗面)模型配置
  if (
    modelId.toLowerCase().includes('moonshot-v1-8k') ||
    modelId.toLowerCase().includes('moonshot/moonshot-v1-8k')
  ) {
    return {
      maxTokens: 4096,
      contextLength: 8192,
      temperature: 0.7,
      vision: false
    }
  }

  if (
    modelId.toLowerCase().includes('moonshot-v1-32k') ||
    modelId.toLowerCase().includes('moonshot/moonshot-v1-32k')
  ) {
    return {
      maxTokens: 8192,
      contextLength: 32768,
      temperature: 0.7,
      vision: false
    }
  }

  if (
    modelId.toLowerCase().includes('moonshot-v1-128k') ||
    modelId.toLowerCase().includes('moonshot/moonshot-v1-128k')
  ) {
    return {
      maxTokens: 8192,
      contextLength: 131072,
      temperature: 0.7,
      vision: false
    }
  }

  if (modelId.toLowerCase().includes('moonshot')) {
    return {
      maxTokens: 4096,
      contextLength: 32768, // 默认假设32k
      temperature: 0.7,
      vision: false
    }
  }

  // OpenRouter配置（根据实际转发的模型参数而定）
  if (
    modelId.toLowerCase().includes('openrouter') ||
    modelId.toLowerCase().startsWith('openrouter/')
  ) {
    // 默认使用较大的上下文长度和token数，实际会根据目标模型限制
    return {
      maxTokens: 8192,
      contextLength: 32768,
      temperature: 0.7,
      vision: false
    }
  }

  // GitHub Copilot配置
  if (
    modelId.toLowerCase().includes('github-copilot') ||
    modelId.toLowerCase().includes('copilot')
  ) {
    return {
      maxTokens: 4096,
      contextLength: 8192, // 保守估计
      temperature: 0.7,
      vision: false
    }
  }

  // Azure OpenAI配置（与OpenAI模型相同，但独立配置便于识别）
  if (
    modelId.toLowerCase().includes('azure-openai') ||
    modelId.toLowerCase().includes('azure/openai')
  ) {
    if (modelId.toLowerCase().includes('gpt-4o')) {
      return {
        maxTokens: 4096,
        contextLength: 128000,
        temperature: 0.7,
        vision: true
      }
    } else if (
      modelId.toLowerCase().includes('gpt-4-turbo') ||
      modelId.toLowerCase().includes('gpt-4-1106')
    ) {
      return {
        maxTokens: 4096,
        contextLength: 128000,
        temperature: 0.7,
        vision: true
      }
    } else if (modelId.toLowerCase().includes('gpt-4-32k')) {
      return {
        maxTokens: 4096,
        contextLength: 32768,
        temperature: 0.7,
        vision: false
      }
    } else if (modelId.toLowerCase().includes('gpt-4')) {
      return {
        maxTokens: 4096,
        contextLength: 8192,
        temperature: 0.7,
        vision: false
      }
    } else if (modelId.toLowerCase().includes('gpt-3.5-turbo-16k')) {
      return {
        maxTokens: 4096,
        contextLength: 16384,
        temperature: 0.7,
        vision: false
      }
    } else {
      // 默认gpt-3.5-turbo配置
      return {
        maxTokens: 4096,
        contextLength: 4096,
        temperature: 0.7,
        vision: false
      }
    }
  }

  // Silicon (硅基智能)模型配置（信息有限，使用保守估计）
  if (modelId.toLowerCase().includes('silicon')) {
    return {
      maxTokens: 4096,
      contextLength: 16384, // 保守估计
      temperature: 0.7,
      vision: false
    }
  }

  // 使用默认匹配逻辑
  const providerConfigs = defaultModelsSettings.find((config) =>
    config.match.every((matchString) => modelId.toLowerCase().includes(matchString.toLowerCase()))
  )

  if (!providerConfigs) {
    return undefined
  }
  return providerConfigs
}
