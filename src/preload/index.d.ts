import { ElectronAPI } from '@electron-toolkit/preload'
import { NewOrUpdateNote, Note } from '../types/note'
import { ipcRenderer } from 'electron'

type Api = {
  saveNote: (note: NewOrUpdateNote) => Promise<Note>
  listNotes: () => Promise<Note[]>
  getNote: (id: string) => Promise<Note | null>
  deleteNote: (id: string) => Promise<number>
  handleTransparent: (isTransparent: boolean) => void
  request<T = unknown>(config: HttpRequestConfig): Promise<T>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
