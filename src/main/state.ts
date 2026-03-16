import { store } from './store'
import type { PR } from './github'

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
  labelFilters: Record<string, string>
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

export function filterPRsForDisplay(prs: PR[], settings: {
  labelFilters: Record<string, string>
  showDraftPRs: boolean
}): PR[] {
  return prs.filter((pr) => {
    if (!settings.showDraftPRs && pr.isDraft) return false
    return passesLabelFilter(pr, settings.labelFilters[pr.repo])
  })
}

function passesLabelFilter(pr: PR, filter: string | undefined): boolean {
  if (!filter || !filter.trim()) return true
  return evaluateLabelExpression(filter, pr.labels.map((l) => l.name))
}

function tokenizeExpr(expr: string): string[] {
  const tokens: string[] = []
  let i = 0
  while (i < expr.length) {
    if (/\s/.test(expr[i])) { i++; continue }
    if (expr[i] === '(' || expr[i] === ')') { tokens.push(expr[i++]); continue }
    if (expr[i] === '"') {
      i++
      let name = ''
      while (i < expr.length && expr[i] !== '"') name += expr[i++]
      if (expr[i] === '"') i++
      tokens.push(name)
      continue
    }
    let word = ''
    while (i < expr.length && !/[\s()]/.test(expr[i])) word += expr[i++]
    if (word) tokens.push(word)
  }
  return tokens
}

function evaluateLabelExpression(expr: string, prLabels: string[]): boolean {
  const tokens = tokenizeExpr(expr)
  let pos = 0

  const peek = (): string | undefined => tokens[pos]
  const consume = (): string => tokens[pos++]

  function parseExpr(): boolean { return parseOr() }

  function parseOr(): boolean {
    let left = parseAnd()
    while (peek()?.toUpperCase() === 'OR') {
      consume()
      const right = parseAnd()
      left = left || right
    }
    return left
  }

  function parseAnd(): boolean {
    let left = parseFactor()
    while (peek()?.toUpperCase() === 'AND') {
      consume()
      const right = parseFactor()
      left = left && right
    }
    return left
  }

  function parseFactor(): boolean {
    const tok = peek()
    if (!tok) return true
    if (tok === '(') {
      consume()
      const result = parseExpr()
      if (peek() === ')') consume()
      return result
    }
    const upper = tok.toUpperCase()
    if (upper !== 'AND' && upper !== 'OR' && tok !== ')') {
      consume()
      return prLabels.includes(tok)
    }
    return true
  }

  try {
    return parseExpr()
  } catch {
    return true
  }
}
