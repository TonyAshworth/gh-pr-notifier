import { shell } from 'electron'
import { saveToken } from './keychain'

declare const GITHUB_CLIENT_ID: string

interface DeviceCodeResponse {
  device_code: string
  user_code: string
  verification_uri: string
  expires_in: number
  interval: number
}

interface TokenResponse {
  access_token?: string
  error?: string
  error_description?: string
}

export interface DeviceFlowStart {
  userCode: string
  verificationUri: string
  deviceCode: string
  interval: number
  expiresIn: number
}

export async function startDeviceFlow(): Promise<DeviceFlowStart> {
  const clientId = GITHUB_CLIENT_ID
  if (!clientId) throw new Error('GITHUB_CLIENT_ID not configured')

  const response = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ client_id: clientId, scope: 'repo notifications' })
  })

  if (!response.ok) throw new Error(`Device flow init failed: ${response.status}`)
  const data = (await response.json()) as DeviceCodeResponse

  shell.openExternal(data.verification_uri)

  return {
    userCode: data.user_code,
    verificationUri: data.verification_uri,
    deviceCode: data.device_code,
    interval: data.interval,
    expiresIn: data.expires_in
  }
}

export async function pollDeviceFlow(
  deviceCode: string,
  intervalSeconds: number,
  onComplete: (login: string) => void,
  onError: (err: string) => void
): Promise<() => void> {
  const clientId = GITHUB_CLIENT_ID
  let active = true

  const poll = async (): Promise<void> => {
    if (!active) return

    try {
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          client_id: clientId,
          device_code: deviceCode,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
        })
      })

      const data = (await response.json()) as TokenResponse

      if (data.access_token) {
        saveToken(data.access_token)
        const userResp = await fetch('https://api.github.com/user', {
          headers: { authorization: `bearer ${data.access_token}` }
        })
        const user = (await userResp.json()) as { login: string }
        onComplete(user.login)
        return
      }

      if (data.error === 'authorization_pending' || data.error === 'slow_down') {
        const nextInterval = data.error === 'slow_down' ? intervalSeconds + 5 : intervalSeconds
        if (active) setTimeout(poll, nextInterval * 1000)
        return
      }

      if (data.error === 'expired_token') {
        onError('Device code expired. Please try again.')
        return
      }

      onError(data.error_description || 'Authorization failed')
    } catch (err) {
      if (active) onError(String(err))
    }
  }

  setTimeout(poll, intervalSeconds * 1000)

  return () => {
    active = false
  }
}
