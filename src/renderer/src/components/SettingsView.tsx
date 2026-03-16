import { useState, useEffect } from 'react'
import AuthSettings from './AuthSettings'
import RepoSettings from './RepoSettings'
import FilterSettings from './FilterSettings'
import GeneralSettings from './GeneralSettings'
import IconSettings from './IconSettings'
import type { Settings } from '../types'
import type { SoundName } from '../sounds'

type Tab = 'auth' | 'repos' | 'filters' | 'general' | 'icon'

interface Props {
  onClose: () => void
  onTestSound: () => void
  onSoundChange: (s: SoundName) => void
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'auth', label: 'Auth' },
  { id: 'repos', label: 'Repos' },
  { id: 'filters', label: 'Filters' },
  { id: 'general', label: 'General' },
  { id: 'icon', label: 'Icon' },
]

export default function SettingsView({ onClose, onTestSound, onSoundChange }: Props): JSX.Element {
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
            {tab === 'general' && <GeneralSettings settings={settings} onChange={(partial) => { handleChange(partial); if (partial.notificationSound) onSoundChange(partial.notificationSound) }} onTestSound={onTestSound} />}
            {tab === 'icon' && <IconSettings settings={settings} onChange={handleChange} />}
          </>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          padding: '8px 12px',
          flexShrink: 0
        }}
      >
        <button
          onClick={() => window.api.quit()}
          style={{ color: 'var(--danger)', fontSize: 12 }}
        >
          Quit GitHub PR Notifier
        </button>
      </div>
    </div>
  )
}
