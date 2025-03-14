import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { presenter } from './presenter'
import { proxyConfig } from './presenter/proxyConfig'
import { ProxyMode } from './presenter/proxyConfig'

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')
app.commandLine.appendSwitch('webrtc-max-cpu-consumption-percentage', '100')
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096')
app.commandLine.appendSwitch('ignore-certificate-errors')

if (process.platform == 'win32') {
  // app.commandLine.appendSwitch('in-process-gpu')
  // app.commandLine.appendSwitch('wm-window-animations-disabled')
}
if (process.platform === 'darwin') {
  app.commandLine.appendSwitch('disable-features', 'DesktopCaptureMacV2,IOSurfaceCapturer')
}
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.wefonk.deepchat')

  // 从配置中读取代理设置并初始化
  const proxyMode = presenter.configPresenter.getProxyMode() as ProxyMode
  const customProxyUrl = presenter.configPresenter.getCustomProxyUrl()
  proxyConfig.initFromConfig(proxyMode as ProxyMode, customProxyUrl)

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  presenter.windowPresenter.createMainWindow()
  presenter.shortcutPresenter.registerShortcuts()

  // const worker = new LlamaWorker(mainWindow)
  // ipcMain.on('new-chat', () => {
  //   worker.startNewChat()
  // })
  // // IPC test
  // ipcMain.on('prompt', (e, prompt: string) => {
  //   worker.prompt(prompt).then(() => {
  //     console.log('finished')
  //   })
  // })
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      presenter.windowPresenter.createMainWindow()
    } else {
      presenter.windowPresenter.mainWindow?.show()
    }
  })

  // 监听应用程序获得焦点事件
  app.on('browser-window-focus', () => {
    presenter.shortcutPresenter.registerShortcuts()
  })

  // 监听应用程序失去焦点事件
  app.on('browser-window-blur', () => {
    presenter.shortcutPresenter.unregisterShortcuts()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  presenter.destroy()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  presenter.destroy()
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
