import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { HttpRequestConfig } from '../../types/http'
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './auth-store'

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

// ========== 用户认证服务 ==========
const USER_BASE_URL = 'https://user.mtjx.top'
const USER_API_URL = `${USER_BASE_URL}/api/v1`

const userService: AxiosInstance = axios.create({
  baseURL: USER_BASE_URL,
  timeout: 10_000
})

userService.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const fullUrl = config.url?.startsWith('http') ? config.url : `${config.baseURL}${config.url}`
  console.log(`[HTTP] ${config.method?.toUpperCase()} ${fullUrl}`)
  return config
})

userService.interceptors.response.use(
  (response: AxiosResponse) => {
    const fullUrl = response.config.url?.startsWith('http')
      ? response.config.url
      : `${response.config.baseURL}${response.config.url}`
    console.log(`[HTTP] ${response.status} ${response.config.method?.toUpperCase()} ${fullUrl}`)
    return response
  },
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status
    const errorUrl = originalRequest?.url?.startsWith('http')
      ? originalRequest.url
      : `${originalRequest?.baseURL}${originalRequest?.url}`
    console.warn(
      `[HTTP] Request failed: ${status ?? 'no response'} ${originalRequest?.method?.toUpperCase()} ${errorUrl}`
    )
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = getRefreshToken()
      if (refreshToken) {
        console.log('[HTTP] Trying to refresh token...')
        try {
          const resp = await axios.post(
            `${USER_API_URL}/refresh`,
            { refresh_token: refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
          )
          const { access_token, refresh_token } = resp.data
          setTokens(access_token, refresh_token)
          console.log('[HTTP] Token refreshed successfully')
          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return userService.request(originalRequest)
        } catch (refreshError) {
          console.error('[HTTP] Token refresh failed, clearing local token')
          clearTokens()
        }
      } else {
        console.warn('[HTTP] No refresh_token, skipping refresh')
      }
    }
    const message =
      error?.response?.data?.message ??
      error?.response?.data?.msg ??
      error?.response?.data?.detail ??
      error.message ??
      'Network error'
    console.error(`[HTTP] Error: ${message}`)
    return Promise.reject(new Error(message))
  }
)

// ========== 笔记同步服务（预留） ==========
// const notesService: AxiosInstance = axios.create({
//   baseURL: 'https://notes.mtjx.top',
//   timeout: 10_000
// })
// TODO: 添加笔记服务的拦截器

// ========== 通用请求方法 ==========
export async function request<T = unknown>(config: HttpRequestConfig): Promise<ApiResponse<T> | T> {
  const response = await userService.request<ApiResponse<T>>(config)
  return response.data
}

export { USER_API_URL }

// export async function notesRequest<T = unknown>(config: HttpRequestConfig): Promise<ApiResponse<T> | T> {
//   const response = await notesService.request<ApiResponse<T>>(config)
//   return response.data
// }
