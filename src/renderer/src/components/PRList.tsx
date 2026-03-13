import PRRow from './PRRow'
import type { PR } from '../types'

interface Props {
  prs: PR[]
}

export default function PRList({ prs }: Props): JSX.Element {
  if (prs.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: 13
        }}
      >
        No open PRs
      </div>
    )
  }

  // Group by repo
  const byRepo = prs.reduce<Record<string, PR[]>>((acc, pr) => {
    if (!acc[pr.repo]) acc[pr.repo] = []
    acc[pr.repo].push(pr)
    return acc
  }, {})

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
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
              <PRRow key={`${pr.repo}#${pr.number}`} pr={pr} />
            ))}
        </div>
      ))}
    </div>
  )
}
