import { Note } from './note'

// 同步状态
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'

// 同步状态变更事件
export interface SyncStatusEvent {
  status: SyncStatus
  error?: string
}

// 同步请求：客户端发送给服务端
export interface SyncRequest {
  lastSyncTime: number
  changes: Note[]
}

// 冲突项
export interface SyncConflict {
  id: string
  serverVersion: Note
  clientVersion: Note
}

// 同步响应：服务端返回给客户端
export interface SyncResponse {
  synced: string[]
  conflicts: SyncConflict[]
  serverChanges: Note[]
  syncTime: number
}

// 冲突解决方案
export type ConflictResolution = 'use-mine' | 'use-server'

// 冲突解决请求
export interface ResolveConflictRequest {
  noteId: string
  resolution: ConflictResolution
}

// 回收站笔记
export interface TrashNote {
  id: string
  title: string
  type: string
  updatedAt: number
}

// 版本历史条目
export interface NoteHistoryEntry {
  version: number
  syncedAt: number
  snapshot: Note
}

// 服务端图片信息
export interface ServerImage {
  filename: string
  size: number
  createdAt: number
}

// 更新状态
export type UpdateStatus = 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'

// 更新信息
export interface UpdateInfo {
  version: string
  releaseDate: string
  releaseName?: string
  releaseNotes?: string
}

// 更新状态事件
export interface UpdateStatusEvent {
  status: UpdateStatus
  info?: UpdateInfo
  error?: string
}

// 下载进度
export interface UpdateProgress {
  percent: number
  bytesPerSecond: number
  total: number
  transferred: number
}
