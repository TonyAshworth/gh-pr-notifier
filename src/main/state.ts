import { store } from './store'
import type { PR } from './github'
import type { LabelFilter } from './store'

export type PREventType =
  | 'opened'
  | 'ready_for_review'
  | 'review_submitted'
  | 'new_comment'
  | 'merged'
  | 'closed'

export interface PREvent {
  type: PREventType
  pr: PR
  reviewState?: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED'
}

interface PersistedPRState {
  isDraft: boolean
  reviewCount: number
  commentCount: number
  state: string
  latestReviewAt: string
}

type Snapshot = Record<string, PersistedPRState>

function snapshotKey(pr: PR): string {
  return `${pr.repo}#${pr.number}`
}

export function diffPRs(newPRs: PR[], settings: {
  labelFilters: Record<string, LabelFilter>
  showDraftPRs: boolean
  notifyOnOpened: boolean
  notifyOnReview: boolean
  notifyOnComment: boolean
  notifyOnMerged: boolean
  notifyOnClosed: boolean
}): PREvent[] {
  const prev = (store.get('prState') as Snapshot) || {}
  const next: Snapshot = {}
  const events: PREvent[] = []

  for (const pr of newPRs) {
    if (!settings.showDraftPRs && pr.isDraft) {
      // still track state but don't emit events
      const latestReview = pr.reviews.length > 0
        ? pr.reviews.reduce((a, b) =>
            a.submittedAt > b.submittedAt ? a : b
          ).submittedAt
        : ''
      next[snapshotKey(pr)] = {
        isDraft: pr.isDraft,
        reviewCount: pr.reviews.length,
        commentCount: pr.commentCount,
        state: pr.state,
        latestReviewAt: latestReview
      }
      continue
    }

    if (!passesLabelFilter(pr, settings.labelFilters[pr.repo])) {
      continue
    }

    const latestReview = pr.reviews.length > 0
      ? pr.reviews.reduce((a, b) =>
          a.submittedAt > b.submittedAt ? a : b
        ).submittedAt
      : ''

    next[snapshotKey(pr)] = {
      isDraft: pr.isDraft,
      reviewCount: pr.reviews.length,
      commentCount: pr.commentCount,
      state: pr.state,
      latestReviewAt: latestReview
    }

    const prevState = prev[snapshotKey(pr)]

    if (!prevState) {
      if (settings.notifyOnOpened) {
        events.push({ type: 'opened', pr })
      }
      continue
    }

    if (prevState.isDraft && !pr.isDraft) {
      events.push({ type: 'ready_for_review', pr })
      continue
    }

    if (pr.state === 'MERGED' && prevState.state !== 'MERGED') {
      if (settings.notifyOnMerged) {
        events.push({ type: 'merged', pr })
      }
      continue
    }

    if (pr.state === 'CLOSED' && pr.mergedAt === null && prevState.state !== 'CLOSED') {
      if (settings.notifyOnClosed) {
        events.push({ type: 'closed', pr })
      }
      continue
    }

    if (latestReview && latestReview > prevState.latestReviewAt && settings.notifyOnReview) {
      const newestReview = pr.reviews.reduce((a, b) =>
        a.submittedAt > b.submittedAt ? a : b
      )
      events.push({
        type: 'review_submitted',
        pr,
        reviewState: newestReview.state as PREvent['reviewState']
      })
    }

    if (pr.commentCount > prevState.commentCount && settings.notifyOnComment) {
      events.push({ type: 'new_comment', pr })
    }
  }

  store.set('prState', next)
  return events
}

function passesLabelFilter(pr: PR, filter: LabelFilter | undefined): boolean {
  if (!filter) return true
  const prLabelNames = pr.labels.map((l) => l.name)

  const teamPass =
    filter.teamLabels.length === 0 ||
    filter.teamLabels.some((l) => prLabelNames.includes(l))

  const requiredPass =
    filter.requiredLabels.length === 0 ||
    filter.requiredLabels.every((l) => prLabelNames.includes(l))

  return teamPass && requiredPass
}
