import { useState } from 'react'
import PopoverView from './components/PopoverView'
import SettingsView from './components/SettingsView'

type View = 'popover' | 'settings'

export default function App(): JSX.Element {
  const [view, setView] = useState<View>('popover')

  return (
    <div className="app">
      {view === 'popover' ? (
        <PopoverView onOpenSettings={() => setView('settings')} />
      ) : (
        <SettingsView onClose={() => setView('popover')} />
      )}
    </div>
  )
}
