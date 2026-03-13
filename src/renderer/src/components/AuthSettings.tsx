import { useState, useEffect } from 'react'

export default function AuthSettings(): JSX.Element {
  const [token, setToken] = useState('')
  const [hasToken, setHasToken] = useState(false)
  const [validating, setValidating] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; login?: string; msg?: string } | null>(null)
  const [deviceFlow, setDeviceFlow] = useState<{
    userCode: string
    verificationUri: string
    deviceCode: string
    interval: number
  } | null>(null)
  const [devicePolling, setDevicePolling] = useState(false)
  const [deviceStatus, setDeviceStatus] = useState<string>('')

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

  const handleStartDeviceFlow = async (): Promise<void> => {
    setDeviceStatus('')
    try {
      const flow = await window.api.startDeviceFlow()
      setDeviceFlow(flow)
      setDevicePolling(true)
      setDeviceStatus('Waiting for authorization...')

      const result = await window.api.pollDeviceFlow(flow.deviceCode, flow.interval)
      setDevicePolling(false)
      if ('login' in result) {
        setDeviceStatus(`Authorized as ${result.login}`)
        setHasToken(true)
        setDeviceFlow(null)
      } else {
        setDeviceStatus(`Error: ${result.error}`)
        setDeviceFlow(null)
      }
    } catch (err) {
      setDevicePolling(false)
      setDeviceStatus(`Error: ${err}`)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Personal Access Token</div>
        {hasToken && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
              color: 'var(--success)',
              fontSize: 12
            }}
          >
            <span>Token saved</span>
            <button
              onClick={handleClear}
              style={{ color: 'var(--danger)', fontSize: 12 }}
            >
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
              marginTop: 6,
              fontSize: 12,
              color: status.ok ? 'var(--success)' : 'var(--danger)'
            }}
          >
            {status.ok ? `Authenticated as ${status.login}` : status.msg}
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>OAuth Device Flow</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 8 }}>
          Sign in with your browser — no token required.
        </div>
        {deviceFlow ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Enter this code at{' '}
              <span style={{ color: 'var(--accent)' }}>{deviceFlow.verificationUri}</span>
            </div>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: 4,
                color: 'var(--text)'
              }}
            >
              {deviceFlow.userCode}
            </div>
          </div>
        ) : (
          <button
            onClick={handleStartDeviceFlow}
            disabled={devicePolling}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px',
              color: 'var(--text)'
            }}
          >
            Sign in with GitHub
          </button>
        )}
        {deviceStatus && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
            {deviceStatus}
          </div>
        )}
      </div>
    </div>
  )
}
