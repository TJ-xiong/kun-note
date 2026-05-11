import { BrowserWindow } from 'electron'
import type { Rectangle, Point } from 'electron'

/**
 * 判断鼠标是否在窗口范围内
 */
export function isCursorInsideWindow(cursor: Point, bounds: Rectangle): boolean {
  return (
    cursor.x >= bounds.x &&
    cursor.x <= bounds.x + bounds.width &&
    cursor.y >= bounds.y &&
    cursor.y <= bounds.y + bounds.height
  )
}

/**
 * 判断鼠标是否靠近窗口顶部（默认 5px 范围内）
 */
export function isCursorNearTopOfWindow(cursor: Point, bounds: Rectangle, edgeSize = 5): boolean {
  return cursor.y <= edgeSize && cursor.x >= bounds.x && cursor.x <= bounds.x + bounds.width
}

export function animateWindowY(
  win: BrowserWindow,
  targetY: number,
  duration = 200,
  updateAnimating: (state: boolean) => void,
  callback: () => void
): void {
  updateAnimating(true)
  const bounds = win.getBounds()
  const startY = bounds.y
  const distance = targetY - startY
  const steps = 20 // 减少帧数，20 帧足够流畅
  const stepTime = duration / steps
  let currentStep = 0

  const tick = (): void => {
    currentStep++
    const progress = currentStep / steps
    const newY = Math.round(startY + distance * progress)

    // 只设置位置，不设置宽高，开销更小
    win.setPosition(bounds.x, newY)

    if (currentStep >= steps) {
      updateAnimating(false)
      callback && callback()
    } else {
      setTimeout(tick, stepTime)
    }
  }

  // 首帧立即执行
  tick()
}
