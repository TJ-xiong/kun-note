import { ipcMain } from 'electron'
import Database from 'better-sqlite3'
import { notesRequest } from '../utils/request'
import SyncManager from '../utils/sync-manager'
import { NoteHistoryEntry } from '../../types/sync'
import { Note } from '../../types/note'

let syncManager: SyncManager

export function getSyncManager(): SyncManager {
  return syncManager
}

export function initSyncIPC(db: Database.Database, getWindows: () => Electron.BrowserWindow[]): void {
  syncManager = new SyncManager(db, getWindows)

  // 手动触发同步
  ipcMain.handle('sync-start', async () => {
    return syncManager.sync()
  })

  // 解决冲突
  ipcMain.handle('sync-resolve', (_event, noteId: string, resolution: 'use-mine' | 'use-server') => {
    syncManager.resolveConflict(noteId, resolution)
    return { success: true }
  })

  // 获取同步状态
  ipcMain.handle('sync-status', () => {
    return {
      status: syncManager.getStatus(),
      conflicts: syncManager.getPendingConflicts()
    }
  })

  // 获取回收站列表
  ipcMain.handle('get-trash', async () => {
    const response = await notesRequest<{ notes: Note[]; total: number }>({
      url: '/api/v1/trash',
      method: 'GET'
    })
    return response
  })

  // 恢复已删除笔记
  ipcMain.handle('restore-note', async (_event, noteId: string) => {
    const response = await notesRequest<{ note: Note }>({
      url: `/api/v1/trash/${noteId}/restore`,
      method: 'POST'
    })
    // 同步恢复到本地数据库
    if (response) {
      const existing = db.prepare('SELECT id FROM notes WHERE id=?').get(noteId)
      if (existing) {
        db.prepare('UPDATE notes SET deleted=0, updatedAt=? WHERE id=?').run(Date.now(), noteId)
      }
    }
    return response
  })

  // 永久删除笔记
  ipcMain.handle('permanent-delete', async (_event, noteId: string) => {
    const response = await notesRequest<{ success: boolean }>({
      url: `/api/v1/trash/${noteId}`,
      method: 'DELETE'
    })
    // 同步删除本地记录
    db.prepare('DELETE FROM notes WHERE id=?').run(noteId)
    return response
  })

  // 获取笔记版本历史
  ipcMain.handle('get-note-history', async (_event, noteId: string) => {
    const response = await notesRequest<{ versions: NoteHistoryEntry[] }>({
      url: `/api/v1/notes/${noteId}/history`,
      method: 'GET'
    })
    return response
  })

  // 回滚到指定版本
  ipcMain.handle('rollback-note', async (_event, noteId: string, version: number) => {
    const response = await notesRequest<{ note: Note }>({
      url: `/api/v1/notes/${noteId}/rollback`,
      method: 'POST',
      data: { version }
    })
    // 同步回滚到本地数据库
    if (response && (response as { note: Note }).note) {
      const note = (response as { note: Note }).note
      db.prepare(
        `UPDATE notes SET title=?, content=?, type=?, parentId=?, isPinned=?, version=?, updatedAt=?, syncedAt=? WHERE id=?`
      ).run(
        note.title,
        note.content,
        note.type,
        note.parentId,
        note.isPinned ? 1 : 0,
        note.version,
        Date.now(),
        Date.now(),
        noteId
      )
    }
    return response
  })
}

export { syncManager }
