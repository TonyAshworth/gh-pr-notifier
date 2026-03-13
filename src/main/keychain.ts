import { safeStorage } from 'electron'
import { store } from './store'

export function saveToken(token: string): void {
  const encrypted = safeStorage.encryptString(token)
  store.set('encryptedToken', encrypted.toString('base64'))
}

export function loadToken(): string | null {
  const encoded = store.get('encryptedToken')
  if (!encoded) return null
  try {
    const buffer = Buffer.from(encoded, 'base64')
    return safeStorage.decryptString(buffer)
  } catch {
    return null
  }
}

export function clearToken(): void {
  store.delete('encryptedToken')
}

export function hasToken(): boolean {
  return !!store.get('encryptedToken')
}
