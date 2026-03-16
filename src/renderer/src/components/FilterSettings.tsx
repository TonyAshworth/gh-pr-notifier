import { useState, useEffect, useRef } from 'react'
import type { Settings, Label } from '../types'

interface Props {
  settings: Settings
  onChange: (s: Partial<Settings>) => void
}

function validateExpression(expr: string): string | null {
  if (!expr.trim()) return null

  let depth = 0
  for (const ch of expr) {
    if (ch === '(') depth++
    else if (ch === ')') {
      depth--
      if (depth < 0) return 'Unexpected )'
    }
  }
  if (depth !== 0) return 'Unclosed ('

  const tokens = tokenize(expr)
  if (tokens.length === 0) return null

  const first = tokens[0].toUpperCase()
  const last = tokens[tokens.length - 1].toUpperCase()
  if (first === 'AND' || first === 'OR') return `Expression cannot start with ${tokens[0]}`
  if (last === 'AND' || last === 'OR') return `Expression cannot end with ${tokens[tokens.length - 1]}`

  for (let i = 0; i < tokens.length - 1; i++) {
    const a = tokens[i].toUpperCase()
    const b = tokens[i + 1].toUpperCase()
    if ((a === 'AND' || a === 'OR') && (b === 'AND' || b === 'OR')) {
      return `Consecutive operators: ${tokens[i]} ${tokens[i + 1]}`
    }
  }

  return null
}

function tokenize(expr: string): string[] {
  const tokens: string[] = []
  let i = 0
  while (i < expr.length) {
    if (/\s/.test(expr[i])) { i++; continue }
    if (expr[i] === '(' || expr[i] === ')') { tokens.push(expr[i++]); continue }
    if (expr[i] === '"') {
      i++
      let name = ''
      while (i < expr.length && expr[i] !== '"') name += expr[i++]
      if (expr[i] === '"') i++
      tokens.push(name)
      continue
    }
    let word = ''
    while (i < expr.length && !/[\s()]/.test(expr[i])) word += expr[i++]
    if (word) tokens.push(word)
  }
  return tokens
}

function quoteIfNeeded(name: string): string {
  return /[\s()]/.test(name) || /^(and|or)$/i.test(name) ? `"${name}"` : name
}

export default function FilterSettings({ settings, onChange }: Props): JSX.Element {
  const repos = settings.watchedRepos
  const [selectedRepo, setSelectedRepo] = useState(repos[0] || '')
  const [labels, setLabels] = useState<Label[]>([])
  const [loading, setLoading] = useState(false)
  const [localExpr, setLocalExpr] = useState(() => settings.labelFilters[repos[0] || ''] || '')
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!selectedRepo) return
    setLocalExpr(settings.labelFilters[selectedRepo] || '')
    setError(null)
    setLoading(true)
    window.api.fetchRepoLabels(selectedRepo).then((l) => {
      setLabels(l)
      setLoading(false)
    })
  }, [selectedRepo])

  if (repos.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
        Add repos first in the Repos tab.
      </div>
    )
  }

  function insertAtCursor(text: string): void {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const before = localExpr.slice(0, start)
    const after = localExpr.slice(end)
    const needSpaceBefore = before.length > 0 && !/[\s(]$/.test(before)
    const needSpaceAfter = after.length > 0 && !/^[\s)]/.test(after)
    const insertion = (needSpaceBefore ? ' ' : '') + text + (needSpaceAfter ? ' ' : '')
    const newExpr = before + insertion + after
    const newPos = start + insertion.length
    setLocalExpr(newExpr)
    setError(validateExpression(newExpr))
    requestAnimationFrame(() => {
      ta.focus()
      ta.selectionStart = ta.selectionEnd = newPos
    })
  }

  function handleBlur(): void {
    const err = validateExpression(localExpr)
    if (err) {
      setError(err)
      return
    }
    setError(null)
    const current = settings.labelFilters[selectedRepo] || ''
    if (localExpr === current) return
    onChange({ labelFilters: { ...settings.labelFilters, [selectedRepo]: localExpr } })
  }

  function handleClear(): void {
    setLocalExpr('')
    setError(null)
    onChange({ labelFilters: { ...settings.labelFilters, [selectedRepo]: '' } })
    textareaRef.current?.focus()
  }

  const repoShortName = (r: string): string => r.split('/')[1] || r

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Repo selector — tabs if multiple, plain label if single */}
      {repos.length > 1 ? (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {repos.map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRepo(r)}
              title={r}
              style={{
                padding: '3px 9px',
                fontSize: 11,
                borderRadius: 'var(--radius-sm)',
                background: selectedRepo === r ? 'var(--accent)' : 'var(--bg-secondary)',
                color: selectedRepo === r ? '#fff' : 'var(--text)',
                border: `1px solid ${selectedRepo === r ? 'var(--accent)' : 'var(--border)'}`,
                cursor: 'pointer',
                maxWidth: 120,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {repoShortName(r)}
            </button>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{selectedRepo}</div>
      )}

      {/* Label chips */}
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
          Click a label to insert at cursor
        </div>
        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Loading labels...</div>
        ) : labels.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>No labels found</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {labels.map((label) => {
              const hex = label.color.startsWith('#') ? label.color : `#${label.color}`
              return (
                <button
                  key={label.name}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertAtCursor(quoteIfNeeded(label.name))}
                  title={label.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '2px 8px',
                    fontSize: 11,
                    borderRadius: 10,
                    background: `${hex}20`,
                    border: `1px solid ${hex}60`,
                    color: 'var(--text)',
                    cursor: 'pointer',
                    maxWidth: 160,
                    overflow: 'hidden',
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: hex,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {label.name}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Expression textarea */}
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
          Filter expression
        </div>
        <textarea
          ref={textareaRef}
          value={localExpr}
          onChange={(e) => {
            setLocalExpr(e.target.value)
            setError(validateExpression(e.target.value))
          }}
          onBlur={handleBlur}
          placeholder={`(team-a OR team-b) AND ready-for-review`}
          rows={3}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            resize: 'vertical',
            fontFamily: 'monospace',
            fontSize: 12,
            lineHeight: 1.5,
            padding: '6px 8px',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
            background: 'var(--bg-secondary)',
            color: 'var(--text)',
            outline: 'none',
          }}
        />
        {error && (
          <div style={{ color: 'var(--danger)', fontSize: 11, marginTop: 3 }}>
            {error}
          </div>
        )}
      </div>

      {/* Quick-insert operators + Clear */}
      <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
        {(['AND', 'OR', '(', ')'] as const).map((op) => (
          <button
            key={op}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertAtCursor(op)}
            style={{
              padding: '2px 8px',
              fontSize: 11,
              fontFamily: 'monospace',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
            }}
          >
            {op}
          </button>
        ))}
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleClear}
          style={{
            marginLeft: 'auto',
            padding: '2px 8px',
            fontSize: 11,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-secondary)',
            color: 'var(--danger)',
            border: '1px solid var(--border)',
            cursor: 'pointer',
          }}
        >
          Clear
        </button>
      </div>

      <div style={{ color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.4 }}>
        Supports AND, OR, and ( ) grouping. Empty expression shows all PRs.
        Labels with spaces are quoted automatically when clicked.
        Changes are saved when you click away from the expression field.
      </div>
    </div>
  )
}
