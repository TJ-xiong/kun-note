import React from 'react'

const TitleBar: React.FC = () => {
  return (
    <div className="titlebar">
      {/* <button
        className="titlebar-btn"
        onClick={() => window.electron.ipcRenderer.send('window-minimize')}
      >
        —
      </button> */}
    </div>
  )
}

export default TitleBar
