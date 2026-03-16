import Store from 'electron-store'

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
  labelFilters: Record<string, string>
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

function migrateLabelFilters(raw: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [repo, filter] of Object.entries(raw)) {
    if (typeof filter === 'string') {
      result[repo] = filter
    } else if (filter && typeof filter === 'object') {
      // Migrate from old { teamLabels, requiredLabels } format
      const old = filter as { teamLabels?: string[]; requiredLabels?: string[] }
      const parts: string[] = []
      if (old.teamLabels?.length) {
        const quoted = old.teamLabels.map((l) => (/[\s()]/.test(l) ? `"${l}"` : l))
        parts.push(quoted.length === 1 ? quoted[0] : `(${quoted.join(' OR ')})`)
      }
      if (old.requiredLabels?.length) {
        for (const l of old.requiredLabels) {
          parts.push(/[\s()]/.test(l) ? `"${l}"` : l)
        }
      }
      result[repo] = parts.join(' AND ')
    }
  }
  return result
}

export function getSettings(): Settings {
  return {
    watchedRepos: store.get('watchedRepos'),
    labelFilters: migrateLabelFilters(store.get('labelFilters') as Record<string, unknown>),
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
