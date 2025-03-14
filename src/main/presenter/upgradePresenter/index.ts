import { app, shell } from 'electron'
import { IUpgradePresenter, UpdateStatus, UpdateProgress } from '@shared/presenter'
import { eventBus } from '@/eventbus'
import { UPDATE_EVENTS } from '@/events'
import axios from 'axios'
import { compare } from 'compare-versions'

// 版本信息接口
interface VersionInfo {
  version: string
  releaseDate: string
  releaseNotes: string
  githubUrl: string
  downloadUrl: string
}

// 获取平台和架构信息
const getPlatformInfo = () => {
  const platform = process.platform
  const arch = process.arch
  let platformString = ''

  if (platform === 'win32') {
    platformString = arch === 'arm64' ? 'winarm' : 'winx64'
  } else if (platform === 'darwin') {
    platformString = arch === 'arm64' ? 'macarm' : 'macx64'
  } else if (platform === 'linux') {
    platformString = arch === 'arm64' ? 'linuxarm' : 'linuxx64'
  }

  return platformString
}

// 获取版本检查的基础URL
const getVersionCheckBaseUrl = () => {
  return 'https://deepchat.thinkinai.xyz/auth/'
}

export class UpgradePresenter implements IUpgradePresenter {
  private _lock: boolean = false
  private _status: UpdateStatus = 'not-available'
  private _progress: UpdateProgress | null = null
  private _error: string | null = null
  private _versionInfo: VersionInfo | null = null
  private _baseUrl: string

  constructor() {
    this._baseUrl = getVersionCheckBaseUrl()
  }

  async checkUpdate(): Promise<void> {
    if (this._lock) {
      return
    }

    try {
      this._status = 'checking'
      eventBus.emit(UPDATE_EVENTS.STATUS_CHANGED, { status: this._status })

      const platformString = getPlatformInfo()
      const versionUrl = `${this._baseUrl}${platformString}.json`

      const response = await axios.get<VersionInfo>(versionUrl)
      console.info(response.data)
      const remoteVersion = response.data
      const currentVersion = app.getVersion()

      // 比较版本号
      if (compare(remoteVersion.version, currentVersion, '>')) {
        // 有新版本
        this._status = 'available'
        this._versionInfo = remoteVersion
        eventBus.emit(UPDATE_EVENTS.STATUS_CHANGED, {
          status: this._status,
          info: {
            version: remoteVersion.version,
            releaseDate: remoteVersion.releaseDate,
            releaseNotes: remoteVersion.releaseNotes,
            githubUrl: remoteVersion.githubUrl,
            downloadUrl: remoteVersion.downloadUrl
          }
        })
      } else {
        // 没有新版本
        this._status = 'not-available'
        eventBus.emit(UPDATE_EVENTS.STATUS_CHANGED, { status: this._status })
      }
    } catch (error: Error | unknown) {
      this._status = 'error'
      this._error = error instanceof Error ? error.message : String(error)
      eventBus.emit(UPDATE_EVENTS.STATUS_CHANGED, {
        status: this._status,
        error: this._error
      })
    }
  }

  getUpdateStatus() {
    return {
      status: this._status,
      progress: this._progress,
      error: this._error,
      updateInfo: this._versionInfo
        ? {
            version: this._versionInfo.version,
            releaseDate: this._versionInfo.releaseDate,
            releaseNotes: this._versionInfo.releaseNotes,
            githubUrl: this._versionInfo.githubUrl,
            downloadUrl: this._versionInfo.downloadUrl
          }
        : null
    }
  }

  async goDownloadUpgrade(type: 'github' | 'netdisk'): Promise<void> {
    if (type === 'github') {
      const url = this._versionInfo?.githubUrl
      if (url) {
        shell.openExternal(url)
      }
    } else if (type === 'netdisk') {
      const url = this._versionInfo?.downloadUrl
      if (url) {
        shell.openExternal(url)
      }
    }
  }
}
