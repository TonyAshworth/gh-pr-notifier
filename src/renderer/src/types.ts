export interface Label {
  name: string
  color: string
}

export interface Review {
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING'
  author: { login: string }
  submittedAt: string
}

export interface PR {
  number: number
  title: string
  url: string
  state: 'OPEN' | 'CLOSED' | 'MERGED'
  isDraft: boolean
  updatedAt: string
  createdAt: string
  author: { login: string }
  labels: Label[]
  reviews: Review[]
  commentCount: number
  mergedAt: string | null
  closedAt: string | null
  repo: string
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
