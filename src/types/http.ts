export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface HttpRequestConfig {
  url: string
  method?: HttpMethod
  params?: unknown
  data?: unknown
  headers?: Record<string, string>
}
