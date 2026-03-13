import { useState, useEffect } from 'react'
import AuthSettings from './AuthSettings'
import RepoSettings from './RepoSettings'
import FilterSettings from './FilterSettings'
import GeneralSettings from './GeneralSettings'
import type { Settings } from '../types'

type Tab = 'auth' | 'repos' | 'filters' | 'general'

interface Props {
  onClose: () => void
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'auth', label: 'Auth' },
  { id: 'repos', label: 'Repos' },
  { id: 'filters', label: 'Filters' },
  { id: 'general', label: 'General' }
]

export default function SettingsView({ onClose }: Props): JSX.Element {
  const [tab, setTab] = useState<Tab>('auth')
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    window.api.getSettings().then(setSettings)
  }, [])

  const handleChange = async (partial: Partial<Settings>): Promise<void> => {
    if (!settings) return
    const next = { ...settings, ...partial }
    setSettings(next)
    await window.api.saveSettings(partial)
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
          flexShrink: 0
        }}
      >
        <button onClick={onClose} style={{ color: 'var(--text-muted)', fontSize: 13, marginRight: 8 }}>
          ←
        </button>
        <span style={{ fontWeight: 600, fontSize: 13 }}>Settings</span>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: '8px 0',
              fontSize: 12,
              fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              borderRadius: 0
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {settings === null ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Loading...</div>
        ) : (
          <>
            {tab === 'auth' && <AuthSettings />}
            {tab === 'repos' && <RepoSettings settings={settings} onChange={handleChange} />}
            {tab === 'filters' && <FilterSettings settings={settings} onChange={handleChange} />}
            {tab === 'general' && <GeneralSettings settings={settings} onChange={handleChange} />}
          </>
        )}
      </div>
    </div>
  )
}
