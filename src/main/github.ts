import { graphql } from '@octokit/graphql'

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

interface RateLimitState {
  remaining: number
  resetAt: number
}

const rateLimit: RateLimitState = { remaining: 5000, resetAt: 0 }

function makeClient(token: string) {
  return graphql.defaults({
    headers: { authorization: `bearer ${token}` },
    request: {
      fetch: async (url: string, options: RequestInit) => {
        const response = await fetch(url, options)
        const remaining = response.headers.get('x-ratelimit-remaining')
        const reset = response.headers.get('x-ratelimit-reset')
        if (remaining) rateLimit.remaining = parseInt(remaining, 10)
        if (reset) rateLimit.resetAt = parseInt(reset, 10) * 1000
        return response
      }
    }
  })
}

export function getRateLimitRemaining(): number {
  return rateLimit.remaining
}

export function isRateLimited(): boolean {
  if (rateLimit.remaining < 100) {
    if (Date.now() < rateLimit.resetAt) return true
    rateLimit.remaining = 5000
  }
  return false
}

const PR_FRAGMENT = `
  number title url state isDraft updatedAt createdAt
  mergedAt closedAt
  author { login }
  labels(first: 10) { nodes { name color } }
  reviews(last: 20) { nodes { state author { login } submittedAt } }
  comments { totalCount }
`

export async function fetchPRsForRepos(
  token: string,
  repos: string[]
): Promise<PR[]> {
  if (repos.length === 0) return []
  if (isRateLimited()) {
    console.warn('[github] Rate limited, skipping poll')
    return []
  }

  const client = makeClient(token)
  const aliases = repos.map((repo, i) => {
    const [owner, name] = repo.split('/')
    return `
      repo${i}: repository(owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(name)}) {
        pullRequests(first: 50, states: [OPEN], orderBy: {field: UPDATED_AT, direction: DESC}) {
          nodes { ${PR_FRAGMENT} }
        }
      }
    `
  })

  const query = `query BatchedPRs { ${aliases.join('\n')} }`

  try {
    const result = await client<Record<string, { pullRequests: { nodes: unknown[] } }>>(query)
    const prs: PR[] = []
    for (let i = 0; i < repos.length; i++) {
      const repoData = result[`repo${i}`]
      if (!repoData) continue
      for (const node of repoData.pullRequests.nodes) {
        const n = node as {
          number: number
          title: string
          url: string
          state: string
          isDraft: boolean
          updatedAt: string
          createdAt: string
          mergedAt: string | null
          closedAt: string | null
          author: { login: string }
          labels: { nodes: Label[] }
          reviews: { nodes: Review[] }
          comments: { totalCount: number }
        }
        prs.push({
          number: n.number,
          title: n.title,
          url: n.url,
          state: n.state as PR['state'],
          isDraft: n.isDraft,
          updatedAt: n.updatedAt,
          createdAt: n.createdAt,
          mergedAt: n.mergedAt,
          closedAt: n.closedAt,
          author: n.author,
          labels: n.labels.nodes,
          reviews: n.reviews.nodes,
          commentCount: n.comments.totalCount,
          repo: repos[i]
        })
      }
    }
    return prs
  } catch (err) {
    console.error('[github] GraphQL error:', err)
    return []
  }
}

export async function validateToken(token: string): Promise<{ valid: boolean; login: string }> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: { authorization: `bearer ${token}` }
    })
    if (!response.ok) return { valid: false, login: '' }
    const data = (await response.json()) as { login: string }
    return { valid: true, login: data.login }
  } catch {
    return { valid: false, login: '' }
  }
}

export async function validateRepo(token: string, repo: string): Promise<boolean> {
  const [owner, name] = repo.split('/')
  if (!owner || !name) return false
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${name}`, {
      headers: { authorization: `bearer ${token}` }
    })
    return response.ok
  } catch {
    return false
  }
}

export async function fetchRepoLabels(token: string, repo: string): Promise<Label[]> {
  const [owner, name] = repo.split('/')
  if (!owner || !name) return []
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${name}/labels?per_page=100`,
      { headers: { authorization: `bearer ${token}` } }
    )
    if (!response.ok) return []
    const data = (await response.json()) as Array<{ name: string; color: string }>
    return data.map((l) => ({ name: l.name, color: l.color }))
  } catch {
    return []
  }
}
