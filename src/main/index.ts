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
import './ipc/auth'

let isAnimating = false // 动画标志
let isHidden = false // 窗口状态标志
let hideTimer: NodeJS.Timeout | null = null // 隐藏定时器
let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null // 系统托盘图标
let lastBounds: Electron.Rectangle | null = null // 窗口隐藏前的位置缓存
const windows = new Map<string, BrowserWindow>() // 跟踪所有打开的窗口
// 设置相关
interface AppSettings {
  autoHideOnMouseLeave: boolean
  hideDelay: number // 毫秒
}
const defaultSettings: AppSettings = {
  autoHideOnMouseLeave: true,
  hideDelay: 3000
}
let appSettings: AppSettings = { ...defaultSettings }
// 设置文件路径
const settingsPath = path.join(app.getPath('userData'), 'settings.json')

function loadSettings(): void {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf-8')
      appSettings = { ...defaultSettings, ...JSON.parse(data) }
    }
  } catch (e) {
    console.error('Failed to load settings:', e)
  }
}

function saveSettings(): void {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(appSettings, null, 2))
  } catch (e) {
    console.error('Failed to save settings:', e)
  }
}

// 数据库路径（放在用户数据目录）
const dbPath = path.join(app.getPath('userData'), 'notes.db')
console.log(dbPath)
// 确保目录存在
fs.mkdirSync(path.dirname(dbPath), { recursive: true })
// 初始化数据库
const db = new Database(dbPath)

// 检查并修复数据库结构
function checkDatabaseSchema(): void {
  // 检查表是否存在
  const tableExists = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='notes'`)
    .get()
  if (!tableExists) {
    // 表不存在，创建新表
    console.log('[DB] Creating notes table...')
    db.prepare(
      ` CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT,
        content TEXT,
        type TEXT,
        parentId TEXT,
        createdAt INTEGER,
        updatedAt INTEGER,
        isPinned INTEGER DEFAULT 0
      )`
    ).run()
    console.log('[DB] Notes table created.')
    return
  }

  // 表存在，检查字段
  console.log('[DB] Checking notes table schema...')
  const columns = db.prepare(`PRAGMA table_info(notes)`).all() as { name: string }[]
  const columnNames = columns.map((col) => col.name)

  // 需要的字段列表
  const requiredColumns: { name: string; sql: string }[] = [
    { name: 'isPinned', sql: 'isPinned INTEGER DEFAULT 0' }
  ]

  // 检查并添加缺失的字段
  for (const col of requiredColumns) {
    if (!columnNames.includes(col.name)) {
      console.log(`[DB] Adding missing column: ${col.name}`)
      db.prepare(`ALTER TABLE notes ADD COLUMN ${col.sql}`).run()
      console.log(`[DB] Column ${col.name} added.`)
    }
  }
  console.log('[DB] Database schema check complete.')
}

// 初始化时检查数据库结构
checkDatabaseSchema()

// 插入/更新笔记
ipcMain.handle('save-note', (_event, { id, title, content, type, parentId, isPinned }): Note => {
  const now = Date.now()
  if (id) {
    db.prepare(
      `UPDATE notes SET title=?, content=?, updatedAt=?, type=?, parentId=?, isPinned=? WHERE id=?`
    ).run(title, content, now, type, parentId, isPinned ? 1 : 0, id)
    return db.prepare(`SELECT * FROM notes WHERE id=?`).get(id) as Note
  } else {
    const id = uuidv4() // 生成唯一id
    db.prepare(
      `INSERT INTO notes (id, title, content, createdAt, updatedAt, type, parentId, isPinned) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, title, content, now, now, type, parentId, isPinned ? 1 : 0)
    return db.prepare(`SELECT * FROM notes WHERE id=?`).get(id) as Note
  }
})

// 获取单个笔记
ipcMain.handle('get-note', (_event, id): Note => {
  return db.prepare(`SELECT * FROM notes WHERE id=?`).get(id) as Note
})

// 获取所有笔记（仅 id 和标题）
ipcMain.handle('list-notes', (): Note[] => {
  return db
    .prepare(`SELECT id, title, updatedAt, type, parentId, isPinned FROM notes`)
    .all() as Note[]
})

// 根据 parentId 获取笔记
ipcMain.handle('list-notes-by-parent', (_event, parentId: string): Note[] => {
  return db
    .prepare(`SELECT id, title, updatedAt, type, parentId, isPinned FROM notes WHERE parentId=?`)
    .all(parentId) as Note[]
})

// 搜索笔记（模糊查询标题、内容、文件夹名）
ipcMain.handle('search-notes', (_event, keyword: string): Note[] => {
  const pattern = `%${keyword}%`
  return db
    .prepare(
      `SELECT id, title, content, updatedAt, type, parentId FROM notes
       WHERE title LIKE ? OR content LIKE ?
       ORDER BY updatedAt DESC`
    )
    .all(pattern, pattern) as Note[]
})

// 删除笔记
ipcMain.handle('delete-note', (_event, id): number => {
  const result = db.prepare(`DELETE FROM notes WHERE id=?`).run(id)
  return result.changes
})

// 切换置顶状态
ipcMain.handle('toggle-pin', (_event, id: string): Note => {
  const note = db.prepare(`SELECT * FROM notes WHERE id=?`).get(id) as Note
  if (!note) throw new Error('Note not found')
  const newPinned = note.isPinned ? 0 : 1
  db.prepare(`UPDATE notes SET isPinned=? WHERE id=?`).run(newPinned, id)
  return db.prepare(`SELECT * FROM notes WHERE id=?`).get(id) as Note
})

