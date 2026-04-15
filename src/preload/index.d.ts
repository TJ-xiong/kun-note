import { ElectronAPI } from '@electron-toolkit/preload'
import { NewOrUpdateNote, Note } from '../types/note'
import { ipcRenderer } from 'electron'

type Api = {
  saveNote: (note: NewOrUpdateNote) => Promise<Note>
  listNotes: () => Promise<Note[]>
  listNotesByParent: (parentId: string) => Promise<Note[]>
  searchNotes: (keyword: string) => Promise<Note[]>
  getNote: (id: string) => Promise<Note | null>
  deleteNote: (id: string) => Promise<number>
  handleTransparent: (isTransparent: boolean) => void
  openOrCloseWindow: (route: string) => Promise<void>
  request<T = unknown>(config: HttpRequestConfig): Promise<T>
  saveImage: (dataUrl: string) => Promise<string> // 返回 ./images/xxx
  getImagesDir: () => Promise<string>
  getImageDataUrl: (rel: string) => Promise<string>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
    process: {
      argv: string[]
    }
  }
}
