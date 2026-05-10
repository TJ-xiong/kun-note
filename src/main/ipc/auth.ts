import { ipcMain } from 'electron'
import log from '../utils/logger'
import { setTokens, clearTokens } from '../utils/auth-store'
import { request, USER_API_URL } from '../utils/request'
import { LoginResponse, UserInfo } from '../../types/auth'
const CLIENT_ID = 'kun_note'
const CLIENT_SECRET = 'kun_note'

ipcMain.handle(
  'auth-login',
  async (_event, username: string, password: string): Promise<LoginResponse> => {
    log.info(`[Auth] User login: ${username}`)
    const data = await request<LoginResponse>({
      url: `${USER_API_URL}/login`,
      method: 'POST',
      data: { username, password, client_id: CLIENT_ID, client_secret: CLIENT_SECRET }
    })
    const resp = data as LoginResponse
    setTokens(resp.access_token, resp.refresh_token)
    log.info('[Auth] Login successful, token saved')
    return resp
  }
)

ipcMain.handle('auth-logout', async (): Promise<void> => {
  log.info('[Auth] User logout')
  try {
    await request({ url: `${USER_API_URL}/logout`, method: 'POST' })
  } catch {
    // ignore logout errors
  }
  clearTokens()
  log.info('[Auth] Logout completed, token cleared')
})

ipcMain.handle('auth-get-user', async (): Promise<UserInfo> => {
  log.info('[Auth] Getting user info')
  const data = await request<UserInfo>({
    url: `${USER_API_URL}/users/me`,
    method: 'GET'
  })
  return data as UserInfo
})
