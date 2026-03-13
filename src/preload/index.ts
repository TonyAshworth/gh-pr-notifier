import { contextBridge, ipcRenderer } from 'electron'
import type { PR, Label } from '../main/github'
import type { Settings } from '../main/store'

const api = {
  // Data
  getPRs: (): Promise<PR[]> => ipcRenderer.invoke('get-prs'),
  getSettings: (): Promise<Settings> => ipcRenderer.invoke('get-settings'),
  saveSettings: (s: Partial<Settings>): Promise<void> => ipcRenderer.invoke('save-settings', s),
  validateToken: (token: string): Promise<{ valid: boolean; login: string }> =>
    ipcRenderer.invoke('validate-token', token),
  saveToken: (token: string): Promise<void> => ipcRenderer.invoke('save-token', token),
  clearToken: (): Promise<void> => ipcRenderer.invoke('clear-token'),
  hasToken: (): Promise<boolean> => ipcRenderer.invoke('has-token'),
  fetchUserRepos: (): Promise<string[]> => ipcRenderer.invoke('fetch-user-repos'),
  fetchRepoLabels: (repo: string): Promise<Label[]> =>
    ipcRenderer.invoke('fetch-repo-labels', repo),
  validateRepo: (repo: string): Promise<boolean> => ipcRenderer.invoke('validate-repo', repo),
  getUnreadCount: (): Promise<number> => ipcRenderer.invoke('get-unread-count'),

  // Actions
  openPR: (url: string): Promise<void> => ipcRenderer.invoke('open-pr', url),
  refreshNow: (): Promise<void> => ipcRenderer.invoke('refresh-now'),
  markAllRead: (): Promise<void> => ipcRenderer.invoke('mark-all-read'),
  quit: (): Promise<void> => ipcRenderer.invoke('quit'),
  resizePopover: (height: number): Promise<void> => ipcRenderer.invoke('resize-popover', height),
  getViewedPRs: (): Promise<Record<string, string>> => ipcRenderer.invoke('get-viewed-prs'),
  markPRViewed: (key: string, updatedAt: string): Promise<void> =>
    ipcRenderer.invoke('mark-pr-viewed', key, updatedAt),
  resetViewedPRs: (): Promise<void> => ipcRenderer.invoke('reset-viewed-prs'),

  // Events
  onPRsUpdated: (cb: (prs: PR[]) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, prs: PR[]): void => cb(prs)
    ipcRenderer.on('prs-updated', handler)
    return () => ipcRenderer.removeListener('prs-updated', handler)
  },
  onUnreadCountChanged: (cb: (n: number) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, n: number): void => cb(n)
    ipcRenderer.on('unread-count-changed', handler)
    return () => ipcRenderer.removeListener('unread-count-changed', handler)
  },
  onPlaySound: (cb: () => void): (() => void) => {
    const handler = (): void => cb()
    ipcRenderer.on('play-sound', handler)
    return () => ipcRenderer.removeListener('play-sound', handler)
  },
  onPRViewed: (cb: (key: string, updatedAt: string) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, key: string, updatedAt: string): void => cb(key, updatedAt)
    ipcRenderer.on('pr-viewed', handler)
    return () => ipcRenderer.removeListener('pr-viewed', handler)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type API = typeof api
