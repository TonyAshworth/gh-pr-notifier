/// <reference types="vite/client" />

import type { PR, Label } from './types'
import type { Settings } from './types'

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
      fetchUserRepos(): Promise<string[]>
      fetchRepoLabels(repo: string): Promise<Label[]>
      validateRepo(repo: string): Promise<boolean>
      getUnreadCount(): Promise<number>
      openPR(url: string): Promise<void>
      refreshNow(): Promise<void>
      markAllRead(): Promise<void>
      quit(): Promise<void>
      resizePopover(height: number): Promise<void>
      getViewedPRs(): Promise<Record<string, string>>
      markPRViewed(key: string, updatedAt: string): Promise<void>
      resetViewedPRs(): Promise<void>
      onPRsUpdated(cb: (prs: PR[]) => void): () => void
      onUnreadCountChanged(cb: (n: number) => void): () => void
      onPlaySound(cb: () => void): () => void
      getLaunchAtLogin(): Promise<boolean>
      setLaunchAtLogin(enable: boolean): Promise<void>
      onPRViewed(cb: (key: string, updatedAt: string) => void): () => void
    }
  }
}
