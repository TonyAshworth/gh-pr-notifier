import type { Settings, IconStateConfig, IconColor, IconFill } from '../types'

interface Props {
  settings: Settings
  onChange: (s: Partial<Settings>) => void
}

const COLORS: IconColor[] = [
  'red', 'orange', 'amber', 'yellow', 'lime', 'green',
  'teal', 'cyan', 'blue', 'indigo', 'purple', 'pink',
  'black', 'white', 'gray',
]

const COLOR_HEX: Record<IconColor, string> = {
  red:    '#ef4444',
  orange: '#f97316',
  amber:  '#f59e0b',
  yellow: '#eab308',
  lime:   '#84cc16',
  green:  '#22c55e',
  teal:   '#14b8a6',
  cyan:   '#06b6d4',
  blue:   '#3b82f6',
  indigo: '#6366f1',
  purple: '#a855f7',
  pink:   '#ec4899',
  black:  '#000000',
  white:  '#ffffff',
  gray:   '#6b7280',
}

const COLOR_LABELS: Record<IconColor, string> = {
  red: 'Red', orange: 'Orange', amber: 'Amber', yellow: 'Yellow',
  lime: 'Lime', green: 'Green', teal: 'Teal', cyan: 'Cyan',
  blue: 'Blue', indigo: 'Indigo', purple: 'Purple', pink: 'Pink',
  black: 'Black', white: 'White', gray: 'Gray',
}

const FILLS: { value: IconFill; label: string }[] = [
  { value: 'solid',     label: 'Solid' },
  { value: 'outline',   label: 'Outline' },
  { value: 'stripes',   label: 'Stripes' },
  { value: 'dots',      label: 'Dots' },
  { value: 'crosshatch', label: 'Crosshatch' },
]

function CirclePreview({
  config,
  stateKey,
  size = 28,
}: {
  config: IconStateConfig
  stateKey: string
  size?: number
}): JSX.Element {
  const hex = COLOR_HEX[config.color]
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 1.5
  const pid = `p-${stateKey}-${config.fill}`
  const clipId = `clip-${stateKey}-${config.fill}`

  if (config.fill === 'solid') {
    return (
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill={hex} />
      </svg>
    )
  }

  if (config.fill === 'outline') {
    return (
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={hex} strokeWidth={2} />
      </svg>
    )
  }

  if (config.fill === 'stripes') {
    return (
      <svg width={size} height={size}>
        <defs>
          <pattern
            id={pid}
            x="0" y="0" width="5" height="5"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect x="0" y="0" width="2.5" height="5" fill={hex} />
          </pattern>
          <clipPath id={clipId}>
            <circle cx={cx} cy={cy} r={r} />
          </clipPath>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill={`url(#${pid})`} clipPath={`url(#${clipId})`} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={hex} strokeWidth={0.5} opacity={0.4} />
      </svg>
    )
  }

  if (config.fill === 'dots') {
    return (
      <svg width={size} height={size}>
        <defs>
          <pattern id={pid} x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse">
            <circle cx="2.5" cy="2.5" r="1.5" fill={hex} />
          </pattern>
          <clipPath id={clipId}>
            <circle cx={cx} cy={cy} r={r} />
          </clipPath>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill={`url(#${pid})`} clipPath={`url(#${clipId})`} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={hex} strokeWidth={0.5} opacity={0.4} />
      </svg>
    )
  }

  // crosshatch
  return (
    <svg width={size} height={size}>
      <defs>
        <pattern id={pid} x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M0,0 L6,6" stroke={hex} strokeWidth="1.2" />
          <path d="M6,0 L0,6" stroke={hex} strokeWidth="1.2" />
        </pattern>
        <clipPath id={clipId}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${pid})`} clipPath={`url(#${clipId})`} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={hex} strokeWidth={0.5} opacity={0.4} />
    </svg>
  )
}

interface StateRowProps {
  label: string
  stateKey: string
  config: IconStateConfig
  onChange: (c: IconStateConfig) => void
}

function StateRow({ label, stateKey, config, onChange }: StateRowProps): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Label + preview */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <CirclePreview config={config} stateKey={stateKey} size={24} />
        <span style={{ fontWeight: 600, fontSize: 13 }}>{label}</span>
      </div>

      {/* Color swatches */}
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>Color</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {COLORS.map((color) => (
            <button
              key={color}
              title={COLOR_LABELS[color]}
              onClick={() => onChange({ ...config, color })}
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: COLOR_HEX[color],
                border: config.color === color
                  ? '2px solid var(--accent)'
                  : color === 'white'
                    ? '1px solid var(--border)'
                    : '2px solid transparent',
                outline: config.color === color ? '2px solid var(--accent)' : 'none',
                outlineOffset: 1,
                cursor: 'pointer',
                padding: 0,
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      </div>

      {/* Fill style */}
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>Style</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {FILLS.map((f) => (
            <button
              key={f.value}
              onClick={() => onChange({ ...config, fill: f.value })}
              style={{
                padding: '3px 9px',
                fontSize: 11,
                borderRadius: 'var(--radius-sm)',
                background: config.fill === f.value ? 'var(--accent)' : 'var(--bg-secondary)',
                color: config.fill === f.value ? '#fff' : 'var(--text)',
                border: `1px solid ${config.fill === f.value ? 'var(--accent)' : 'var(--border)'}`,
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function IconSettings({ settings, onChange }: Props): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
        Customize the tray icon for each PR state. Patterns (Stripes, Dots, Crosshatch) are
        useful as colorblind-friendly options when combined with Black or White.
      </div>

      <StateRow
        label="No PRs"
        stateKey="noPRs"
        config={settings.iconNoPRs}
        onChange={(c) => onChange({ iconNoPRs: c })}
      />

      <div style={{ borderTop: '1px solid var(--border)', margin: '16px 0' }} />

      <StateRow
        label="All Reviewed"
        stateKey="allViewed"
        config={settings.iconAllViewed}
        onChange={(c) => onChange({ iconAllViewed: c })}
      />

      <div style={{ borderTop: '1px solid var(--border)', margin: '16px 0' }} />

      <StateRow
        label="Needs Review"
        stateKey="unread"
        config={settings.iconUnread}
        onChange={(c) => onChange({ iconUnread: c })}
      />
    </div>
  )
}
