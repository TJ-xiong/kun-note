import { app, BrowserWindow } from 'electron'
import path from 'path'
import fs from 'fs'
import Database from 'better-sqlite3'
import { notesRequest } from './request'
import { getAccessToken } from './auth-store'
import { Note } from '../../types/note'
import { SyncResponse, SyncConflict, SyncStatus } from '../../types/sync'

// 同步状态文件路径
const STATE_FILE = path.join(app.getPath('userData'), 'sync-state.json')

interface SyncState {
  lastSyncTime: number
}

function loadSyncState(): SyncState {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'))
    }
  } catch (e) {
    console.error('[Sync] Failed to load sync state:', e)
  }
  return { lastSyncTime: 0 }
}

function saveSyncState(state: SyncState): void {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
  } catch (e) {
    console.error('[Sync] Failed to save sync state:', e)
  }
}

class SyncManager {
  private db: Database.Database
  private state: SyncState
  private status: SyncStatus = 'idle'
  private syncTimer: NodeJS.Timeout | null = null
  private debounceTimer: NodeJS.Timeout | null = null
  private retryTimer: NodeJS.Timeout | null = null
  private pendingConflicts: SyncConflict[] = []
  private getWindows: () => BrowserWindow[]

  constructor(db: Database.Database, getWindows: () => BrowserWindow[]) {
    this.db = db
    this.state = loadSyncState()
    this.getWindows = getWindows
  }

  getStatus(): SyncStatus {
    return this.status
  }

  getPendingConflicts(): SyncConflict[] {
    return this.pendingConflicts
  }

  // 启动定时同步
  startAutoSync(intervalMs: number = 60_000): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
    }
    this.syncTimer = setInterval(() => {
      this.sync().catch((e) => console.error('[Sync] Auto sync failed:', e))
    }, intervalMs)
    console.log(`[Sync] Auto sync started, interval: ${intervalMs}ms`)
  }

  // 停止定时同步
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
    }
  }

  // 保存时触发（防抖 3 秒）
  triggerOnSave(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
    this.debounceTimer = setTimeout(() => {
      this.sync().catch((e) => console.error('[Sync] Save sync failed:', e))
    }, 3000)
  }

  // 手动触发同步
  async sync(): Promise<SyncResponse | null> {
    if (this.status === 'syncing') {
      console.log('[Sync] Already syncing, skipping')
      return null
    }

    if (!getAccessToken()) {
      console.log('[Sync] Not logged in, skipping sync')
      return null
    }

    this.setStatus('syncing')

    try {
      // 获取本地变更（lastSyncTime 之后修改的记录）
      const lastSyncTime = this.state.lastSyncTime
      const changes = this.getLocalChanges(lastSyncTime)

      const response = await notesRequest<SyncResponse>({
        url: '/api/v1/sync',
        method: 'POST',
        data: {
          lastSyncTime,
          changes
        }
      })

      const syncData = response as SyncResponse

      // 应用服务端变更到本地
      this.applyServerChanges(syncData.serverChanges)

      // 更新同步时间
      this.state.lastSyncTime = syncData.syncTime
      saveSyncState(this.state)

      // 处理冲突
      if (syncData.conflicts.length > 0) {
        this.pendingConflicts = syncData.conflicts
        this.notifyRenderer('sync-conflict', syncData.conflicts)
        this.setStatus('idle')
      } else {
        this.setStatus('success')
      }

      console.log(
        `[Sync] Synced: ${syncData.synced.length}, Conflicts: ${syncData.conflicts.length}, Server changes: ${syncData.serverChanges.length}`
      )

      return syncData
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error'
      console.error('[Sync] Sync failed:', message)
      this.setStatus('error', message)
      // 网络错误时，10 秒后重试
      if (message.includes('Network error') || message.includes('ECONNREFUSED')) {
        this.scheduleRetry()
      }
      return null
    }
  }

  // 解决冲突
  resolveConflict(noteId: string, resolution: 'use-mine' | 'use-server'): void {
    const conflict = this.pendingConflicts.find((c) => c.id === noteId)
    if (!conflict) return

    const noteToApply = resolution === 'use-mine' ? conflict.clientVersion : conflict.serverVersion
    this.applyNoteToLocal(noteToApply)

    this.pendingConflicts = this.pendingConflicts.filter((c) => c.id !== noteId)
    if (this.pendingConflicts.length === 0) {
      this.setStatus('success')
    }
  }

  // 网络恢复时立即同步
  onNetworkRestore(): void {
    console.log('[Sync] Network restored, triggering sync')
    this.sync().catch((e) => console.error('[Sync] Network restore sync failed:', e))
  }

  // 网络错误时，10 秒后重试
  private scheduleRetry(): void {
    if (this.retryTimer) return
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null
      console.log('[Sync] Retrying after network error...')
      this.sync().catch((e) => console.error('[Sync] Retry sync failed:', e))
    }, 10_000)
  }

  // 获取本地变更
  private getLocalChanges(lastSyncTime: number): Note[] {
    const rows = this.db
      .prepare(
        `SELECT id, title, content, type, parentId, isPinned, version, deleted, updatedAt, syncedAt
         FROM notes WHERE updatedAt > ? AND (syncedAt < updatedAt OR syncedAt = 0)`
      )
      .all(lastSyncTime) as Note[]
    return rows.map((row) => ({
      ...row,
      isPinned: Boolean(row.isPinned),
      deleted: Boolean(row.deleted)
    }))
  }

  // 应用服务端变更到本地
  private applyServerChanges(serverChanges: Note[]): void {
    for (const change of serverChanges) {
      this.applyNoteToLocal(change)
    }
  }

  // 将单条笔记应用到本地数据库
  private applyNoteToLocal(note: Note): void {
    const existing = this.db.prepare('SELECT id FROM notes WHERE id=?').get(note.id)

    if (existing) {
      this.db
        .prepare(
          `UPDATE notes SET title=?, content=?, type=?, parentId=?, isPinned=?, version=?, deleted=?, updatedAt=?, syncedAt=? WHERE id=?`
        )
        .run(
          note.title,
          note.content,
          note.type,
          note.parentId,
          note.isPinned ? 1 : 0,
          note.version,
          note.deleted ? 1 : 0,
          note.updatedAt,
          Date.now(),
          note.id
        )
    } else {
      this.db
        .prepare(
          `INSERT INTO notes (id, title, content, type, parentId, isPinned, version, deleted, createdAt, updatedAt, syncedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          note.id,
          note.title,
          note.content,
          note.type,
          note.parentId,
          note.isPinned ? 1 : 0,
          note.version,
          note.deleted ? 1 : 0,
          note.updatedAt,
          note.updatedAt,
          Date.now()
        )
    }
  }

  // 设置同步状态并通知渲染进程
  private setStatus(status: SyncStatus, error?: string): void {
    this.status = status
    this.notifyRenderer('sync-status', { status, error })

    // 自动从 success/error 回到 idle
    if (status === 'success' || status === 'error') {
      setTimeout(() => {
        this.status = 'idle'
        this.notifyRenderer('sync-status', { status: 'idle' })
      }, 3000)
    }
  }

  // 向所有渲染进程发送事件
  private notifyRenderer(channel: string, data: unknown): void {
    for (const win of this.getWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, data)
      }
    }
  }

  destroy(): void {
    this.stopAutoSync()
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
    }
  }
}

export default SyncManager
