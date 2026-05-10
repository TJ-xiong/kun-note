import { app, ipcMain, BrowserWindow } from 'electron'
import { autoUpdater, UpdateInfo } from 'electron-updater'
import log from '../utils/logger'

// 配置日志
autoUpdater.logger = {
  info: (message: string) => log.info('[Updater]', message),
  warn: (message: string) => log.warn('[Updater]', message),
  error: (message: string) => log.error('[Updater]', message),
  debug: (message: string) => log.debug('[Updater]', message),
  transports: [] as never[]
} as unknown as typeof autoUpdater.logger

// 手动确认后才下载
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

// 通知所有窗口
function broadcast(channel: string, ...args: unknown[]): void {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, ...args)
    }
  })
}

// 注册 IPC handlers
function initUpdaterIPC(): void {
  // 获取当前版本号
  ipcMain.handle('get-app-version', () => {
    return app.getVersion()
  })

  // 检查更新
  ipcMain.handle('check-for-updates', async () => {
    if (!app.isPackaged) {
      log.info('[Updater] Skip check: app is not packed')
      broadcast('update-status', { status: 'not-available' })
      return null
    }
    try {
      const result = await autoUpdater.checkForUpdates()
      if (result) {
        return {
          version: result.updateInfo.version,
          releaseDate: result.updateInfo.releaseDate,
          releaseName: (result.updateInfo as UpdateInfo & { releaseName?: string }).releaseName,
          releaseNotes: typeof result.updateInfo.releaseNotes === 'string'
            ? result.updateInfo.releaseNotes
            : undefined
        }
      }
      return null
    } catch (e) {
      log.error('[Updater] Check for updates failed:', e)
      throw e
    }
  })

  // 下载更新
  ipcMain.handle('download-update', async () => {
    if (!app.isPackaged) return
    try {
      await autoUpdater.downloadUpdate()
    } catch (e) {
      log.error('[Updater] Download update failed:', e)
      throw e
    }
  })

  // 安装更新并重启
  ipcMain.handle('install-update', () => {
    if (!app.isPackaged) return
    autoUpdater.quitAndInstall(false, true)
  })

  // --- autoUpdater 事件监听 ---

  autoUpdater.on('checking-for-update', () => {
    log.info('[Updater] Checking for update...')
    broadcast('update-status', { status: 'checking' })
  })

  autoUpdater.on('update-available', (info) => {
    log.info('[Updater] Update available:', info.version)
    broadcast('update-status', {
      status: 'available',
      info: {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseName: (info as UpdateInfo & { releaseName?: string }).releaseName,
        releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : undefined
      }
    })
  })

  autoUpdater.on('update-not-available', (info) => {
    log.info('[Updater] Update not available. Current:', info.version)
    broadcast('update-status', { status: 'not-available' })
  })

  autoUpdater.on('download-progress', (progress) => {
    broadcast('update-progress', {
      percent: progress.percent,
      bytesPerSecond: progress.bytesPerSecond,
      total: progress.total,
      transferred: progress.transferred
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    log.info('[Updater] Update downloaded:', info.version)
    broadcast('update-status', {
      status: 'downloaded',
      info: {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseName: (info as UpdateInfo & { releaseName?: string }).releaseName,
        releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : undefined
      }
    })
  })

  autoUpdater.on('error', (err) => {
    log.error('[Updater] Error:', err.message)
    broadcast('update-status', { status: 'error', error: err.message })
  })
}

// 启动自动检查（延迟执行，仅打包后生效）
function scheduleAutoCheck(delayMs: number = 5000): void {
  if (!app.isPackaged) {
    log.info('[Updater] Skip auto check: app is not packed')
    return
  }
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((e) => {
      log.error('[Updater] Auto check failed:', e)
    })
  }, delayMs)
}

export { initUpdaterIPC, scheduleAutoCheck }
