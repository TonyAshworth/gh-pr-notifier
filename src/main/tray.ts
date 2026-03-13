import { Tray, BrowserWindow, nativeImage, screen, Menu, app } from 'electron'
import path from 'path'
import { is } from '@electron-toolkit/utils'

let tray: Tray | null = null
let popover: BrowserWindow | null = null
let blurGuard = false

const POPOVER_WIDTH = 380
const POPOVER_HEIGHT = 520

function getIconPath(unread: boolean): string {
  const name = unread ? 'trayTemplateUnread' : 'trayTemplate'
  return path.join(__dirname, '../../resources', `${name}.png`)
}

export function createTray(onToggle: () => void): Tray {
  const icon = nativeImage.createFromPath(getIconPath(false))
  icon.setTemplateImage(true)
  tray = new Tray(icon)
  tray.setToolTip('GitHub PR Notifier')

  tray.on('click', onToggle)

  const contextMenu = Menu.buildFromTemplate([{ label: 'Quit', click: () => app.quit() }])
  tray.on('right-click', () => tray!.popUpContextMenu(contextMenu))

  return tray
}

export function setTrayUnread(hasUnread: boolean): void {
  if (!tray) return
  const icon = nativeImage.createFromPath(getIconPath(hasUnread))
  icon.setTemplateImage(true)
  tray.setImage(icon)
}

export function createPopover(preloadPath: string): BrowserWindow {
  popover = new BrowserWindow({
    width: POPOVER_WIDTH,
    height: POPOVER_HEIGHT,
    show: false,
    frame: false,
    transparent: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    webPreferences: {
      preload: preloadPath,
      sandbox: false,
      contextIsolation: true
    }
  })

  popover.on('blur', () => {
    if (blurGuard) return
    popover?.hide()
  })

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    popover.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    popover.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  return popover
}

export function togglePopover(): void {
  if (!popover || !tray) return

  if (popover.isVisible()) {
    popover.hide()
    return
  }

  blurGuard = true
  positionPopover()
  popover.show()
  popover.focus()
  setTimeout(() => { blurGuard = false }, 200)
}

function positionPopover(): void {
  if (!popover || !tray) return

  const trayBounds = tray.getBounds()
  const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y })
  const workArea = display.workArea

  let x = Math.round(trayBounds.x + trayBounds.width / 2 - POPOVER_WIDTH / 2)
  let y = Math.round(trayBounds.y + trayBounds.height + 4)

  // Clamp to screen edges
  x = Math.max(workArea.x, Math.min(x, workArea.x + workArea.width - POPOVER_WIDTH))
  if (y + POPOVER_HEIGHT > workArea.y + workArea.height) {
    y = Math.round(trayBounds.y - POPOVER_HEIGHT - 4)
  }

  popover.setPosition(x, y)
}

export function destroyTray(): void {
  popover?.destroy()
  tray?.destroy()
  popover = null
  tray = null
}
