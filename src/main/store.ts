import Store from 'electron-store'

export interface LabelFilter {
  teamLabels: string[]
  requiredLabels: string[]
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
}

interface StoreSchema extends Settings {
  encryptedToken: string
  prState: Record<string, unknown>
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
  encryptedToken: '',
  prState: {}
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
    showDraftPRs: store.get('showDraftPRs')
  }
}

export function saveSettings(partial: Partial<Settings>): void {
  for (const [key, value] of Object.entries(partial)) {
    store.set(key as keyof Settings, value)
  }
}
