import { Tray, Menu, app } from 'electron'
import path from 'path'
import { WindowPresenter } from './windowPresenter'

export class TrayPresenter {
  private tray: Tray | null = null
  private windowPresenter: WindowPresenter

  constructor(windowPresenter: WindowPresenter) {
    this.windowPresenter = windowPresenter
    this.createTray()
  }

  private createTray() {
    // 根据平台选择不同的图标
    const basePath = path.join(app.getAppPath(), 'resources')
    const iconPath = path.join(
      basePath,
      process.platform === 'win32' ? 'win-tray.ico' : 'mac-tray.png'
    )
    console.log('iconPath', iconPath)

    this.tray = new Tray(iconPath)
    this.tray.setToolTip('DeepChat')

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '打开',
        click: () => {
          this.windowPresenter.show()
        }
      },
      {
        label: '退出',
        click: () => {
          app.quit()
        }
      }
    ])

    this.tray.setContextMenu(contextMenu)

    // 点击托盘图标时显示窗口
    this.tray.on('click', () => {
      this.windowPresenter.show()
    })
  }

  destroy() {
    if (this.tray) {
      this.tray.destroy()
      this.tray = null
    }
  }
}
