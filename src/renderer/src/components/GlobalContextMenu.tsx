import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, hideMenu } from '@renderer/state'

const GlobalContextMenu: React.FC = () => {
  const dispatch = useDispatch()
  const { visible, position, items } = useSelector((state: RootState) => state.menu)

  useEffect(() => {
    const handleClick = () => dispatch(hideMenu())
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [dispatch])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: position.y,
        left: position.x,
        background: '#fff',
        border: '1px solid #ccc',
        borderRadius: '6px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        padding: '4px 0',
        zIndex: 1000,
        minWidth: '140px'
      }}
    >
      {items.map((item, index) =>
        item.divider ? (
          <div
            key={index}
            style={{
              height: '1px',
              background: '#eee',
              margin: '4px 0'
            }}
          />
        ) : (
          <div
            key={index}
            onClick={() => {
              if (!item.disabled) {
                item.onClick()
                dispatch(hideMenu())
              }
            }}
            style={{
              padding: '6px 12px',
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              color: item.disabled ? '#aaa' : '#333',
              userSelect: 'none'
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) {
                ;(e.target as HTMLDivElement).style.background = '#f5f5f5'
              }
            }}
            onMouseLeave={(e) => {
              ;(e.target as HTMLDivElement).style.background = 'transparent'
            }}
          >
            {item.label}
          </div>
        )
      )}
    </div>
  )
}

export default GlobalContextMenu
