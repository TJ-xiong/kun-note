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
    ipcRenderer.invoke('http-request', config)
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
