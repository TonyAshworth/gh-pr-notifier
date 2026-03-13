import type { Settings } from '../types'
import { SOUND_OPTIONS } from '../sounds'

interface Props {
  settings: Settings
  onChange: (s: Partial<Settings>) => void
  onTestSound: () => void
}

interface ToggleRowProps {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}

function ToggleRow({ label, checked, onChange }: ToggleRowProps): JSX.Element {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 14, height: 14 }}
      />
      <span style={{ fontSize: 13 }}>{label}</span>
    </label>
  )
}

export default function GeneralSettings({ settings, onChange, onTestSound }: Props): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Notifications</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ToggleRow
            label="New PR opened"
            checked={settings.notifyOnOpened}
            onChange={(v) => onChange({ notifyOnOpened: v })}
          />
          <ToggleRow
            label="Review submitted"
            checked={settings.notifyOnReview}
            onChange={(v) => onChange({ notifyOnReview: v })}
          />
          <ToggleRow
            label="New comment"
            checked={settings.notifyOnComment}
            onChange={(v) => onChange({ notifyOnComment: v })}
          />
          <ToggleRow
            label="PR merged"
            checked={settings.notifyOnMerged}
            onChange={(v) => onChange({ notifyOnMerged: v })}
          />
          <ToggleRow
            label="PR closed (without merging)"
            checked={settings.notifyOnClosed}
            onChange={(v) => onChange({ notifyOnClosed: v })}
          />
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Display</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ToggleRow
            label="Show draft PRs"
            checked={settings.showDraftPRs}
            onChange={(v) => onChange({ showDraftPRs: v })}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ToggleRow
              label="Play sound on new activity"
              checked={settings.soundEnabled ?? true}
              onChange={(v) => onChange({ soundEnabled: v })}
            />
            <button
              onClick={onTestSound}
              style={{
                marginLeft: 'auto',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '3px 10px',
                color: 'var(--text)',
                fontSize: 11
              }}
            >
              Test
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13 }}>Sound</span>
            <select
              value={settings.notificationSound ?? 'chime'}
              onChange={(e) => onChange({ notificationSound: e.target.value as Settings['notificationSound'] })}
              style={{ marginLeft: 'auto' }}
            >
              {SOUND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13 }}>Theme</span>
            <select
              value={settings.theme ?? 'system'}
              onChange={(e) => {
                const theme = e.target.value as 'dark' | 'light' | 'system'
                onChange({ theme })
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
                const isDark = theme === 'dark' || (theme === 'system' && prefersDark)
                document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
              }}
              style={{ marginLeft: 'auto' }}
            >
              <option value="system">System</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Viewed History</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 8 }}>
          Clears which PRs you've opened, making all current PRs appear as unread.
        </div>
        <button
          onClick={() => window.api.resetViewedPRs()}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '5px 12px',
            color: 'var(--text)',
            fontSize: 12
          }}
        >
          Reset viewed history
        </button>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Poll Interval</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="number"
            min={30}
            max={3600}
            value={settings.pollIntervalSeconds}
            onChange={(e) =>
              onChange({ pollIntervalSeconds: Math.max(30, parseInt(e.target.value) || 60) })
            }
            style={{ width: 70 }}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>seconds (min 30)</span>
        </div>
      </div>
    </div>
  )
}