// 处理透明区域点击穿透
ipcMain.handle('handle-transparent', (_event, isTransparent: boolean): void => {
  if (isTransparent) {
    mainWindow?.setIgnoreMouseEvents(true, { forward: true })
  } else {
    mainWindow?.setIgnoreMouseEvents(false)
  }
})

// 保存图片到用户数据目录并返回相对路径（./images/xxx）
ipcMain.handle('save-image', async (_event, dataUrl: string): Promise<string> => {
  const m = dataUrl.match(/^data:(image\/(png|jpeg|jpg|gif|webp));base64,(.+)$/i)
  if (!m) throw new Error('Unsupported data URL')
  const ext = m[2] === 'jpg' ? 'jpeg' : m[2]
  const base64 = m[3]
  const buffer = Buffer.from(base64, 'base64')
  const imagesDir = path.join(app.getPath('userData'), 'images')
  fs.mkdirSync(imagesDir, { recursive: true })
  const filename = `${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`
  const filePath = path.join(imagesDir, filename)
  fs.writeFileSync(filePath, buffer)
  // 返回相对路径，便于同步/迁移
  return `./images/${filename}`
})

// 获取图片目录的绝对路径
ipcMain.handle('get-images-dir', () => {
  const imagesDir = path.join(app.getPath('userData'), 'images')
  fs.mkdirSync(imagesDir, { recursive: true })
  return imagesDir
})

// 读取图片为 data URL（用于在 dev 环境避免 file:/// 受限）
ipcMain.handle('get-image-data-url', (_event, rel: string): string => {
  const name = String(rel || '')
    .replace(/^\.\/images\//, '')
    .replace(/^images\//, '')
  if (!/^[\w.-]+$/.test(name)) {
    throw new Error('Invalid image name')
  }
  const imagesDir = path.join(app.getPath('userData'), 'images')
  const abs = path.join(imagesDir, name)
  if (!fs.existsSync(abs)) throw new Error('Image not found')
  const buf = fs.readFileSync(abs)
  const ext = path.extname(name).slice(1).toLowerCase() || 'png'
  const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`
  return `data:${mime};base64,${buf.toString('base64')}`
})

function createWindow(page: string = 'main'): BrowserWindow {
  // Create the browser window.
  const window = new BrowserWindow({
    icon,
    width: 520,
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
      sandbox: false,
      additionalArguments: [`--page=${page}`]
    }
  })

  // Add window to the set
  windows.set(page, window)

  // Remove window from the set when closed
  window.on('closed', () => {
    windows.delete(page)
  })

  let lastBounds = window.getBounds() // 记录上一次窗口位置

  window.on('ready-to-show', () => {
    window?.show()
  })

  window.on('moved', () => {
    if (window) {
      lastBounds = window.getBounds()
    }
    if (isAnimating || isHidden) return // ✅ 避免重复触发
    const bounds = window?.getBounds()
    // 拖到顶部并松开才触发
    if (bounds && bounds.y <= 0) {
      updateWindowPosition()
    }
  })

  // 鼠标检测展开/收起
  setInterval(() => {
    updateWindowPosition()
  }, 100)

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  window.on('will-resize', (event, newBounds) => {
    if (newBounds.x !== lastBounds.x || newBounds.y !== lastBounds.y) {
      event.preventDefault()
    }
  })

  window.on('resize', () => {
    if (!window) return
    lastBounds = window.getBounds()
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
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
    // 鼠标离开 → 启动延迟隐藏（如果启用）
    if (!hideTimer && appSettings.autoHideOnMouseLeave) {
      hideTimer = setTimeout(() => {
        if (!mainWindow || mainWindow.isDestroyed()) return // ✅ 窗口已销毁
        // 再次确认鼠标是否还在外面
        const cur = screen.getCursorScreenPoint()
        const b = mainWindow.getBounds()
        if (!isCursorInsideWindow(cur, b) && b.y <= 0) {
          hideWindowSmooth()
        }
        hideTimer = null
      }, appSettings.hideDelay)
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

// 单实例锁：防止重复打开窗口
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    // 用户再次点击应用图标时，聚焦已有窗口
    if (!mainWindow || mainWindow.isDestroyed()) return
    const bounds = mainWindow.getBounds()
    const isOffScreen = bounds.x === 9999 && bounds.y === 9999
    if (isOffScreen && lastBounds) {
      mainWindow.setBounds(lastBounds)
    }
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
  })

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.

  // 加载设置
  loadSettings()

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

    // 设置相关 IPC handlers
    ipcMain.handle('get-settings', (): AppSettings => {
      return appSettings
    })

    ipcMain.handle('save-settings', (_event, settings: Partial<AppSettings>): AppSettings => {
      appSettings = { ...appSettings, ...settings }
      saveSettings()
      return appSettings
    })

    // IPC handler for creating new windows
    ipcMain.handle('open-or-close-window', (_event, page: string) => {
      const win = windows.get(page)
      if (win) {
        win.close()
      } else {
        createWindow(page)
      }
    })

    // ipcMain.on('window-minimize', () => {
    //   mainWindow?.minimize()
    // })

    // ipcMain.on('window-close', () => {
    //   mainWindow?.close()
    // })

    mainWindow = createWindow('main')

    // 创建托盘图标
    const iconPath = path.join(icon) // 建议用 16x16 或 32x32 PNG
    tray = new Tray(iconPath) // 设置托盘图标的菜单

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
} // end of single-instance else block
