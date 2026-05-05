export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface UserInfo {
  id: number
  username: string
  email: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
}
