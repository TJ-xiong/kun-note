import React from 'react'

interface TitleBarProps {
  onAddNote: () => void // 父组件回调
}

const TitleBar: React.FC<TitleBarProps> = ({ onAddNote }) => {
  return (
    <div className="titlebar">
      <button className="titlebar-btn" onClick={onAddNote}>
        +
      </button>
    </div>
  )
}

export default TitleBar
