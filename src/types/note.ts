export type NoteType = 'note' | 'folder'

export interface Note {
  id: string | null // 数据库主键
  title: string // 笔记标题
  content: string // Markdown 内容
  updatedAt: number // 更新时间（时间戳，ms）
  type: NoteType // 笔记类型
  parentId: string // 父级笔记 id
  isPinned?: boolean // 是否置顶
}

export type NewOrUpdateNote = Omit<Note, 'updatedAt'>
