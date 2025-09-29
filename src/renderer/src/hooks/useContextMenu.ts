// useContextMenu.ts
import { useDispatch } from 'react-redux'
import { showMenu, MenuItem } from '@renderer/state'

export function useContextMenu(): {
  bind: { onContextMenu: (e: React.MouseEvent, items: MenuItem[]) => void }
} {
  const dispatch = useDispatch()

  function onContextMenu(e: React.MouseEvent, items: MenuItem[]): void {
    e.preventDefault()
    const posX = Math.min(e.pageX, window.innerWidth - 160)
    const posY = Math.min(e.pageY, window.innerHeight - 200)
    dispatch(showMenu({ x: posX, y: posY, items }))
  }

  return { bind: { onContextMenu } }
}
