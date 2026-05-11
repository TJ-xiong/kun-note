import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { Note } from '../types/note'
import { LoginResponse, UserInfo } from '../types/auth'
import { SyncResponse, SyncConflict, SyncStatusEvent, TrashNote, NoteHistoryEntry, UpdateStatusEvent, UpdateProgress, UpdateInfo } from '../types/sync'

// Custom APIs for renderer
interface AppSettings {
  autoHideOnMouseLeave: boolean
  hideDelay: number
}
const api = {
  saveNote: (note: Note) => ipcRenderer.invoke('save-note', note),
  getNote: (id: string) => ipcRenderer.invoke('get-note', id),
  listNotes: () => ipcRenderer.invoke('list-notes'),
  listNotesByParent: (parentId: string) => ipcRenderer.invoke('list-notes-by-parent', parentId),
  searchNotes: (keyword: string) => ipcRenderer.invoke('search-notes', keyword),
  deleteNote: (id: string) => ipcRenderer.invoke('delete-note', id),
  togglePin: (id: string) => ipcRenderer.invoke('toggle-pin', id),
  handleTransparent: (isTransparent: boolean) =>
    ipcRenderer.invoke('handle-transparent', isTransparent),
  openOrCloseWindow: (route: string) => ipcRenderer.invoke('open-or-close-window', route),
  // 保存剪贴板图片到本地，返回相对路径（./images/xxx）
  saveImage: (dataUrl: string): Promise<string> => ipcRenderer.invoke('save-image', dataUrl),
  // 获取图片目录的绝对路径（用于渲染时解析相对路径）
  getImagesDir: (): Promise<string> => ipcRenderer.invoke('get-images-dir'),
  // 将相对图片路径转换为 data URL（用于 dev 环境避免 file:/// CSP/权限限制）
  getImageDataUrl: (rel: string): Promise<string> => ipcRenderer.invoke('get-image-data-url', rel),
  // 渲染进程日志转发到主进程日志文件
  log: (level: string, ...args: unknown[]): Promise<void> => ipcRenderer.invoke('renderer-log', level, ...args),
  // 设置相关
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke('save-settings', settings),
  authLogin: (username: string, password: string): Promise<LoginResponse> =>
    ipcRenderer.invoke('auth-login', username, password),
  authLogout: (): Promise<void> => ipcRenderer.invoke('auth-logout'),
  authGetUser: (): Promise<UserInfo> => ipcRenderer.invoke('auth-get-user'),
  // 同步相关
  syncStart: (): Promise<SyncResponse | null> => ipcRenderer.invoke('sync-start'),
  syncResolve: (noteId: string, resolution: 'use-mine' | 'use-server'): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('sync-resolve', noteId, resolution),
  syncGetStatus: (): Promise<{ status: string; conflicts: SyncConflict[] }> =>
    ipcRenderer.invoke('sync-status'),
  onSyncStatus: (callback: (event: SyncStatusEvent) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: SyncStatusEvent): void => callback(data)
    ipcRenderer.on('sync-status', handler)
    return () => ipcRenderer.removeListener('sync-status', handler)
  },
  onSyncConflict: (callback: (conflicts: SyncConflict[]) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: SyncConflict[]): void => callback(data)
    ipcRenderer.on('sync-conflict', handler)
    return () => ipcRenderer.removeListener('sync-conflict', handler)
  },
  // 回收站
  getTrash: (): Promise<{ notes: TrashNote[]; total: number }> =>
    ipcRenderer.invoke('get-trash'),
  restoreNote: (noteId: string): Promise<{ note: Note }> =>
    ipcRenderer.invoke('restore-note', noteId),
  permanentDelete: (noteId: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('permanent-delete', noteId),
  // 版本历史
  getNoteHistory: (noteId: string): Promise<{ versions: NoteHistoryEntry[] }> =>
    ipcRenderer.invoke('get-note-history', noteId),
  rollbackNote: (noteId: string, version: number): Promise<{ note: Note }> =>
    ipcRenderer.invoke('rollback-note', noteId, version),
  // 更新相关
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('get-app-version'),
  checkForUpdates: (): Promise<UpdateInfo | null> => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: (): Promise<void> => ipcRenderer.invoke('download-update'),
  installUpdate: (): Promise<void> => ipcRenderer.invoke('install-update'),
  onUpdateStatus: (callback: (event: UpdateStatusEvent) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: UpdateStatusEvent): void => callback(data)
    ipcRenderer.on('update-status', handler)
    return () => ipcRenderer.removeListener('update-status', handler)
  },
  onUpdateProgress: (callback: (progress: UpdateProgress) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: UpdateProgress): void => callback(data)
    ipcRenderer.on('update-progress', handler)
    return () => ipcRenderer.removeListener('update-progress', handler)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('process', {
      argv: process.argv
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
  // @ts-ignore (define in dts)
  window.process = process
}
