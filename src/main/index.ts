import { app, ipcMain, shell } from 'electron'
import path from 'path'
import { createTray, createPopover, togglePopover, setTrayUnread, destroyTray } from './tray'
import { startPoller, stopPoller, restartPoller, getCurrentPRs, getUnreadCount, markAllRead, forceRefresh, setCallbacks } from './poller'
import { getSettings, saveSettings } from './store'
import { saveToken, loadToken, clearToken } from './keychain'
import { validateToken, validateRepo, fetchRepoLabels } from './github'
import { startDeviceFlow, pollDeviceFlow } from './githubAuth'
import type { PR } from './github'

let popoverWindow: Electron.BrowserWindow | null = null

app.setName('GitHub PR Notifier')

// Prevent the app from appearing in the Dock
app.dock?.hide()

app.whenReady().then(() => {
  const preloadPath = path.join(__dirname, '../preload/index.js')

  const tray = createTray(togglePopover)
  popoverWindow = createPopover(preloadPath)

  setCallbacks(
    (prs: PR[]) => {
      popoverWindow?.webContents.send('prs-updated', prs)
    },
    (count: number) => {
      setTrayUnread(count > 0)
      popoverWindow?.webContents.send('unread-count-changed', count)
    }
  )

  startPoller()

  // Suppress unused variable warning
  void tray
})

app.on('before-quit', () => {
  stopPoller()
  destroyTray()
})

// macOS: don't quit when all windows closed (menu bar app)
app.on('window-all-closed', (e: Electron.Event) => {
  e.preventDefault()
})

// ─── IPC Handlers ───────────────────────────────────────────────────────────

ipcMain.handle('get-prs', () => getCurrentPRs())

ipcMain.handle('get-settings', () => getSettings())

ipcMain.handle('save-settings', (_e, partial) => {
  saveSettings(partial)
  restartPoller()
})

ipcMain.handle('validate-token', async (_e, token: string) => {
  return validateToken(token)
})

ipcMain.handle('save-token', (_e, token: string) => {
  saveToken(token)
})

ipcMain.handle('clear-token', () => {
  clearToken()
})

ipcMain.handle('has-token', () => !!loadToken())

ipcMain.handle('validate-repo', async (_e, repo: string) => {
  const token = loadToken()
  if (!token) return false
  return validateRepo(token, repo)
})

ipcMain.handle('fetch-repo-labels', async (_e, repo: string) => {
  const token = loadToken()
  if (!token) return []
  return fetchRepoLabels(token, repo)
})

ipcMain.handle('refresh-now', async () => {
  await forceRefresh()
})

ipcMain.handle('mark-all-read', () => {
  markAllRead()
  setTrayUnread(false)
  popoverWindow?.webContents.send('unread-count-changed', 0)
})

ipcMain.handle('open-pr', (_e, url: string) => {
  shell.openExternal(url)
})

ipcMain.handle('get-unread-count', () => getUnreadCount())

// OAuth Device Flow
ipcMain.handle('start-device-flow', async () => {
  return startDeviceFlow()
})

ipcMain.handle('poll-device-flow', (_e, deviceCode: string, intervalSeconds: number) => {
  return new Promise<{ login: string } | { error: string }>((resolve) => {
    pollDeviceFlow(
      deviceCode,
      intervalSeconds,
      (login) => resolve({ login }),
      (err) => resolve({ error: err })
    )
  })
})
