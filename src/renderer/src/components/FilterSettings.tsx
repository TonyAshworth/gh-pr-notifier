import { useState, useEffect, useRef, useCallback } from 'react'
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

function getWordAtCursor(
  text: string,
  cursor: number,
): { word: string; start: number; end: number } | null {
  if (cursor < 0 || cursor > text.length) return null
  let start = cursor
  while (start > 0 && !/[\s()"']/.test(text[start - 1])) start--
  let end = cursor
  while (end < text.length && !/[\s()"']/.test(text[end])) end++
  if (start === end) return null
  return { word: text.slice(start, cursor), start, end }
}

export default function FilterSettings({ settings, onChange }: Props): JSX.Element {
  const repos = settings.watchedRepos
  const [selectedRepo, setSelectedRepo] = useState(repos[0] || '')
  const [labels, setLabels] = useState<Label[]>([])
  const [loading, setLoading] = useState(false)
  const [localExpr, setLocalExpr] = useState(() => settings.labelFilters[repos[0] || ''] || '')
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<Label[]>([])
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const [wordBounds, setWordBounds] = useState<{ start: number; end: number } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!selectedRepo) return
    setLocalExpr(settings.labelFilters[selectedRepo] || '')
    setError(null)
    setSuggestions([])
    setActiveIndex(-1)
    setWordBounds(null)
    setLoading(true)
    window.api.fetchRepoLabels(selectedRepo).then((l) => {
      setLabels(l)
      setLoading(false)
    })
  }, [selectedRepo])

  useEffect(() => {
    if (!dropdownRef.current || activeIndex < 0) return
    const item = dropdownRef.current.children[activeIndex] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  if (repos.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
        Add repos first in the Repos tab.
      </div>
    )
  }

  function insertOperator(text: string): void {
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
    setSuggestions([])
    setActiveIndex(-1)
    setWordBounds(null)
    requestAnimationFrame(() => {
      ta.focus()
      ta.selectionStart = ta.selectionEnd = newPos
    })
  }

  const updateSuggestions = useCallback(
    (text: string, cursor: number) => {
      const result = getWordAtCursor(text, cursor)
      if (!result) {
        setSuggestions([])
        setActiveIndex(-1)
        setWordBounds(null)
        return
      }
      const { word, start, end } = result
      if (!word || /^(and|or)$/i.test(word)) {
        setSuggestions([])
        setActiveIndex(-1)
        setWordBounds(null)
        return
      }
      const lower = word.toLowerCase()
      const matches = labels.filter((l) => l.name.toLowerCase().includes(lower)).slice(0, 8)
      setSuggestions(matches)
      setActiveIndex(-1)
      setWordBounds(matches.length > 0 ? { start, end } : null)
    },
    [labels],
  )

  function completeSuggestion(label: Label): void {
    if (!wordBounds) return
    const ta = textareaRef.current
    const quoted = quoteIfNeeded(label.name)
    const newExpr =
      localExpr.slice(0, wordBounds.start) + quoted + localExpr.slice(wordBounds.end)
    const newPos = wordBounds.start + quoted.length
    setLocalExpr(newExpr)
    setError(validateExpression(newExpr))
    setSuggestions([])
    setActiveIndex(-1)
    setWordBounds(null)
    requestAnimationFrame(() => {
      if (!ta) return
      ta.focus()
      ta.selectionStart = ta.selectionEnd = newPos
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if ((e.key === 'Enter' || e.key === 'Tab') && activeIndex >= 0) {
      e.preventDefault()
      completeSuggestion(suggestions[activeIndex])
    } else if (e.key === 'Escape') {
      setSuggestions([])
      setActiveIndex(-1)
      setWordBounds(null)
    }
  }

  function handleBlur(): void {
    setSuggestions([])
    setActiveIndex(-1)
    setWordBounds(null)
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
    setSuggestions([])
    setActiveIndex(-1)
    setWordBounds(null)
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

      {/* Expression textarea */}
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
          Filter expression{loading && <span style={{ marginLeft: 6 }}>Loading labels…</span>}
        </div>
        <div style={{ position: 'relative' }}>
          <textarea
            ref={textareaRef}
            value={localExpr}
            onChange={(e) => {
              const val = e.target.value
              const cursor = e.target.selectionStart ?? val.length
              setLocalExpr(val)
              setError(validateExpression(val))
              updateSuggestions(val, cursor)
            }}
            onKeyDown={handleKeyDown}
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
          {suggestions.length > 0 && (
            <div
              ref={dropdownRef}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: 2,
                zIndex: 100,
                maxHeight: 160,
                overflowY: 'auto',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {suggestions.map((label, i) => {
                const hex = label.color.startsWith('#') ? label.color : `#${label.color}`
                return (
                  <div
                    key={label.name}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => completeSuggestion(label)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 8px',
                      fontSize: 12,
                      cursor: 'pointer',
                      background: i === activeIndex ? 'var(--bg-hover)' : 'transparent',
                      color: 'var(--text)',
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
                  </div>
                )
              })}
            </div>
          )}
        </div>
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
            onClick={() => insertOperator(op)}
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
        Labels with spaces or operator names are quoted automatically when selected.
        Changes are saved when you click away from the expression field.
      </div>
    </div>
  )
}
