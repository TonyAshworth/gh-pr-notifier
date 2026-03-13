import { useState } from 'react'
import type { Settings } from '../types'

interface Props {
  settings: Settings
  onChange: (s: Partial<Settings>) => void
}

export default function RepoSettings({ settings, onChange }: Props): JSX.Element {
  const [input, setInput] = useState('')
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState('')

  const handleAdd = async (): Promise<void> => {
    const repo = input.trim()
    if (!repo.includes('/')) {
      setError('Format: owner/repo')
      return
    }
    if (settings.watchedRepos.includes(repo)) {
      setError('Already watching this repo')
      return
    }
    setValidating(true)
    setError('')
    const valid = await window.api.validateRepo(repo)
    setValidating(false)
    if (!valid) {
      setError('Repo not found or no access')
      return
    }
    onChange({ watchedRepos: [...settings.watchedRepos, repo] })
    setInput('')
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
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          placeholder="owner/repo"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError('') }}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          style={{ flex: 1 }}
        />
        <button
          onClick={handleAdd}
          disabled={validating || !input.trim()}
          style={{
            background: 'var(--accent)',
            color: '#fff',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 12px'
          }}
        >
          {validating ? '...' : 'Add'}
        </button>
      </div>
      {error && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</div>}

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
