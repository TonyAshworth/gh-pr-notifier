import type { Settings } from '../types'

interface Props {
  settings: Settings
  onChange: (s: Partial<Settings>) => void
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

export default function GeneralSettings({ settings, onChange }: Props): JSX.Element {
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
        <ToggleRow
          label="Show draft PRs"
          checked={settings.showDraftPRs}
          onChange={(v) => onChange({ showDraftPRs: v })}
        />
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
