import { loadToken } from './keychain'
import { getSettings } from './store'
import { fetchPRsForRepos } from './github'
import { diffPRs } from './state'
import { sendNotifications } from './notifications'
import type { PR } from './github'

type PRsUpdatedCallback = (prs: PR[]) => void
type UnreadCountCallback = (count: number) => void

let timer: ReturnType<typeof setTimeout> | null = null
let lastModified: string | null = null
let pollInterval = 60
let currentPRs: PR[] = []
let unreadCount = 0

let onPRsUpdated: PRsUpdatedCallback | null = null
let onUnreadCountChanged: UnreadCountCallback | null = null

export function setCallbacks(
  prsUpdated: PRsUpdatedCallback,
  unreadChanged: UnreadCountCallback
): void {
  onPRsUpdated = prsUpdated
  onUnreadCountChanged = unreadChanged
}

export function getCurrentPRs(): PR[] {
  return currentPRs
}

export function getUnreadCount(): number {
  return unreadCount
}

export function markAllRead(): void {
  unreadCount = 0
  onUnreadCountChanged?.(0)
}

export function startPoller(): void {
  const settings = getSettings()
  pollInterval = settings.pollIntervalSeconds
  scheduleNext(0)
}

export function stopPoller(): void {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

export function restartPoller(): void {
  stopPoller()
  startPoller()
}

function scheduleNext(delayMs: number): void {
  timer = setTimeout(async () => {
    await runPollCycle()
    const settings = getSettings()
    scheduleNext(settings.pollIntervalSeconds * 1000)
  }, delayMs)
}

async function runPollCycle(): Promise<void> {
  const token = loadToken()
  if (!token) return

  const settings = getSettings()
  if (settings.watchedRepos.length === 0) return

  const hasActivity = await checkNotificationsHeartbeat(token)
  if (!hasActivity) {
    console.log('[poller] No new activity (304)')
    return
  }

  console.log('[poller] Activity detected, fetching PRs')
  const prs = await fetchPRsForRepos(token, settings.watchedRepos)
  currentPRs = prs
  onPRsUpdated?.(prs)

  const events = diffPRs(prs, settings)
  if (events.length > 0) {
    const newUnread = sendNotifications(events)
    unreadCount += newUnread
    onUnreadCountChanged?.(unreadCount)
  }
}

async function checkNotificationsHeartbeat(token: string): Promise<boolean> {
  const headers: Record<string, string> = {
    authorization: `bearer ${token}`,
    Accept: 'application/vnd.github.v3+json'
  }
  if (lastModified) {
    headers['If-Modified-Since'] = lastModified
  }

  try {
    const response = await fetch('https://api.github.com/notifications', { headers })

    const pollIntervalHeader = response.headers.get('X-Poll-Interval')
    if (pollIntervalHeader) {
      pollInterval = Math.max(parseInt(pollIntervalHeader, 10), pollInterval)
    }

    if (response.status === 304) return false

    const lm = response.headers.get('Last-Modified')
    if (lm) lastModified = lm

    return response.ok
  } catch (err) {
    console.error('[poller] Notifications heartbeat error:', err)
    return false
  }
}

export async function forceRefresh(): Promise<void> {
  const token = loadToken()
  if (!token) return
  const settings = getSettings()
  if (settings.watchedRepos.length === 0) return

  const prs = await fetchPRsForRepos(token, settings.watchedRepos)
  currentPRs = prs
  onPRsUpdated?.(prs)
}
