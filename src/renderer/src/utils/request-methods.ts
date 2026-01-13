import { request } from './request'

export function get<T>(url: string, params?: object): Promise<T> {
  return request<T>({
    url,
    method: 'GET',
    params
  })
}

export function post<T>(url: string, data?: object): Promise<T> {
  return request<T>({
    url,
    method: 'POST',
    data
  })
}

export function put<T>(url: string, data?: object): Promise<T> {
  return request<T>({
    url,
    method: 'PUT',
    data
  })
}

export function del<T>(url: string, params?: object): Promise<T> {
  return request<T>({
    url,
    method: 'DELETE',
    params
  })
}
