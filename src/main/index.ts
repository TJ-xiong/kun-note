import { app, shell, BrowserWindow, ipcMain, screen, Tray, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { animateWindowY, isCursorInsideWindow, isCursorNearTopOfWindow } from './utils/animation'
import { Note } from '../types/note'
import { v4 as uuidv4 } from 'uuid'
import './ipc/request'

let isAnimating = false // 动画标志
let isHidden = false // 窗口状态标志
let hideTimer: NodeJS.Timeout | null = null // 隐藏定时器
let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null // 系统托盘图标
// 数据库路径（放在用户数据目录）
const dbPath = path.join(app.getPath('userData'), 'notes.db')
console.log(dbPath)
// 确保目录存在
fs.mkdirSync(path.dirname(dbPath), { recursive: true })
// 初始化数据库
const db = new Database(dbPath)

// 建表：id, title, content, updatedAt, type, parent_id
db.prepare(
  ` CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT,
    content TEXT,
    type TEXT,
    parentId TEXT,
    createdAt INTEGER,
    updatedAt INTEGER
  )`
).run()

// 插入/更新笔记
ipcMain.handle('save-note', (_event, { id, title, content, type, parentId }): Note => {
  const now = Date.now()
  if (id) {
    db.prepare(
      `UPDATE notes SET title=?, content=?, updatedAt=?, type=?, parentId=? WHERE id=?`
    ).run(title, content, now, type, parentId, id)
    return db.prepare(`SELECT * FROM notes WHERE id=?`).get(id) as Note
  } else {
    const id = uuidv4() // 生成唯一id
    db.prepare(
      `INSERT INTO notes (id, title, content, createdAt, updatedAt, type, parentId) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, title, content, now, now, type, parentId)
    return db.prepare(`SELECT * FROM notes WHERE id=?`).get(id) as Note
  }
})

// 获取单个笔记
ipcMain.handle('get-note', (_event, id): Note => {
  return db.prepare(`SELECT * FROM notes WHERE id=?`).get(id) as Note
})

// 获取所有笔记（仅 id 和标题）
ipcMain.handle('list-notes', (): Note[] => {
  return db.prepare(`SELECT id, title, updatedAt, type, parentId FROM notes`).all() as Note[] // ORDER BY updatedAt DESC
})

// 删除笔记
ipcMain.handle('delete-note', (_event, id): number => {
  const result = db.prepare(`DELETE FROM notes WHERE id=?`).run(id)
  return result.changes
})

// 处理透明区域点击穿透
ipcMain.handle('handle-transparent', (_event, isTransparent: boolean): void => {
  if (isTransparent) {
    mainWindow?.setIgnoreMouseEvents(true, { forward: true })
  } else {
    mainWindow?.setIgnoreMouseEvents(false)
  }
})

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    icon,
    width: 460,
    height: 570,
    center: true, // 居中显示
    minWidth: 360,
    minHeight: 100,
    show: false,
    alwaysOnTop: true,
    transparent: true,
    skipTaskbar: true, // 👈 关键参数，隐藏任务栏图标
    autoHideMenuBar: true, // ❌ 隐藏菜单栏
    maximizable: false, // ✅ 禁用最大化(不会触发 maximize 事件)
    frame: false, // ❌ 去掉系统标题栏和按钮
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  let lastBounds = mainWindow.getBounds() // 记录上一次窗口位置

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('moved', () => {
    if (mainWindow) {
      lastBounds = mainWindow.getBounds()
    }
    if (isAnimating || isHidden) return // ✅ 避免重复触发
    const bounds = mainWindow?.getBounds()
    // 拖到顶部并松开才触发
    if (bounds && bounds.y <= 0) {
      updateWindowPosition()
    }
  })

  // 鼠标检测展开/收起
  setInterval(() => {
    updateWindowPosition()
  }, 100)

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  mainWindow.on('will-resize', (event, newBounds) => {
    if (newBounds.x !== lastBounds.x || newBounds.y !== lastBounds.y) {
      event.preventDefault()
    }
  })

  mainWindow.on('resize', () => {
    if (!mainWindow) return
    lastBounds = mainWindow.getBounds()
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function updateWindowPosition(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return // ✅ 窗口已销毁
  if (isAnimating) return // ✅ 动画中不触发
  const cursor = screen.getCursorScreenPoint()
  const bounds = mainWindow.getBounds()
  // 鼠标靠近顶部 → 展开
  if (isCursorNearTopOfWindow(cursor, bounds) && isHidden) {
    showWindowSmooth()
  }
  // 鼠标是否在窗口内
  const insideWindow = isCursorInsideWindow(cursor, bounds)

  if (!insideWindow && !isHidden) {
    // 鼠标离开 → 启动延迟隐藏
    if (!hideTimer) {
      hideTimer = setTimeout(() => {
        if (!mainWindow || mainWindow.isDestroyed()) return // ✅ 窗口已销毁
        // 再次确认鼠标是否还在外面
        const cur = screen.getCursorScreenPoint()
        const b = mainWindow.getBounds()
        if (!isCursorInsideWindow(cur, b) && b.y <= 0) {
          hideWindowSmooth()
        }
        hideTimer = null
      }, 100)
    }
  } else if (insideWindow && isHidden) {
    // 鼠标回来 → 取消隐藏
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
  }
}
// 平滑收起
function hideWindowSmooth(): void {
  if (!mainWindow) return
  const bounds = mainWindow.getBounds()
  animateWindowY(
    mainWindow,
    -(bounds.height - 15),
    200,
    (state: boolean) => {
      isAnimating = state
    },
    () => {
      isHidden = true
    }
  )
}
// 平滑展开
function showWindowSmooth(): void {
  if (!mainWindow) return
  animateWindowY(
    mainWindow,
    0,
    200,
    (state: boolean) => {
      isAnimating = state
    },
    () => {
      isHidden = false
    }
  )
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron.kun-notes')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', (_event: Electron.IpcMainEvent, title: string) => {
    console.log('pong', title)
  })

  // ipcMain.on('window-minimize', () => {
  //   mainWindow?.minimize()
  // })

  // ipcMain.on('window-close', () => {
  //   mainWindow?.close()
  // })

  createWindow()

  // 创建托盘图标
  const iconPath = path.join(icon) // 建议用 16x16 或 32x32 PNG
  tray = new Tray(iconPath) // 设置托盘图标的菜单
  let lastBounds: Electron.Rectangle | null = null

  function showWindow(): void {
    if (!mainWindow || mainWindow.isDestroyed()) return
    // 如果有缓存的窗口位置和大小，恢复
    if (lastBounds) {
      mainWindow.setBounds(lastBounds)
    }
    mainWindow.showInactive()
    mainWindow.focus()
  }

  function hideWindow(): void {
    if (!mainWindow || mainWindow.isDestroyed()) return
    // 缓存当前窗口位置和大小
    lastBounds = mainWindow.getBounds()
    // 移出屏幕模拟隐藏
    mainWindow.setBounds({ x: 9999, y: 9999, width: 0, height: 0 })
  }

  // 托盘菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => showWindow()
    },
    {
      label: '隐藏窗口',
      click: () => hideWindow()
    },
    {
      label: '退出',
      click: () => app.quit()
    }
  ])

  tray.setToolTip('kun-notes')
  tray.setContextMenu(contextMenu)

  // 左键点击托盘图标：切换显隐
  tray.on('click', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    const isHidden = mainWindow.getBounds().x === 9999 && mainWindow.getBounds().y === 9999
    if (isHidden) {
      showWindow()
    } else {
      hideWindow()
    }
  })

  // app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  // if (BrowserWindow.getAllWindows().length === 0) createWindow()
  // })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

app.on('before-quit', () => {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
})
