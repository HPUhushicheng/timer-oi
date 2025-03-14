# 事件系统设计文档

## 问题背景

当前项目中的`provider-models-updated`事件存在混乱的情况，这个事件同时由两个不同的来源触发：

1. **BaseLLMProvider**: 在处理模型时触发（如`addCustomModel`, `removeCustomModel`等方法）
2. **ConfigPresenter**: 在配置更改时触发（如`addCustomModel`, `removeCustomModel`等方法）

这种设计导致了多种问题：
- 事件循环触发（导致死循环问题）
- 事件语义不清晰（同一事件表示不同的业务含义）
- 代码耦合度高且难以维护

## 事件分类与命名规范

将事件按功能领域分类，并采用统一的命名规范：

1. **配置相关事件**：
   - `config:provider-changed`：提供者配置变更
   - `config:system-changed`：系统配置变更
   - `config:model-list-changed`：配置中的模型列表变更

2. **模型相关事件**：
   全部去掉，模型状态和名称事件都有config来发起,和上层settings保持语义一致

3. **会话相关事件**：
   - `conversation:created`
   - `conversation:activated`
   - `conversation:cleared`

4. **通信相关事件**：
   - `stream:response`
   - `stream:end`
   - `stream:error`

5. **应用更新相关事件**：
   - `update:status-changed`
   - `update:progress`
   - `update:error`
   - `update:will-restart`

## 责任分离

明确每个组件的事件触发责任：

- **ConfigPresenter**：仅负责配置相关事件
- **BaseLLMProvider**：仅负责模型操作,不发起事件
- **ThreadPresenter**：仅负责会话相关事件
- **UpgradePresenter**：仅负责应用更新相关事件

## 事件流时序图

### 当前事件流

```
BaseLLMProvider                ConfigPresenter                  Presenter(Main)                  Settings(Renderer)
     |                              |                                 |                                |
     |--- provider-models-updated-->|                                 |                                |
     |                              |--- provider-models-updated----->|                                |
     |                              |                                 |--- provider-models-updated---->|
     |                              |                                 |                                |--- refreshProviderModels()
     |                              |                                 |                                |
     |--- model-status-changed----->|                                 |                                |
     |                              |--- model-status-changed-------->|                                |
     |                              |                                 |--- model-status-changed------->|
     |                              |                                 |                                |--- updateLocalModelStatus()
     |                              |                                 |                                |
     |                              |--- provider-setting-changed---->|                                |
     |                              |                                 |--- provider-setting-changed--->|
     |                              |                                 |                                |--- refreshAllModels()
```

### 重构后的事件流

```
ConfigPresenter                  Presenter(Main)                  Settings(Renderer)
     |                                 |                                |
     |                                |
     |--- config:model-list-changed--->|                                |
     |                                 |--- config:model-list-changed-->|
     |                                 |                                |--- refreshProviderModels()
     |                                 |                                |
     |                                 |                                |
     |--- model:status-changed-------->|                                |
     |                                 |--- model:status-changed------->|
     |                                 |                                |--- updateLocalModelStatus()
     |                                 |                                |
     |--- config:provider-changed----->|                                |
     |                                 |--- config:provider-changed---->|
     |                                 |                                |--- refreshAllModels()
```
