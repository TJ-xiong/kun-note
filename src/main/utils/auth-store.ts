import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { AuthTokens } from '../../types/auth'

const TOKEN_FILE = path.join(app.getPath('userData'), 'auth-tokens.json')

let cached: AuthTokens | null = null

function load(): AuthTokens | null {
  if (cached !== null) return cached
  try {
    const raw = fs.readFileSync(TOKEN_FILE, 'utf-8')
    cached = JSON.parse(raw)
  } catch {
    cached = null
  }
  return cached
}

function save(tokens: AuthTokens | null): void {
  cached = tokens
  if (tokens) {
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2))
  } else {
    try {
      fs.unlinkSync(TOKEN_FILE)
    } catch {
      // ignore
    }
  }
}

export function getAccessToken(): string | null {
  return load()?.access_token ?? null
}

export function getRefreshToken(): string | null {
  return load()?.refresh_token ?? null
}

export function setTokens(access: string, refresh: string): void {
  save({ access_token: access, refresh_token: refresh })
}

export function clearTokens(): void {
  save(null)
}
