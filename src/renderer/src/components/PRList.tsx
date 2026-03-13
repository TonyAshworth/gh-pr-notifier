import PRRow, { prKey } from './PRRow'
import type { PR } from '../types'

interface Props {
  prs: PR[]
  viewedPRs: Record<string, string>
  onViewed: (key: string, updatedAt: string) => void
}

export default function PRList({ prs, viewedPRs, onViewed }: Props): JSX.Element {
  if (prs.length === 0) {
    return (
      <div
        style={{
          padding: '24px 12px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 13
        }}
      >
        No open PRs
      </div>
    )
  }

  const byRepo = prs.reduce<Record<string, PR[]>>((acc, pr) => {
    if (!acc[pr.repo]) acc[pr.repo] = []
    acc[pr.repo].push(pr)
    return acc
  }, {})

  return (
    <div>
      {Object.entries(byRepo).map(([repo, repoPRs]) => (
        <div key={repo}>
          <div
            style={{
              padding: '6px 12px',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-muted)',
              background: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border)',
              letterSpacing: '0.02em',
              textTransform: 'uppercase'
            }}
          >
            {repo}
          </div>
          {repoPRs
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .map((pr) => (
              <PRRow
                key={prKey(pr)}
                pr={pr}
                viewedAt={viewedPRs[prKey(pr)]}
                onViewed={onViewed}
              />
            ))}
        </div>
      ))}
    </div>
  )
}
