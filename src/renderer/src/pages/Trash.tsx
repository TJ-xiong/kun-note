import { useState, useEffect } from 'react'
import { TrashNote } from 'src/types/sync'
import { DeleteOutlined, UndoOutlined } from '@ant-design/icons'
import './Trash.css'

export default function Trash(): React.ReactElement {
  const [notes, setNotes] = useState<TrashNote[]>([])
  const [loading, setLoading] = useState(true)

  const loadTrash = async (): Promise<void> => {
    setLoading(true)
    try {
      const result = await window.api.getTrash()
      setNotes(result.notes)
    } catch (e) {
      console.error('Failed to load trash:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTrash()
  }, [])

  const handleRestore = async (noteId: string): Promise<void> => {
    try {
      await window.api.restoreNote(noteId)
      setNotes((prev) => prev.filter((n) => n.id !== noteId))
    } catch (e) {
      console.error('Failed to restore note:', e)
    }
  }

  const handlePermanentDelete = async (noteId: string): Promise<void> => {
    if (!window.confirm('确定永久删除此笔记？此操作不可撤销。')) return
    try {
      await window.api.permanentDelete(noteId)
      setNotes((prev) => prev.filter((n) => n.id !== noteId))
    } catch (e) {
      console.error('Failed to permanently delete note:', e)
    }
  }

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('zh-CN')
  }

  return (
    <div className="trash-container">
      {/* 标题栏 */}
      <div className="trash-titlebar">
        <div className="trash-titlebar-drag">
          <span className="trash-title">回收站</span>
          <span className="trash-count">{notes.length} 项</span>
        </div>
        <button className="trash-close-btn" onClick={() => window.close()}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path
              d="M11 1L1 11M1 1L11 11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* 内容区域 */}
      <div className="trash-content">
        {loading ? (
          <div className="trash-empty">
            <div className="trash-empty-icon">
              <DeleteOutlined />
            </div>
            <div className="trash-empty-text">加载中...</div>
          </div>
        ) : notes.length === 0 ? (
          <div className="trash-empty">
            <div className="trash-empty-icon">
              <DeleteOutlined />
            </div>
            <div className="trash-empty-text">回收站为空</div>
            <div className="trash-empty-desc">删除的笔记将在这里显示</div>
          </div>
        ) : (
          <div className="trash-section">
            <div className="trash-section-header">
              <div className="trash-section-icon">
                <DeleteOutlined />
              </div>
              <h2>已删除的笔记</h2>
            </div>
            <div className="trash-card">
              {notes.map((note, index) => (
                <div key={note.id}>
                  <div className="trash-item">
                    <div className="trash-item-info">
                      <div className="trash-item-title">{note.title || '无标题'}</div>
                      <div className="trash-item-meta">
                        <span className="trash-item-type">
                          {note.type === 'folder' ? '文件夹' : '笔记'}
                        </span>
                        <span className="trash-item-date">{formatDate(note.updatedAt)}</span>
                      </div>
                    </div>
                    <div className="trash-item-actions">
                      <button
                        className="trash-btn restore"
                        onClick={() => handleRestore(note.id)}
                        title="恢复"
                      >
                        <UndoOutlined /> 恢复
                      </button>
                      <button
                        className="trash-btn delete"
                        onClick={() => handlePermanentDelete(note.id)}
                        title="永久删除"
                      >
                        <DeleteOutlined /> 删除
                      </button>
                    </div>
                  </div>
                  {index < notes.length - 1 && <div className="trash-divider" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
