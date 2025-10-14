// // useContextMenu.ts
// import { useDispatch } from 'react-redux'
// import { showMenu, MenuItem } from '@renderer/state'
//
// export function useContextMenu(): {
//   bind: { onContextMenu: (e: React.MouseEvent, items: MenuItem[]) => void }
// } {
//   const dispatch = useDispatch()
//
//   function onContextMenu(e: React.MouseEvent, items: MenuItem[]): void {
//     e.preventDefault()
//     const posX = Math.min(e.pageX, window.innerWidth - 160)
//     const posY = Math.min(e.pageY, window.innerHeight - 200)
//     dispatch(showMenu({ x: posX, y: posY, items }))
//   }
//
//   return { bind: { onContextMenu } }
// }


// hooks/useContextMenu.ts
import { useDispatch } from 'react-redux'
import { showMenu } from '@renderer/state/menuSlice'

// 全局缓存点击回调
const menuCallbacks: Record<string, () => void> = {}

export function useContextMenu() {
  const dispatch = useDispatch()

  function onContextMenu(
    e: React.MouseEvent,
    items: { label: string; onClick: () => void; divider?: boolean; disabled?: boolean }[]
  ) {
    e.preventDefault()

    // 注册回调函数
    const serializedItems = items.map((item, index) => {
      const id = `menu-${Date.now()}-${index}`
      menuCallbacks[id] = item.onClick
      return {
        id,
        label: item.label,
        divider: item.divider,
        disabled: item.disabled
      }
    })

    const posX = Math.min(e.pageX, window.innerWidth - 160)
    const posY = Math.min(e.pageY, window.innerHeight - 200)

    dispatch(showMenu({ x: posX, y: posY, items: serializedItems }))
  }

  return { bind: { onContextMenu } }
}

// 供菜单组件触发回调使用
export function triggerMenuCallback(id: string) {
  const cb = menuCallbacks[id]
  if (cb) cb()
}
