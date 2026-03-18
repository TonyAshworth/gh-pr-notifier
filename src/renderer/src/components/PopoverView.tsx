import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react'
import PRList from './PRList'
import type { PR } from '../types'

interface Props {
  onOpenSettings: () => void
}

const MAX_LIST_HEIGHT = 500

export default function PopoverView({ onOpenSettings }: Props): JSX.Element {
  const [prs, setPRs] = useState<PR[]>([])
  const [viewedPRs, setViewedPRs] = useState<Record<string, string>>({})
  const [unreadCount, setUnreadCount] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.api.getPRs().then(setPRs)
    window.api.getUnreadCount().then(setUnreadCount)
    window.api.getViewedPRs().then(setViewedPRs)

    const removePRs = window.api.onPRsUpdated(setPRs)
    const removeUnread = window.api.onUnreadCountChanged(setUnreadCount)
    const removeViewed = window.api.onPRViewed((key, updatedAt) => {
      setViewedPRs((prev) => ({ ...prev, [key]: updatedAt }))
    })

    return () => {
      removePRs()
      removeUnread()
      removeViewed()
    }
  }, [])

  useLayoutEffect(() => {
    if (!containerRef.current) return
    const height = Math.max(80, containerRef.current.scrollHeight)
    window.api.resizePopover(height)
  }, [prs])

  const handleViewed = useCallback((key: string, updatedAt: string): void => {
    setViewedPRs((prev) => ({ ...prev, [key]: updatedAt }))
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
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column' }}>
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
          style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1, padding: '2px 4px' }}
          title="Refresh now"
        >
          {refreshing ? <span className="spinner" aria-label="Refreshing" /> : '↻'}
        </button>
        <button
          onClick={onOpenSettings}
          style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1, padding: '2px 4px' }}
          title="Settings"
        >
          ⚙
        </button>
      </div>

      <div style={{ maxHeight: MAX_LIST_HEIGHT, overflowY: 'auto' }}>
        <PRList prs={prs} viewedPRs={viewedPRs} onViewed={handleViewed} />
      </div>
    </div>
  )
}
