import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@renderer/state/menuStore'
import { hideMenu } from '@renderer/state/menuSlice'
import { triggerMenuCallback } from '@renderer/hooks/useContextMenu'

const GlobalContextMenu: React.FC = () => {
  const dispatch = useDispatch()
  const { visible, position, items } = useSelector((state: RootState) => state.menu)
  const menuRef = useRef<HTMLUListElement>(null)

  // 点击外部关闭
  useEffect(() => {
    if (!visible) return

    function handleClickOutside(e: MouseEvent): void {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        dispatch(hideMenu())
      }
    }

    function handleEsc(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        dispatch(hideMenu())
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)

    // 清理
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [visible, dispatch])

  if (!visible) return null

  return (
    <ul
      ref={menuRef}
      className="context-menu"
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        background: '#fff',
        border: '1px solid #ddd',
        borderRadius: 4,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        listStyle: 'none',
        padding: 4,
        margin: 0,
        zIndex: 9999
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item) =>
        item.divider ? (
          <hr key={item.id} style={{ margin: '4px 0' }} />
        ) : (
          <li
            key={item.id}
            style={{
              padding: '6px 12px',
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              opacity: item.disabled ? 0.5 : 1
            }}
            onClick={() => {
              if (!item.disabled) {
                triggerMenuCallback(item.id)
                dispatch(hideMenu())
              }
            }}
          >
            {item.label}
          </li>
        )
      )}
    </ul>
  )
}

export default GlobalContextMenu
