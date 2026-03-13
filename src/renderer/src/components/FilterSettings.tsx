import { useState, useEffect } from 'react'
import type { Settings, Label } from '../types'

interface Props {
  settings: Settings
  onChange: (s: Partial<Settings>) => void
}

export default function FilterSettings({ settings, onChange }: Props): JSX.Element {
  const [selectedRepo, setSelectedRepo] = useState(settings.watchedRepos[0] || '')
  const [labels, setLabels] = useState<Label[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedRepo) return
    setLoading(true)
    window.api.fetchRepoLabels(selectedRepo).then((l) => {
      setLabels(l)
      setLoading(false)
    })
  }, [selectedRepo])

  if (settings.watchedRepos.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
        Add repos first in the Repos tab.
      </div>
    )
  }

  const filter = settings.labelFilters[selectedRepo] || { teamLabels: [], requiredLabels: [] }

  const toggleLabel = (type: 'teamLabels' | 'requiredLabels', name: string): void => {
    const current = filter[type]
    const next = current.includes(name) ? current.filter((l) => l !== name) : [...current, name]
    onChange({
      labelFilters: {
        ...settings.labelFilters,
        [selectedRepo]: { ...filter, [type]: next }
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <select
        value={selectedRepo}
        onChange={(e) => setSelectedRepo(e.target.value)}
        style={{ width: '100%' }}
      >
        {settings.watchedRepos.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Loading labels...</div>
      ) : (
        <>
          <LabelSection
            title="Optional Labels"
            helpText="If any are selected, only show PRs that match at least one"
            labels={labels}
            selected={filter.teamLabels}
            onToggle={(name) => toggleLabel('teamLabels', name)}
          />
          <LabelSection
            title="Required Labels"
            helpText="Only show PRs that have ALL of these labels"
            labels={labels}
            selected={filter.requiredLabels}
            onToggle={(name) => toggleLabel('requiredLabels', name)}
          />
        </>
      )}
    </div>
  )
}

function LabelSection({
  title,
  helpText,
  labels,
  selected,
  onToggle
}: {
  title: string
  helpText: string
  labels: Label[]
  selected: string[]
  onToggle: (name: string) => void
}): JSX.Element {
  return (
    <div>
      <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 2 }}>{title}</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 6 }}>{helpText}</div>
      {labels.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>No labels found</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {labels.map((label) => {
            const hex = label.color.startsWith('#') ? label.color : `#${label.color}`
            return (
              <label
                key={label.name}
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(label.name)}
                  onChange={() => onToggle(label.name)}
                />
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: hex,
                    flexShrink: 0
                  }}
                />
                <span style={{ fontSize: 12 }}>{label.name}</span>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}
