import type { PR, Review } from '../types'

interface Props {
  pr: PR
}

type Status = 'draft' | 'approved' | 'changes' | 'merged' | 'closed' | 'open'

function getStatus(pr: PR): Status {
  if (pr.state === 'MERGED') return 'merged'
  if (pr.state === 'CLOSED') return 'closed'
  if (pr.isDraft) return 'draft'

  const reviews = pr.reviews.filter((r): r is Review =>
    r.state === 'APPROVED' || r.state === 'CHANGES_REQUESTED'
  )
  if (reviews.length === 0) return 'open'

  const latest = reviews.reduce((a, b) =>
    a.submittedAt > b.submittedAt ? a : b
  )
  if (latest.state === 'APPROVED') return 'approved'
  if (latest.state === 'CHANGES_REQUESTED') return 'changes'
  return 'open'
}

const statusStyles: Record<Status, { color: string; label: string }> = {
  open: { color: '#30d158', label: 'Open' },
  draft: { color: '#8e8e93', label: 'Draft' },
  approved: { color: '#0a84ff', label: 'Approved' },
  changes: { color: '#ff9f0a', label: 'Changes requested' },
  merged: { color: '#a371f7', label: 'Merged' },
  closed: { color: '#ff453a', label: 'Closed' }
}

export default function StatusDot({ pr }: Props): JSX.Element {
  const status = getStatus(pr)
  const { color, label } = statusStyles[status]

  return (
    <span
      title={label}
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0
      }}
    />
  )
}
