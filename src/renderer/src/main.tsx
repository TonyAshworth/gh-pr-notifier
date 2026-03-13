import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/app.css'

async function applyTheme(): Promise<void> {
  const settings = await window.api.getSettings()
  const theme = settings.theme ?? 'system'
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark)
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
}

applyTheme()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
