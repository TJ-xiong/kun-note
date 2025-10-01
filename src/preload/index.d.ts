import { ElectronAPI } from '@electron-toolkit/preload'
import { NewOrUpdateNote, Note } from '../types/note'

type Api = {
  saveNote: (note: NewOrUpdateNote) => Note
  listNotes: () => Promise<Note[]>
  getNote: (id: number) => Promise<Note | null>
  deleteNote: (id: number) => Promise<number>
  handleTransparent: (isTransparent: boolean) => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
