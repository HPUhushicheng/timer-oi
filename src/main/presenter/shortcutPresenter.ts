import { app, globalShortcut } from 'electron'
import { WindowPresenter } from './windowPresenter'
import { ConfigPresenter } from './configPresenter'

export class ShortcutPresenter {
  private windowPresenter: WindowPresenter
  private configPresenter: ConfigPresenter
  private isActive: boolean = false

  constructor(windowPresenter: WindowPresenter, configPresenter: ConfigPresenter) {
    this.windowPresenter = windowPresenter
    this.configPresenter = configPresenter
    console.log('ShortcutPresenter constructor', this.configPresenter)
  }

  registerShortcuts(): void {
    if (this.isActive) return

    // Command+W 或 Ctrl+W 隐藏窗口
    globalShortcut.register(process.platform === 'darwin' ? 'Command+W' : 'Control+W', () => {
      if (this.windowPresenter.mainWindow?.isFocused()) {
        this.windowPresenter.hide()
      }
    })

    // Command+Q 或 Ctrl+Q 退出程序
    globalShortcut.register(process.platform === 'darwin' ? 'Command+Q' : 'Control+Q', () => {
      app.quit()
    })

    this.isActive = true
  }

  unregisterShortcuts(): void {
    globalShortcut.unregisterAll()
    this.isActive = false
  }

  destroy(): void {
    this.unregisterShortcuts()
  }
}
