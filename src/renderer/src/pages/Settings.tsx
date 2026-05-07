import React, { useState, useEffect } from 'react'
import type { UserInfo } from '../../../types/auth'
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

  useEffect(() => {
    window.api.getSettings().then((s: AppSettings) => {
      setSettings(s)
    })
    window.api
      .authGetUser()
      .then(setUser)
      .catch(() => {})
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
                <div className="settings-item-label">同步状态</div>
                <div className="settings-item-desc">
                  {user ? '已登录，笔记可同步至云端' : '登录后可开启云端同步'}
                </div>
              </div>
              <button
                className="settings-login-btn"
                onClick={() => window.api.syncStart()}
                disabled={!user}
                style={{ opacity: user ? 1 : 0.5 }}
              >
                立即同步
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
      </div>
    </div>
  )
}

export default Settings
