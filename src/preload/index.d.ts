import { ElectronAPI } from '@electron-toolkit/preload'
import { NewOrUpdateNote, Note } from '../types/note'
import { LoginResponse, UserInfo } from '../types/auth'
import { SyncResponse, SyncConflict, SyncStatusEvent, TrashNote, NoteHistoryEntry } from '../types/sync'

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
  // 同步相关
  syncStart: () => Promise<SyncResponse | null>
  syncResolve: (noteId: string, resolution: 'use-mine' | 'use-server') => Promise<{ success: boolean }>
  syncGetStatus: () => Promise<{ status: string; conflicts: SyncConflict[] }>
  onSyncStatus: (callback: (event: SyncStatusEvent) => void) => () => void
  onSyncConflict: (callback: (conflicts: SyncConflict[]) => void) => () => void
  // 回收站
  getTrash: () => Promise<{ notes: TrashNote[]; total: number }>
  restoreNote: (noteId: string) => Promise<{ note: Note }>
  permanentDelete: (noteId: string) => Promise<{ success: boolean }>
  // 版本历史
  getNoteHistory: (noteId: string) => Promise<{ versions: NoteHistoryEntry[] }>
  rollbackNote: (noteId: string, version: number) => Promise<{ note: Note }>
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
