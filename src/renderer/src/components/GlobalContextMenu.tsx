import React, { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@renderer/state/menuStore'
import { hideMenu } from '@renderer/state/menuSlice'
import { triggerMenuCallback } from '@renderer/hooks/useContextMenu'

const GlobalContextMenu: React.FC = () => {
  const dispatch = useDispatch()
  const { visible, position, items } = useSelector((state: RootState) => state.menu)
  const menuRef = useRef<HTMLDivElement>(null)

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

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [visible, dispatch])

  if (!visible) return null

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        background: '#ffffff',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: 8,
        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12), 0 3px 6px rgba(0, 0, 0, 0.08)',
        padding: 4,
        zIndex: 9999,
        minWidth: 140,
        animation: 'contextMenuIn 0.12s ease-out'
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <style>{`
        @keyframes contextMenuIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .context-menu-item {
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 13px;
          color: #1d1d1f;
          cursor: pointer;
          transition: background 0.15s ease;
          user-select: none;
          white-space: nowrap;
        }
        .context-menu-item:hover {
          background: #e8f0fe;
        }
        .context-menu-item--disabled {
          cursor: not-allowed;
          opacity: 0.4;
        }
        .context-menu-item--danger {
          color: #e74c3c;
        }
        .context-menu-item--danger:hover {
          background: #fdf0ef;
        }
        .context-menu-divider {
          height: 1px;
          background: rgba(0, 0, 0, 0.06);
          margin: 4px 8px;
        }
      `}</style>
      {items.map((item) =>
        item.divider ? (
          <div key={item.id} className="context-menu-divider" />
        ) : (
          <div
            key={item.id}
            className={`context-menu-item${item.disabled ? ' context-menu-item--disabled' : ''}${item.label === '删除' ? ' context-menu-item--danger' : ''}`}
            onClick={() => {
              if (!item.disabled) {
                triggerMenuCallback(item.id)
                dispatch(hideMenu())
              }
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
