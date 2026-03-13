import { useState, useEffect, useRef } from 'react'
import PopoverView from './components/PopoverView'
import SettingsView from './components/SettingsView'
import { playSound } from './sounds'
import type { SoundName } from './sounds'

type View = 'popover' | 'settings'

const SETTINGS_HEIGHT = 520

export default function App(): JSX.Element {
  const [view, setView] = useState<View>('popover')
  const soundRef = useRef<SoundName>('chime')

  useEffect(() => {
    window.api.getSettings().then((s) => {
      soundRef.current = s.notificationSound ?? 'chime'
    })
  }, [])

  useEffect(() => {
    const remove = window.api.onPlaySound(() => playSound(soundRef.current))
    return remove
  }, [])

  const handleTestSound = (): void => {
    playSound(soundRef.current)
  }

  const openSettings = (): void => {
    window.api.resizePopover(SETTINGS_HEIGHT)
    setView('settings')
  }

  return (
    <div className="app">
      {view === 'popover' ? (
        <PopoverView onOpenSettings={openSettings} />
      ) : (
        <SettingsView
          onClose={() => setView('popover')}
          onTestSound={handleTestSound}
          onSoundChange={(s) => { soundRef.current = s }}
        />
      )}
    </div>
  )
}
