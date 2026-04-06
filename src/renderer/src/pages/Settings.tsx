import React from 'react'

const Settings: React.FC = () => {
  return (
    <div style={{ padding: '20px', height: '100vh', backgroundColor: '#f0f0f0' }}>
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
        <h2>About</h2>
        <p>kun-notes v1.0.0</p>
        <p>A simple note-taking application built with Electron and React.</p>
      </div>
    </div>
  )
}

export default Settings
