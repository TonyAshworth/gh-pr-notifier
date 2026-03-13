import StatusDot from './StatusDot'
import LabelChip from './LabelChip'
import type { PR } from '../types'

interface Props {
  pr: PR
  viewedAt: string | undefined
  onViewed: (key: string, updatedAt: string) => void
}

function relativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function prKey(pr: PR): string {
  return `${pr.repo}#${pr.number}`
}

export function isUnread(pr: PR, viewedAt: string | undefined): boolean {
  if (!viewedAt) return true
  return pr.updatedAt > viewedAt
}

export default function PRRow({ pr, viewedAt, onViewed }: Props): JSX.Element {
  const unread = isUnread(pr, viewedAt)
  const key = prKey(pr)

  const handleClick = (): void => {
    window.api.openPR(pr.url)
    window.api.markPRViewed(key, pr.updatedAt)
    onViewed(key, pr.updatedAt)
  }

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '8px 12px',
        cursor: 'pointer',
        borderBottom: '1px solid var(--border)',
        borderLeft: unread ? '3px solid var(--accent)' : '3px solid transparent',
        transition: 'background 0.1s'
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.background = ''
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <StatusDot pr={pr} />
        <span
          style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: unread ? 600 : 500
          }}
          title={pr.title}
        >
          #{pr.number} {pr.title}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: 11, flexShrink: 0 }}>
          {relativeTime(pr.updatedAt)}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 14 }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{pr.author.login}</span>
        {pr.labels.slice(0, 3).map((label) => (
          <LabelChip key={label.name} label={label} />
        ))}
        {pr.labels.length > 3 && (
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
            +{pr.labels.length - 3}
          </span>
        )}
      </div>
    </div>
  )
}
