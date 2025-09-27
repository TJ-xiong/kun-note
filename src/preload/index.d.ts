import { ElectronAPI } from '@electron-toolkit/preload'
import { NewOrUpdateNote, Note } from '../types/note'

type Api = {
  saveNote: (note: NewOrUpdateNote) => number
  listNotes: () => Promise<Note[]>
  getNote: (id: number) => Promise<Note | null>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
