import React, { useState, useEffect } from 'react'
import { LoadingOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import type { UserInfo } from '../../../types/auth'
import type { UpdateStatusEvent, UpdateProgress, UpdateInfo, SyncStatusEvent } from '../../../types/sync'
import './Settings.css'

interface AppSettings {
  autoHideOnMouseLeave: boolean
  hideDelay: number
}

const Settings: React.FC = () => {
  const [showLogin, setShowLogin] = useState(false)
  const [settings, setSettings] = useState<AppSettings>({
    autoHideOnMouseLeave: true,
    hideDelay: 3000
  })
  const [user, setUser] = useState<UserInfo | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // 同步状态
  const [syncStatus, setSyncStatus] = useState<string>('idle')
  const [syncError, setSyncError] = useState('')
  // 版本与更新
  const [version, setVersion] = useState('')
  const [updateStatus, setUpdateStatus] = useState<string>('idle')
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [updateError, setUpdateError] = useState('')
  const [downloadProgress, setDownloadProgress] = useState<UpdateProgress | null>(null)

  useEffect(() => {
    window.api.getSettings().then((s: AppSettings) => {
      setSettings(s)
    })
    window.api
      .authGetUser()
      .then(setUser)
      .catch(() => {})
    // 获取版本号
    window.api.getAppVersion().then(setVersion)
    // 监听同步状态
    const unsubSyncStatus = window.api.onSyncStatus((event: SyncStatusEvent) => {
      setSyncStatus(event.status)
      if (event.error) setSyncError(event.error)
      if (event.status === 'idle') setSyncError('')
    })
    // 监听更新状态
    const unsubStatus = window.api.onUpdateStatus((event: UpdateStatusEvent) => {
      setUpdateStatus(event.status)
      if (event.info) setUpdateInfo(event.info)
      if (event.error) setUpdateError(event.error)
      if (event.status !== 'downloading') setDownloadProgress(null)
    })
    const unsubProgress = window.api.onUpdateProgress((progress: UpdateProgress) => {
      setDownloadProgress(progress)
    })
    return () => {
      unsubSyncStatus()
      unsubStatus()
      unsubProgress()
    }
  }, [])

  const handleAutoHideChange = (checked: boolean) => {
    const newSettings = { ...settings, autoHideOnMouseLeave: checked }
    setSettings(newSettings)
    window.api.saveSettings(newSettings)
  }

  const handleDelayChange = (value: number) => {
    const newSettings = { ...settings, hideDelay: value }
    setSettings(newSettings)
    window.api.saveSettings(newSettings)
  }

  const handleLogin = async (): Promise<void> => {
    if (!username || !password) {
      setError('请输入用户名和密码')
      return
    }
    setLoading(true)
    setError('')
    try {
      await window.api.authLogin(username, password)
      const info = await window.api.authGetUser()
      setUser(info)
      setShowLogin(false)
      setUsername('')
      setPassword('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async (): Promise<void> => {
    try {
      await window.api.authLogout()
    } finally {
      setUser(null)
    }
  }

  const handleSync = async (): Promise<void> => {
    if (syncStatus === 'syncing') return
    setSyncError('')
    try {
      await window.api.syncStart()
    } catch (e) {
      setSyncStatus('error')
      setSyncError(e instanceof Error ? e.message : '同步失败')
    }
  }

  const handleCheckUpdate = async (): Promise<void> => {
    setUpdateError('')
    setUpdateStatus('checking')
    try {
      await window.api.checkForUpdates()
    } catch (e) {
      setUpdateStatus('error')
      setUpdateError(e instanceof Error ? e.message : '检查更新失败')
    }
  }

  const handleDownloadUpdate = async (): Promise<void> => {
    setUpdateStatus('downloading')
    try {
      await window.api.downloadUpdate()
    } catch (e) {
      setUpdateStatus('error')
      setUpdateError(e instanceof Error ? e.message : '下载更新失败')
    }
  }

  const handleInstallUpdate = (): void => {
    window.api.installUpdate()
  }

  return (
    <div className="settings-container">
      {/* 标题栏 */}
      <div className="settings-titlebar">
        <div className="settings-titlebar-drag">
          <span className="settings-title">设置</span>
        </div>
        <button className="settings-close-btn" onClick={() => window.close()}>
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
      <div className="settings-content">
        {/* 窗口设置 */}
        <div className="settings-section">
          <div className="settings-section-header">
            <div className="settings-section-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 3H21V21H3V3Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M3 9H21" stroke="currentColor" strokeWidth="1.5" />
                <path d="M9 21V9" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <h2>窗口设置</h2>
          </div>

          <div className="settings-card">
            {/* 自动隐藏 */}
            <div className="settings-item">
              <div className="settings-item-info">
                <div className="settings-item-label">鼠标离开时自动隐藏</div>
                <div className="settings-item-desc">
                  窗口位于屏幕顶部时，鼠标离开后自动隐藏
                </div>
              </div>
              <label className="settings-switch">
                <input
                  type="checkbox"
                  checked={settings.autoHideOnMouseLeave}
                  onChange={(e) => handleAutoHideChange(e.target.checked)}
                />
                <span className="settings-switch-slider"></span>
              </label>
            </div>

            <div className="settings-divider"></div>

            {/* 隐藏延迟 */}
            <div className="settings-item">
              <div className="settings-item-info">
                <div className="settings-item-label">隐藏延迟</div>
                <div className="settings-item-desc">
                  鼠标离开后等待 {settings.hideDelay / 1000} 秒再隐藏窗口
                </div>
              </div>
              <div className="settings-slider-wrapper">
                <input
                  type="range"
                  className="settings-slider"
                  min="1000"
                  max="10000"
                  step="500"
                  value={settings.hideDelay}
                  onChange={(e) => handleDelayChange(Number(e.target.value))}
                  disabled={!settings.autoHideOnMouseLeave}
                />
                <span className="settings-slider-value">{settings.hideDelay / 1000}s</span>
              </div>
            </div>
          </div>
        </div>

        {/* 数据同步 */}
        <div className="settings-section">
          <div className="settings-section-header">
            <div className="settings-section-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 12C4 7.58172 7.58172 4 12 4C14.2091 4 16.2091 4.84619 17.6569 6.20711"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M20 12C20 16.4183 16.4183 20 12 20C9.79086 20 7.79086 19.1538 6.34315 17.7929"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path d="M16 4L20 4L20 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 20L4 20L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2>数据同步</h2>
          </div>

          <div className="settings-card">
            <div className="settings-item">
              <div className="settings-item-info">
                <div className="settings-item-label">
                  同步状态
                  {syncStatus === 'syncing' && (
                    <span className="settings-sync-badge settings-sync-badge-syncing">
                      <LoadingOutlined spin /> 同步中
                    </span>
                  )}
                  {syncStatus === 'success' && (
                    <span className="settings-sync-badge settings-sync-badge-success">
                      <CheckCircleOutlined /> 同步成功
                    </span>
                  )}
                  {syncStatus === 'error' && (
                    <span className="settings-sync-badge settings-sync-badge-error">
                      <ExclamationCircleOutlined /> 同步失败
                    </span>
                  )}
                </div>
                <div className="settings-item-desc">
                  {!user
                    ? '登录后可开启云端同步'
                    : syncStatus === 'syncing'
                      ? '正在同步笔记数据...'
                      : syncStatus === 'error' && syncError
                        ? syncError
                        : '已登录，笔记可同步至云端'}
                </div>
              </div>
              <button
                className="settings-login-btn"
                onClick={handleSync}
                disabled={!user || syncStatus === 'syncing'}
                style={{ opacity: user && syncStatus !== 'syncing' ? 1 : 0.5 }}
              >
                {syncStatus === 'syncing' ? '同步中...' : '立即同步'}
              </button>
            </div>

            <div className="settings-divider"></div>

            <div className="settings-item">
              <div className="settings-item-info">
                <div className="settings-item-label">回收站</div>
                <div className="settings-item-desc">查看和恢复已删除的笔记</div>
              </div>
              <button
                className="settings-login-btn"
                onClick={() => window.api.openOrCloseWindow('trash')}
              >
                打开回收站
              </button>
            </div>
          </div>
        </div>

        {/* 账户 */}
        <div className="settings-section">
          <div className="settings-section-header">
            <div className="settings-section-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h2>账户</h2>
          </div>

          <div className="settings-card">
            {user ? (
              /* 已登录状态 */
              <div className="settings-user-profile">
                <div className="settings-user-avatar">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="settings-user-info">
                  <div className="settings-user-name">{user.username}</div>
                  <div className="settings-user-email">{user.email}</div>
                </div>
                <button className="settings-logout-btn" onClick={handleLogout}>
                  退出登录
                </button>
              </div>
            ) : !showLogin ? (
              /* 未登录状态 */
              <div className="settings-login-prompt">
                <div className="settings-login-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                    <path
                      d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="settings-login-text">
                  <div className="settings-login-title">登录您的账户</div>
                  <div className="settings-login-desc">登录后可同步笔记数据</div>
                </div>
                <button className="settings-login-btn" onClick={() => setShowLogin(true)}>
                  登录
                </button>
              </div>
            ) : (
              /* 登录表单 */
              <div className="settings-login-form">
                <div className="settings-form-title">登录账户</div>
                {error && <div className="settings-form-error">{error}</div>}
                <div className="settings-form-group">
                  <label className="settings-form-label">用户名</label>
                  <input
                    type="text"
                    className="settings-form-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="请输入用户名"
                    lang="en"
                    autoComplete="username"
                  />
                </div>
                <div className="settings-form-group">
                  <label className="settings-form-label">密码</label>
                  <input
                    type="password"
                    className="settings-form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="请输入密码"
                    lang="en"
                    autoComplete="current-password"
                  />
                </div>
                <div className="settings-form-actions">
                  <button
                    className="settings-form-submit"
                    onClick={handleLogin}
                    disabled={loading}
                  >
                    {loading ? '登录中...' : '登录'}
                  </button>
                  <button
                    className="settings-form-cancel"
                    onClick={() => {
                      setShowLogin(false)
                      setError('')
                      setUsername('')
                      setPassword('')
                    }}
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 关于 */}
        <div className="settings-section">
          <div className="settings-section-header">
            <div className="settings-section-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 8V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="12" cy="15.5" r="0.75" fill="currentColor" />
              </svg>
            </div>
            <h2>关于</h2>
          </div>

          <div className="settings-card">
            {/* 版本信息 */}
            <div className="settings-item">
              <div className="settings-item-info">
                <div className="settings-item-label">当前版本</div>
                <div className="settings-item-desc">
                  kun-notes v{version}
                  {updateStatus === 'not-available' && (
                    <span className="settings-update-latest"> · 已是最新版本</span>
                  )}
                </div>
              </div>
              {updateStatus === 'available' && updateInfo ? (
                <button className="settings-download-btn" onClick={handleDownloadUpdate}>
                  下载更新
                </button>
              ) : updateStatus === 'downloading' ? (
                <span className="settings-update-status-text">下载中...</span>
              ) : updateStatus === 'downloaded' ? (
                <button className="settings-install-btn" onClick={handleInstallUpdate}>
                  立即更新
                </button>
              ) : (
                <button
                  className="settings-login-btn"
                  onClick={handleCheckUpdate}
                  disabled={updateStatus === 'checking'}
                >
                  {updateStatus === 'checking' ? '检查中...' : '检查更新'}
                </button>
              )}
            </div>

            {/* 更新状态详情 */}
            {updateStatus === 'available' && updateInfo && (
              <>
                <div className="settings-divider"></div>
                <div className="settings-item">
                  <div className="settings-item-info">
                    <div className="settings-item-label settings-update-available">
                      发现新版本 v{updateInfo.version}
                    </div>
                    {updateInfo.releaseDate && (
                      <div className="settings-item-desc">
                        发布时间：{new Date(updateInfo.releaseDate).toLocaleDateString('zh-CN')}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* 下载进度 */}
            {updateStatus === 'downloading' && downloadProgress && (
              <>
                <div className="settings-divider"></div>
                <div className="settings-download-progress">
                  <div className="settings-progress-bar">
                    <div
                      className="settings-progress-fill"
                      style={{ width: `${downloadProgress.percent.toFixed(0)}%` }}
                    ></div>
                  </div>
                  <div className="settings-progress-text">
                    {downloadProgress.percent.toFixed(0)}%
                    <span className="settings-progress-speed">
                      {(downloadProgress.bytesPerSecond / 1024 / 1024).toFixed(1)} MB/s
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* 错误信息 */}
            {updateStatus === 'error' && updateError && (
              <>
                <div className="settings-divider"></div>
                <div className="settings-item">
                  <div className="settings-item-info">
                    <div className="settings-item-desc settings-update-error">
                      {updateError}
                    </div>
                  </div>
                  <button className="settings-login-btn" onClick={handleCheckUpdate}>
                    重试
                  </button>
                </div>
              </>
            )}


            {/* 下载完成提示 */}
            {updateStatus === 'downloaded' && (
              <>
                <div className="settings-divider"></div>
                <div className="settings-item">
                  <div className="settings-item-info">
                    <div className="settings-item-desc settings-update-downloaded">
                      新版本已下载完成，点击「立即更新」重启应用
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
