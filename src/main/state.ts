import { store } from './store'
import type { PR, PRGroup, GroupedPRData } from './github'

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

type ASTNode =
  | { type: 'label'; name: string }
  | { type: 'and'; children: ASTNode[] }
  | { type: 'or'; children: ASTNode[] }

interface GroupingLevel {
  labels: string[]
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
}): GroupedPRData {
  const filtered = prs.filter((pr) => {
    if (!settings.showDraftPRs && pr.isDraft) return false
    return passesLabelFilter(pr, settings.labelFilters[pr.repo])
  })

  let hierarchyToUse: GroupingLevel[] = []
  for (const filter of Object.values(settings.labelFilters)) {
    if (!filter || !filter.trim()) continue
    const ast = parseFilterToAST(filter)
    const hierarchy = extractGroupingHierarchy(ast)
    if (hierarchy.length > 0) {
      hierarchyToUse = hierarchy
      break
    }
  }

  return {
    grouped: hierarchyToUse.length > 0,
    groups: buildGroupHierarchy(filtered, hierarchyToUse)
  }
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

function parseFilterToAST(expr: string): ASTNode | null {
  const tokens = tokenizeExpr(expr)
  let pos = 0

  const peek = (): string | undefined => tokens[pos]
  const consume = (): string => tokens[pos++]

  function parseExpr(): ASTNode {
    return parseOr()
  }

  function parseOr(): ASTNode {
    const children: ASTNode[] = [parseAnd()]
    while (peek()?.toUpperCase() === 'OR') {
      consume()
      children.push(parseAnd())
    }
    return children.length === 1 ? children[0] : { type: 'or', children }
  }

  function parseAnd(): ASTNode {
    const children: ASTNode[] = [parseFactor()]
    while (peek()?.toUpperCase() === 'AND') {
      consume()
      children.push(parseFactor())
    }
    return children.length === 1 ? children[0] : { type: 'and', children }
  }

  function parseFactor(): ASTNode {
    const tok = peek()
    if (!tok) return { type: 'label', name: '' }
    if (tok === '(') {
      consume()
      const result = parseExpr()
      if (peek() === ')') consume()
      return result
    }
    const upper = tok.toUpperCase()
    if (upper !== 'AND' && upper !== 'OR' && tok !== ')') {
      consume()
      return { type: 'label', name: tok }
    }
    return { type: 'label', name: '' }
  }

  try {
    return parseExpr()
  } catch {
    return null
  }
}

function evaluateAST(node: ASTNode | null, prLabels: string[]): boolean {
  if (!node) return true
  switch (node.type) {
    case 'label':
      return node.name === '' || prLabels.includes(node.name)
    case 'and':
      return node.children.every(child => evaluateAST(child, prLabels))
    case 'or':
      return node.children.some(child => evaluateAST(child, prLabels))
  }
}

function evaluateLabelExpression(expr: string, prLabels: string[]): boolean {
  const ast = parseFilterToAST(expr)
  return evaluateAST(ast, prLabels)
}

function extractGroupingHierarchy(ast: ASTNode | null): GroupingLevel[] {
  if (!ast) return []

  const orClauses = extractOrClauses(ast)
  return orClauses.map(orNode => ({
    labels: extractLabelsFromOr(orNode)
  }))
}

function extractOrClauses(node: ASTNode): ASTNode[] {
  if (node.type === 'or') {
    return [node]
  }

  if (node.type === 'and') {
    return node.children.filter(child => child.type === 'or')
  }

  return []
}

function extractLabelsFromOr(orNode: ASTNode): string[] {
  if (orNode.type !== 'or') return []

  return orNode.children
    .filter(child => child.type === 'label')
    .map(child => (child as { type: 'label'; name: string }).name)
    .filter(name => name !== '')
}

function assignPRToGroupPath(pr: PR, hierarchy: GroupingLevel[]): string[] {
  const prLabelNames = pr.labels.map(l => l.name)
  const path: string[] = []

  for (const level of hierarchy) {
    const match = level.labels.find(label => prLabelNames.includes(label))
    if (match) {
      path.push(match)
    } else {
      return []
    }
  }

  return path
}

function sortByUpdatedAt(a: PR, b: PR): number {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
}

function buildRepoGroups(prs: PR[]): PRGroup[] {
  const byRepo = new Map<string, PR[]>()

  for (const pr of prs) {
    if (!byRepo.has(pr.repo)) {
      byRepo.set(pr.repo, [])
    }
    byRepo.get(pr.repo)!.push(pr)
  }

  return Array.from(byRepo.entries())
    .map(([repo, repoPRs]) => ({
      label: repo,
      prs: repoPRs.sort(sortByUpdatedAt),
      subgroups: []
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

function buildNestedGroups(
  prPaths: Array<{ pr: PR; path: string[] }>,
  level: number,
  hierarchy: GroupingLevel[]
): PRGroup[] {
  if (level >= hierarchy.length) {
    return []
  }

  const grouped = new Map<string, Array<{ pr: PR; path: string[] }>>()

  for (const item of prPaths) {
    const groupLabel = item.path[level]
    if (!grouped.has(groupLabel)) {
      grouped.set(groupLabel, [])
    }
    grouped.get(groupLabel)!.push(item)
  }

  const groups: PRGroup[] = []

  for (const [label, items] of grouped.entries()) {
    const isLeaf = level === hierarchy.length - 1

    groups.push({
      label,
      prs: isLeaf ? items.map(i => i.pr).sort(sortByUpdatedAt) : [],
      subgroups: isLeaf ? [] : buildNestedGroups(items, level + 1, hierarchy)
    })
  }

  return groups.sort((a, b) => a.label.localeCompare(b.label))
}

function buildGroupHierarchy(prs: PR[], hierarchy: GroupingLevel[]): PRGroup[] {
  if (hierarchy.length === 0) {
    return buildRepoGroups(prs)
  }

  const prPaths = prs
    .map(pr => ({ pr, path: assignPRToGroupPath(pr, hierarchy) }))
    .filter(({ path }) => path.length > 0)

  return buildNestedGroups(prPaths, 0, hierarchy)
}
