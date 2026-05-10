import log from 'electron-log'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

// 日志目录
const logsDir = path.join(app.getPath('userData'), 'logs')
fs.mkdirSync(logsDir, { recursive: true })

// 文件日志配置
log.transports.file.resolvePathFn = () => path.join(logsDir, 'main.log')
log.transports.file.level = app.isPackaged ? 'info' : 'debug'
log.transports.file.maxSize = 5 * 1024 * 1024 // 5MB
log.transports.file.format = '{y}-{m}-{d} {h}:{i}:{s}.{ms} [{level}] {text}'

// 控制台日志配置
log.transports.console.level = app.isPackaged ? 'info' : 'debug'
log.transports.console.format = '{h}:{i}:{s}.{ms} [{level}] {text}'

export default log
