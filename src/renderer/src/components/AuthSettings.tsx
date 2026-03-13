import { useState, useEffect } from 'react'

export default function AuthSettings(): JSX.Element {
  const [token, setToken] = useState('')
  const [hasToken, setHasToken] = useState(false)
  const [validating, setValidating] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; login?: string; msg?: string } | null>(null)

  useEffect(() => {
    window.api.hasToken().then(setHasToken)
  }, [])

  const handleValidateAndSave = async (): Promise<void> => {
    if (!token.trim()) return
    setValidating(true)
    setStatus(null)
    const result = await window.api.validateToken(token.trim())
    if (result.valid) {
      await window.api.saveToken(token.trim())
      setStatus({ ok: true, login: result.login })
      setHasToken(true)
      setToken('')
    } else {
      setStatus({ ok: false, msg: 'Token invalid or lacks required scopes' })
    }
    setValidating(false)
  }

  const handleClear = async (): Promise<void> => {
    await window.api.clearToken()
    setHasToken(false)
    setStatus(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Personal Access Token</div>
      {hasToken && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--success)',
            fontSize: 12
          }}
        >
          <span>Token saved</span>
          <button onClick={handleClear} style={{ color: 'var(--danger)', fontSize: 12 }}>
            Remove
          </button>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="password"
          placeholder="ghp_... or github_pat_..."
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleValidateAndSave()}
          style={{ flex: 1 }}
        />
        <button
          onClick={handleValidateAndSave}
          disabled={validating || !token.trim()}
          style={{
            background: 'var(--accent)',
            color: '#fff',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 12px'
          }}
        >
          {validating ? 'Validating...' : 'Save'}
        </button>
      </div>
      {status && (
        <div
          style={{
            fontSize: 12,
            color: status.ok ? 'var(--success)' : 'var(--danger)'
          }}
        >
          {status.ok ? `Authenticated as ${status.login}` : status.msg}
        </div>
      )}
    </div>
  )
}
