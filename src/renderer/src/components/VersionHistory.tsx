import { useState, useEffect } from 'react'
import { NoteHistoryEntry } from 'src/types/sync'
import { Note } from 'src/types/note'
import { RollbackOutlined } from '@ant-design/icons'

interface VersionHistoryProps {
  noteId: string
  visible: boolean
  onClose: () => void
  onRollback: (note: Note) => void
}

export default function VersionHistory({
  noteId,
  visible,
  onClose,
  onRollback
}: VersionHistoryProps): React.ReactElement | null {
  const [versions, setVersions] = useState<NoteHistoryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null)

  useEffect(() => {
    if (visible && noteId) {
      loadHistory()
    }
  }, [visible, noteId])

  const loadHistory = async (): Promise<void> => {
    setLoading(true)
    try {
      const result = await window.api.getNoteHistory(noteId)
      setVersions(result.versions)
    } catch (e) {
      console.error('Failed to load history:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleRollback = async (version: number): Promise<void> => {
    if (!window.confirm(`确定回滚到版本 ${version}？当前内容将被覆盖。`)) return
    try {
      const result = await window.api.rollbackNote(noteId, version)
      onRollback(result.note)
      onClose()
    } catch (e) {
      console.error('Failed to rollback:', e)
    }
  }

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('zh-CN')
  }

  if (!visible) return null

  return (
    <div className="version-history-overlay" onClick={onClose}>
      <div className="version-history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="version-history-header">
          <h3>版本历史</h3>
          <button className="version-history-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="version-history-content">
          {loading ? (
            <div className="version-history-empty">加载中...</div>
          ) : versions.length === 0 ? (
            <div className="version-history-empty">暂无历史版本</div>
          ) : (
            versions.map((v) => (
              <div
                key={v.version}
                className={`version-history-item ${selectedVersion === v.version ? 'selected' : ''}`}
                onClick={() => setSelectedVersion(v.version)}
              >
                <div className="version-history-item-header">
                  <span className="version-number">v{v.version}</span>
                  <span className="version-date">{formatDate(v.syncedAt)}</span>
                </div>
                {selectedVersion === v.version && (
                  <div className="version-history-item-detail">
                    <div className="version-preview">
                      <div className="version-preview-title">
                        {v.snapshot.title || '无标题'}
                      </div>
                      <div className="version-preview-content">
                        {(v.snapshot.content || '').substring(0, 200)}
                        {(v.snapshot.content || '').length > 200 ? '...' : ''}
                      </div>
                    </div>
                    <button
                      className="version-rollback-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRollback(v.version)
                      }}
                    >
                      <RollbackOutlined /> 回滚到此版本
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      <style>{`
        .version-history-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .version-history-modal {
          background: #fff;
          border-radius: 8px;
          width: 480px;
          max-height: 500px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .version-history-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #f0f0f0;
        }
        .version-history-header h3 {
          margin: 0;
          font-size: 16px;
          color: #262626;
        }
        .version-history-close {
          border: none;
          background: none;
          font-size: 20px;
          cursor: pointer;
          color: #8c8c8c;
          padding: 0 4px;
        }
        .version-history-content {
          flex: 1;
          overflow-y: auto;
          padding: 12px 20px;
        }
        .version-history-empty {
          text-align: center;
          padding: 32px;
          color: #bfbfbf;
        }
        .version-history-item {
          padding: 12px;
          border: 1px solid #f0f0f0;
          border-radius: 6px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .version-history-item:hover {
          border-color: #d9d9d9;
        }
        .version-history-item.selected {
          border-color: #1890ff;
          background: #f6f8ff;
        }
        .version-history-item-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .version-number {
          font-weight: 600;
          color: #262626;
          font-size: 14px;
        }
        .version-date {
          font-size: 12px;
          color: #8c8c8c;
        }
        .version-history-item-detail {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #f0f0f0;
        }
        .version-preview {
          margin-bottom: 12px;
        }
        .version-preview-title {
          font-weight: 500;
          margin-bottom: 8px;
          color: #262626;
        }
        .version-preview-content {
          font-size: 13px;
          color: #595959;
          line-height: 1.5;
          white-space: pre-wrap;
          max-height: 120px;
          overflow-y: auto;
          background: #fafafa;
          padding: 8px;
          border-radius: 4px;
        }
        .version-rollback-btn {
          border: 1px solid #1890ff;
          background: #fff;
          color: #1890ff;
          padding: 6px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }
        .version-rollback-btn:hover {
          background: #1890ff;
          color: #fff;
        }
      `}</style>
    </div>
  )
}
