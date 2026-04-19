/// <reference types="vite/client" />

export interface AppSettings {
  autoHideOnMouseLeave: boolean
  hideDelay: number
}

export interface Api {
  saveNote: (note: any) => Promise<any>
  getNote: (id: string) => Promise<any>
  listNotes: () => Promise<any[]>
  listNotesByParent: (parentId: string) => Promise<any[]>
  searchNotes: (keyword: string) => Promise<any[]>
  deleteNote: (id: string) => Promise<number>
  togglePin: (id: string) => Promise<any>
  handleTransparent: (isTransparent: boolean) => Promise<void>
  openOrCloseWindow: (route: string) => Promise<void>
  request: <T = unknown>(config: any) => Promise<T>
  saveImage: (dataUrl: string) => Promise<string>
  getImagesDir: () => Promise<string>
  getImageDataUrl: (rel: string) => Promise<string>
  getSettings: () => Promise<AppSettings>
  saveSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>
}

declare global {
  interface Window {
    api: Api
  }
}
