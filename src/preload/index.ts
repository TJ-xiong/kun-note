import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { Note } from '../types/note'

// Custom APIs for renderer
const api = {
  saveNote: (note: Note) => ipcRenderer.invoke('save-note', note),
  getNote: (id: number) => ipcRenderer.invoke('get-note', id),
  listNotes: () => ipcRenderer.invoke('list-notes'),
  deleteNote: (id: number) => ipcRenderer.invoke('delete-note', id)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
