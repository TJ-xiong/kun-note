import { ElectronAPI } from '@electron-toolkit/preload'
import { NewOrUpdateNote, Note } from '../types/note'
import { LoginResponse, UserInfo } from '../types/auth'

interface AppSettings {
  autoHideOnMouseLeave: boolean
  hideDelay: number
}

type Api = {
  saveNote: (note: NewOrUpdateNote) => Promise<Note>
  listNotes: () => Promise<Note[]>
  listNotesByParent: (parentId: string) => Promise<Note[]>
  searchNotes: (keyword: string) => Promise<Note[]>
  getNote: (id: string) => Promise<Note | null>
  deleteNote: (id: string) => Promise<number>
  togglePin: (id: string) => Promise<void>
  handleTransparent: (isTransparent: boolean) => void
  openOrCloseWindow: (route: string) => Promise<void>
  saveImage: (dataUrl: string) => Promise<string>
  getImagesDir: () => Promise<string>
  getImageDataUrl: (rel: string) => Promise<string>
  getSettings: () => Promise<AppSettings>
  saveSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>
  authLogin: (username: string, password: string) => Promise<LoginResponse>
  authLogout: () => Promise<void>
  authGetUser: () => Promise<UserInfo>
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
