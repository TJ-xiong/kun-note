import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import React from 'react'

interface TitleBarProps {
  sliderMenuShow: boolean // 父组件传递的sliderMenuShow状态
  onSliderMenuShowChange: (show: boolean) => void // 父组件回调
  onAddNote: () => void // 父组件回调
}

const TitleBar: React.FC<TitleBarProps> = ({
  sliderMenuShow,
  onSliderMenuShowChange,
  onAddNote
}) => {
  return (
    <div className="titlebar">
      <div style={{ flex: 1 }}>
        <button className="titlebar-btn" onClick={() => onSliderMenuShowChange(!sliderMenuShow)}>
          {sliderMenuShow ? (
            <MenuFoldOutlined style={{ color: '#fff', cursor: 'pointer' }} />
          ) : (
            <MenuUnfoldOutlined />
          )}
        </button>
      </div>
      <button className="titlebar-btn" onClick={onAddNote}>
        +
      </button>
    </div>
  )
}

export default TitleBar
