import { app, shell, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { animateWindowY, isCursorInsideWindow, isCursorNearTopOfWindow } from './utils/animation'
import { Note } from '../types/note'

let isAnimating = false // 动画标志
let isHidden = false // 窗口状态标志
let hideTimer: NodeJS.Timeout | null = null // 隐藏定时器
let mainWindow: BrowserWindow | null = null
// 数据库路径（放在用户数据目录）
const dbPath = path.join(app.getPath('userData'), 'notes.db')
console.log(dbPath)
// 确保目录存在
fs.mkdirSync(path.dirname(dbPath), { recursive: true })
// 初始化数据库
const db = new Database(dbPath)

// 建表：id, title, content, updatedAt
db.prepare(
  `CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT,
    updatedAt INTEGER
  )`
).run()

// 插入/更新笔记
ipcMain.handle('save-note', (event, { id, title, content }): Note => {
  const now = Date.now()
  if (id) {
    db.prepare(`UPDATE notes SET title=?, content=?, updatedAt=? WHERE id=?`).run(
      title,
      content,
      now,
      id
    )
    return db.prepare(`SELECT * FROM notes WHERE id=?`).get(id)
  } else {
    const result = db
      .prepare(`INSERT INTO notes (title, content, updatedAt) VALUES (?, ?, ?)`)
      .run(title, content, now)
    return db.prepare(`SELECT * FROM notes WHERE id=?`).get(result.lastInsertRowid)
  }
})

// 获取单个笔记
ipcMain.handle('get-note', (event, id): Note => {
  return db.prepare(`SELECT * FROM notes WHERE id=?`).get(id)
})

// 获取所有笔记（仅 id 和标题）
ipcMain.handle('list-notes', (): Note[] => {
  return db.prepare(`SELECT id, title, updatedAt FROM notes`).all() // ORDER BY updatedAt DESC
})

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 360,
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

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('moved', () => {
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

  let lastBounds = mainWindow.getBounds()

  mainWindow.on('will-resize', (event, newBounds) => {
    const oldBounds = lastBounds

    // 如果左边或上边发生变化 → 拦截
    const deltaX = newBounds.x - oldBounds.x
    const deltaY = newBounds.y - oldBounds.y

    if (deltaX !== 0 || deltaY !== 0) {
      event.preventDefault()
      return
    }

    // ✅ 只允许右边和下边缩放，更新 lastBounds
    lastBounds = newBounds
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
  if (!mainWindow) return
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
        if (!mainWindow) return
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
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', (event: Electron.IpcMainEvent, title: string) => console.log('pong', title))

  ipcMain.on('window-minimize', () => {
    mainWindow?.minimize()
  })

  ipcMain.on('window-close', () => {
    mainWindow?.close()
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
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
