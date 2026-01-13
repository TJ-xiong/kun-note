import { get } from '@renderer/utils/request-methods'

export function demo(): void {
  get<unknown>('/api/captchaImage').then((res) => {
    console.log(res)
  })
}
