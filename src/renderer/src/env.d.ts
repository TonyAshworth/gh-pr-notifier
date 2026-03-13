/// <reference types="vite/client" />

import type { PR, Label } from './types'
import type { Settings } from './types'

interface DeviceFlowResult {
  userCode: string
  verificationUri: string
  deviceCode: string
  interval: number
  expiresIn: number
}

declare global {
  interface Window {
    api: {
      getPRs(): Promise<PR[]>
      getSettings(): Promise<Settings>
      saveSettings(s: Partial<Settings>): Promise<void>
      validateToken(token: string): Promise<{ valid: boolean; login: string }>
      saveToken(token: string): Promise<void>
      clearToken(): Promise<void>
      hasToken(): Promise<boolean>
      fetchRepoLabels(repo: string): Promise<Label[]>
      validateRepo(repo: string): Promise<boolean>
      getUnreadCount(): Promise<number>
      openPR(url: string): Promise<void>
      refreshNow(): Promise<void>
      markAllRead(): Promise<void>
      startDeviceFlow(): Promise<DeviceFlowResult>
      pollDeviceFlow(
        deviceCode: string,
        intervalSeconds: number
      ): Promise<{ login: string } | { error: string }>
      onPRsUpdated(cb: (prs: PR[]) => void): () => void
      onUnreadCountChanged(cb: (n: number) => void): () => void
    }
  }
}
