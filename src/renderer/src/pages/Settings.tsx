import React, { useState, useEffect } from 'react'

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

  useEffect(() => {
    // 加载设置
    window.api.getSettings().then((s: AppSettings) => {
      setSettings(s)
    })
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

  return (
    <div className="main">
      <div className="titlebar">
        <div style={{ flex: 1 }}></div>
      </div>
      <div style={{ padding: '20px', height: 'calc(100vh - var(--titlebar-height))', backgroundColor: '#f0f0f0', overflowY: 'auto' }}>
        <h1>Settings</h1>
        <div style={{ marginTop: '20px' }}>
          <h2>General Settings</h2>
          <div style={{ marginBottom: '15px' }}>
            <label>Auto-save: </label>
            <input type="checkbox" defaultChecked={true} />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label>Dark Mode: </label>
            <input type="checkbox" />
          </div>
        </div>
        <div style={{ marginTop: '30px' }}>
          <h2>Window Settings</h2>
          <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: 'white', borderRadius: '6px' }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={settings.autoHideOnMouseLeave}
                  onChange={(e) => handleAutoHideChange(e.target.checked)}
                />
                Enable auto-hide when mouse leaves
              </label>
              <p style={{ fontSize: '12px', color: '#666', marginLeft: '26px', marginTop: '4px' }}>
                When enabled, the window will automatically hide after the specified delay when the mouse leaves the window area while at the top of the screen.
              </p>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>
                Hide delay (ms): {settings.hideDelay}
              </label>
              <input
                type="range"
                min="1000"
                max="10000"
                step="500"
                value={settings.hideDelay}
                onChange={(e) => handleDelayChange(Number(e.target.value))}
                disabled={!settings.autoHideOnMouseLeave}
                style={{ width: '200px' }}
              />
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                {settings.hideDelay / 1000} seconds
              </div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: '30px' }}>
          <h2>Account</h2>
          {!showLogin ? (
            <button 
              style={{
                padding: '8px 16px',
                backgroundColor: '#2f2f2f',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              onClick={() => setShowLogin(true)}
            >
              登录
            </button>
          ) : (
            <div style={{ marginTop: '15px', padding: '15px', backgroundColor: 'white', borderRadius: '6px' }}>
              <h3>登录表单</h3>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>用户名:</label>
                <input 
                  type="text" 
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }} 
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>密码:</label>
                <input 
                  type="password" 
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }} 
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#2f2f2f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  登录
                </button>
                <button 
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ddd',
                    color: 'black',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setShowLogin(false)}
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
        <div style={{ marginTop: '30px' }}>
          <h2>About</h2>
          <p>kun-notes v1.0.0</p>
          <p>A simple note-taking application built with Electron and React.</p>
        </div>
      </div>
    </div>
  )
}

export default Settings
