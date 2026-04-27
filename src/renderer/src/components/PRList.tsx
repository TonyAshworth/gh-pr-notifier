import PRRow, { prKey } from './PRRow'
import type { PR, GroupedPRData, PRGroup } from '../types'

interface Props {
  data: GroupedPRData
  viewedPRs: Record<string, string>
  onViewed: (key: string, updatedAt: string) => void
}

export default function PRList({ data, viewedPRs, onViewed }: Props): JSX.Element {
  if (data.groups.length === 0) {
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

  return (
    <div>
      {data.groups.map((group) => (
        <GroupSection
          key={group.label}
          group={group}
          level={0}
          viewedPRs={viewedPRs}
          onViewed={onViewed}
        />
      ))}
    </div>
  )
}

interface GroupSectionProps {
  group: PRGroup
  level: number
  viewedPRs: Record<string, string>
  onViewed: (key: string, updatedAt: string) => void
}

function GroupSection({ group, level, viewedPRs, onViewed }: GroupSectionProps): JSX.Element {
  const isTopLevel = level === 0
  const hasSubgroups = group.subgroups.length > 0
  const hasPRs = group.prs.length > 0

  return (
    <div>
      <div
        style={{
          padding: isTopLevel ? '6px 12px' : `4px 12px 4px ${12 + level * 16}px`,
          fontSize: isTopLevel ? 11 : 12,
          fontWeight: isTopLevel ? 600 : 500,
          color: isTopLevel ? 'var(--text-muted)' : 'var(--text-secondary)',
          background: isTopLevel ? 'var(--bg-secondary)' : 'transparent',
          borderBottom: isTopLevel ? '1px solid var(--border)' : 'none',
          borderTop: !isTopLevel && level === 1 ? '1px solid var(--border-light)' : 'none',
          letterSpacing: isTopLevel ? '0.02em' : '0',
          textTransform: isTopLevel ? 'uppercase' : 'none'
        }}
      >
        {group.label}
      </div>

      {hasPRs && group.prs.map((pr) => (
        <PRRow
          key={prKey(pr)}
          pr={pr}
          viewedAt={viewedPRs[prKey(pr)]}
          onViewed={onViewed}
        />
      ))}

      {hasSubgroups && group.subgroups.map((subgroup) => (
        <GroupSection
          key={subgroup.label}
          group={subgroup}
          level={level + 1}
          viewedPRs={viewedPRs}
          onViewed={onViewed}
        />
      ))}
    </div>
  )
}
