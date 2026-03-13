import { useState, useEffect, useMemo } from 'react'
import type { Settings } from '../types'

interface Props {
  settings: Settings
  onChange: (s: Partial<Settings>) => void
}

export default function RepoSettings({ settings, onChange }: Props): JSX.Element {
  const [availableRepos, setAvailableRepos] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    window.api.fetchUserRepos().then((repos) => {
      setAvailableRepos(repos)
      setLoading(false)
    })
  }, [])

  const suggestions = useMemo(() => {
    const q = search.toLowerCase()
    return availableRepos.filter(
      (r) => !settings.watchedRepos.includes(r) && r.toLowerCase().includes(q)
    )
  }, [availableRepos, settings.watchedRepos, search])

  const handleAdd = (repo: string): void => {
    onChange({ watchedRepos: [...settings.watchedRepos, repo] })
    setSearch('')
    setShowDropdown(false)
  }

  const handleRemove = (repo: string): void => {
    const labelFilters = { ...settings.labelFilters }
    delete labelFilters[repo]
    onChange({
      watchedRepos: settings.watchedRepos.filter((r) => r !== repo),
      labelFilters
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Search input + dropdown */}
      <div style={{ position: 'relative' }}>
        <input
          placeholder={loading ? 'Loading repos...' : 'Search repos…'}
          value={search}
          disabled={loading}
          onChange={(e) => { setSearch(e.target.value); setShowDropdown(true) }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          style={{ width: '100%' }}
        />
        {showDropdown && suggestions.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              marginTop: 2,
              maxHeight: 180,
              overflowY: 'auto',
              zIndex: 10
            }}
          >
            {suggestions.map((repo) => (
              <div
                key={repo}
                onMouseDown={() => handleAdd(repo)}
                style={{
                  padding: '6px 10px',
                  fontSize: 12,
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border)'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = ''
                }}
              >
                {repo}
              </div>
            ))}
          </div>
        )}
        {showDropdown && !loading && search && suggestions.length === 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              marginTop: 2,
              padding: '6px 10px',
              fontSize: 12,
              color: 'var(--text-muted)',
              zIndex: 10
            }}
          >
            No matching repos
          </div>
        )}
      </div>

      {/* Watched repos list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {settings.watchedRepos.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>No repos added yet</div>
        )}
        {settings.watchedRepos.map((repo) => (
          <div
            key={repo}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 8px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <span style={{ flex: 1, fontSize: 13 }}>{repo}</span>
            <button
              onClick={() => handleRemove(repo)}
              style={{ color: 'var(--danger)', fontSize: 13 }}
              title="Remove"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
