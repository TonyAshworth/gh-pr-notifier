import { useState, useEffect } from 'react'
import PRList from './PRList'
import type { PR } from '../types'

interface Props {
  onOpenSettings: () => void
}

export default function PopoverView({ onOpenSettings }: Props): JSX.Element {
  const [prs, setPRs] = useState<PR[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    window.api.getPRs().then(setPRs)
    window.api.getUnreadCount().then(setUnreadCount)

    const removePRs = window.api.onPRsUpdated(setPRs)
    const removeUnread = window.api.onUnreadCountChanged(setUnreadCount)

    return () => {
      removePRs()
      removeUnread()
    }
  }, [])

  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true)
    await window.api.refreshNow()
    setRefreshing(false)
  }

  const handleMarkAllRead = async (): Promise<void> => {
    await window.api.markAllRead()
    setUnreadCount(0)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 12px',
          borderBottom: '1px solid var(--border)',
          gap: 8,
          flexShrink: 0
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>
          Pull Requests
          {unreadCount > 0 && (
            <span
              style={{
                marginLeft: 6,
                background: 'var(--accent)',
                color: '#fff',
                borderRadius: 10,
                padding: '1px 6px',
                fontSize: 11
              }}
            >
              {unreadCount}
            </span>
          )}
        </span>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            style={{ color: 'var(--text-muted)', fontSize: 11 }}
            title="Mark all read"
          >
            Clear
          </button>
        )}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{ color: 'var(--text-muted)', fontSize: 13 }}
          title="Refresh now"
        >
          {refreshing ? '...' : '↻'}
        </button>
        <button
          onClick={onOpenSettings}
          style={{ color: 'var(--text-muted)', fontSize: 13 }}
          title="Settings"
        >
          ⚙
        </button>
      </div>

      <PRList prs={prs} />
    </div>
  )
}
