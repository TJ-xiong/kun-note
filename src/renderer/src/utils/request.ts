import { HttpRequestConfig } from '../../../types/http'

export function request<T = unknown>(config: HttpRequestConfig): Promise<T> {
  return window.api.request(config)
}
