import { ipcMain } from 'electron'
import { request } from '../utils/request'

ipcMain.handle('http-request', async (_event, config) => {
  // ✅ 请求白名单
  if (!config?.url?.startsWith('/api/')) {
    throw new Error('非法请求地址')
  }

  // 可选：method 白名单
  const allowMethods = ['GET', 'POST', 'PUT', 'DELETE']
  if (config.method && !allowMethods.includes(config.method.toUpperCase())) {
    throw new Error('非法请求方法')
  }

  return request(config)
})
