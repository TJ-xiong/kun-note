export type NoteType = 'note' | 'folder'

export interface Note {
  id: string | null
  title: string
  content: string
  updatedAt: number
  type: NoteType
  parentId: string
  isPinned?: boolean
  version: number
  deleted: boolean
  syncedAt: number
}

export type NewOrUpdateNote = Omit<Note, 'updatedAt' | 'version' | 'deleted' | 'syncedAt'>
