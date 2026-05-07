import { useState, useEffect } from 'react'
import { SyncStatusEvent, SyncConflict } from 'src/types/sync'
import { CloudSyncOutlined, CheckCircleOutlined, ExclamationCircleOutlined, LoadingOutlined } from '@ant-design/icons'

export default function SyncStatus(): React.ReactElement {
  const [status, setStatus] = useState<string>('idle')
  const [error, setError] = useState<string>('')
  const [conflicts, setConflicts] = useState<SyncConflict[]>([])

  useEffect(() => {
    // 获取初始状态
    window.api.syncGetStatus().then((data) => {
      setStatus(data.status)
      setConflicts(data.conflicts)
    })

    // 监听同步状态变更
    const removeStatusListener = window.api.onSyncStatus((event: SyncStatusEvent) => {
      setStatus(event.status)
      if (event.error) setError(event.error)
      if (event.status === 'idle') setError('')
    })

    // 监听冲突通知
    const removeConflictListener = window.api.onSyncConflict((conflicts: SyncConflict[]) => {
      setConflicts(conflicts)
    })

    return () => {
      removeStatusListener()
      removeConflictListener()
    }
  }, [])

  const handleClick = (): void => {
    if (status === 'syncing') return
    window.api.syncStart()
  }

  const getIcon = (): React.ReactElement => {
    switch (status) {
      case 'syncing':
        return <LoadingOutlined spin style={{ color: '#1890ff' }} />
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
      default:
        return <CloudSyncOutlined style={{ color: '#8c8c8c' }} />
    }
  }

  const getTooltip = (): string => {
    switch (status) {
      case 'syncing':
        return '同步中...'
      case 'success':
        return '同步成功'
      case 'error':
        return `同步失败: ${error}`
      default:
        if (conflicts.length > 0) {
          return `${conflicts.length} 个冲突待解决`
        }
        return '点击同步'
    }
  }

  return (
    <div
      onClick={handleClick}
      style={{
        cursor: status === 'syncing' ? 'default' : 'pointer',
        padding: '4px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '12px',
        color: '#8c8c8c',
        borderRadius: '4px',
        transition: 'background-color 0.2s'
      }}
      title={getTooltip()}
    >
      {getIcon()}
      {conflicts.length > 0 && (
        <span style={{ color: '#faad14', fontSize: '11px' }}>
          {conflicts.length}
        </span>
      )}
    </div>
  )
}
