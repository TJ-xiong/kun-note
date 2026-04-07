import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { Note } from '../types/note'
import { HttpRequestConfig } from '../types/http'

// Custom APIs for renderer
const api = {
  saveNote: (note: Note) => ipcRenderer.invoke('save-note', note),
  getNote: (id: string) => ipcRenderer.invoke('get-note', id),
  listNotes: () => ipcRenderer.invoke('list-notes'),
  deleteNote: (id: string) => ipcRenderer.invoke('delete-note', id),
  handleTransparent: (isTransparent: boolean) =>
    ipcRenderer.invoke('handle-transparent', isTransparent),
  openOrCloseWindow: (route: string) => ipcRenderer.invoke('open-or-close-window', route),
  request: <T = unknown>(config: HttpRequestConfig): Promise<T> =>
    ipcRenderer.invoke('http-request', config),
  // 保存剪贴板图片到本地，返回相对路径（./images/xxx）
  saveImage: (dataUrl: string): Promise<string> => ipcRenderer.invoke('save-image', dataUrl),
  // 获取图片目录的绝对路径（用于渲染时解析相对路径）
  getImagesDir: (): Promise<string> => ipcRenderer.invoke('get-images-dir'),
  // 将相对图片路径转换为 data URL（用于 dev 环境避免 file:/// CSP/权限限制）
  getImageDataUrl: (rel: string): Promise<string> => ipcRenderer.invoke('get-image-data-url', rel)
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
