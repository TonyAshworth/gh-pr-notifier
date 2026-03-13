import { loadToken } from './keychain'
import { getSettings } from './store'
import { fetchPRsForRepos } from './github'
import { diffPRs } from './state'
import { sendNotifications } from './notifications'
import type { PR } from './github'

type PRsUpdatedCallback = (prs: PR[]) => void
type UnreadCountCallback = (count: number) => void
type PRViewedCallback = (key: string, updatedAt: string) => void

let timer: ReturnType<typeof setTimeout> | null = null
let currentPRs: PR[] = []
let unreadCount = 0

let onPRsUpdated: PRsUpdatedCallback | null = null
let onUnreadCountChanged: UnreadCountCallback | null = null
let onPRViewed: PRViewedCallback | null = null

export function setCallbacks(
  prsUpdated: PRsUpdatedCallback,
  unreadChanged: UnreadCountCallback,
  prViewed: PRViewedCallback
): void {
  onPRsUpdated = prsUpdated
  onUnreadCountChanged = unreadChanged
  onPRViewed = prViewed
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
  forceRefresh()
  scheduleNext(settings.pollIntervalSeconds * 1000)
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

  console.log('[poller] Fetching PRs')
  const prs = await fetchPRsForRepos(token, settings.watchedRepos)
  currentPRs = prs
  onPRsUpdated?.(prs)

  const events = diffPRs(prs, settings)
  if (events.length > 0) {
    const newUnread = sendNotifications(events, onPRViewed ?? undefined)
    unreadCount += newUnread
    onUnreadCountChanged?.(unreadCount)
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
