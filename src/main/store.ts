import Store from 'electron-store'

export interface LabelFilter {
  teamLabels: string[]
  requiredLabels: string[]
}

export type IconColor =
  | 'red' | 'orange' | 'amber' | 'yellow' | 'lime' | 'green' | 'teal'
  | 'cyan' | 'blue' | 'indigo' | 'purple' | 'pink'
  | 'black' | 'white' | 'gray'

export type IconFill = 'solid' | 'outline' | 'stripes' | 'dots' | 'crosshatch'

export interface IconStateConfig {
  color: IconColor
  fill: IconFill
}

export interface Settings {
  watchedRepos: string[]
  labelFilters: Record<string, LabelFilter>
  pollIntervalSeconds: number
  notifyOnOpened: boolean
  notifyOnReview: boolean
  notifyOnComment: boolean
  notifyOnMerged: boolean
  notifyOnClosed: boolean
  showDraftPRs: boolean
  theme: 'dark' | 'light' | 'system'
  soundEnabled: boolean
  notificationSound: 'chime' | 'ping' | 'ding' | 'pop' | 'chord'
  iconNoPRs: IconStateConfig
  iconAllViewed: IconStateConfig
  iconUnread: IconStateConfig
}

interface StoreSchema extends Settings {
  encryptedToken: string
  prState: Record<string, unknown>
  viewedPRs: Record<string, string>
}

const defaults: StoreSchema = {
  watchedRepos: [],
  labelFilters: {},
  pollIntervalSeconds: 60,
  notifyOnOpened: true,
  notifyOnReview: true,
  notifyOnComment: true,
  notifyOnMerged: true,
  notifyOnClosed: false,
  showDraftPRs: false,
  theme: 'system',
  soundEnabled: true,
  notificationSound: 'chime',
  iconNoPRs:     { color: 'black', fill: 'outline' },
  iconAllViewed: { color: 'green', fill: 'solid' },
  iconUnread:    { color: 'red',   fill: 'solid' },
  encryptedToken: '',
  prState: {},
  viewedPRs: {}
}

export const store = new Store<StoreSchema>({
  name: 'gh-pr-notifier',
  defaults
})

export function getSettings(): Settings {
  return {
    watchedRepos: store.get('watchedRepos'),
    labelFilters: store.get('labelFilters'),
    pollIntervalSeconds: store.get('pollIntervalSeconds'),
    notifyOnOpened: store.get('notifyOnOpened'),
    notifyOnReview: store.get('notifyOnReview'),
    notifyOnComment: store.get('notifyOnComment'),
    notifyOnMerged: store.get('notifyOnMerged'),
    notifyOnClosed: store.get('notifyOnClosed'),
    showDraftPRs: store.get('showDraftPRs'),
    theme: store.get('theme'),
    soundEnabled: store.get('soundEnabled'),
    notificationSound: store.get('notificationSound'),
    iconNoPRs: store.get('iconNoPRs'),
    iconAllViewed: store.get('iconAllViewed'),
    iconUnread: store.get('iconUnread'),
  }
}

export function saveSettings(partial: Partial<Settings>): void {
  for (const [key, value] of Object.entries(partial)) {
    store.set(key as keyof Settings, value)
  }
}
