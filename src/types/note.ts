export interface Note {
  id: number | null // 数据库主键
  title: string // 笔记标题
  content: string // Markdown 内容
  updatedAt: number // 更新时间（时间戳，ms）
}

export type NewOrUpdateNote = Omit<Note, 'updatedAt'>
