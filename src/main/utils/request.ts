import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { HttpRequestConfig } from '../../types/http'

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

const service: AxiosInstance = axios.create({
  baseURL: 'https://kun.mtjx.top',
  timeout: 10_000
})

/**
 * 请求拦截
 */
service.interceptors.request.use((config) => {
  // 示例：统一加 token
  // const token = getTokenSomehow()
  // if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/**
 * 响应拦截
 */
service.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    return Promise.reject(
      new Error(
        error?.response?.data?.message ?? error?.response?.data?.msg ?? error.message ?? '网络错误'
      )
    )
  }
)

/**
 * 通用 request
 */
export async function request<T = unknown>(config: HttpRequestConfig): Promise<ApiResponse<T> | T> {
  const response = await service.request<ApiResponse<T>>(config)
  return response.data
}
