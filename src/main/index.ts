import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  Menu,
  Notification,
  Tray,
  nativeImage,
  nativeTheme
} from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { loadData, saveData } from './store'
import { Goal, Session, Settings } from '../shared/types'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

function showWindow(): void {
  if (!mainWindow) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 820,
    minWidth: 360,
    minHeight: 480,
    show: false,
    autoHideMenuBar: true,
    title: 'Flow Now!',
    icon,
    // Mismo tono que el fondo para evitar el destello blanco al abrir
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#14181f' : '#f7f3ec',
    alwaysOnTop: loadData().settings.alwaysOnTop,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      // El temporizador debe seguir avanzando con la ventana oculta en la bandeja
      backgroundThrottling: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  // Cerrar la ventana la oculta en la bandeja; salir desde el menú de la bandeja
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createTray(): void {
  tray = new Tray(nativeImage.createFromPath(icon).resize({ width: 16, height: 16 }))
  tray.setToolTip('Flow Now!')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Mostrar', click: showWindow },
      { type: 'separator' },
      {
        label: 'Salir',
        click: () => {
          isQuitting = true
          app.quit()
        }
      }
    ])
  )
  tray.on('click', showWindow)
}

function registerIpc(): void {
  ipcMain.handle('data:get', () => loadData())

  ipcMain.handle('session:add', (_, session: Session) => {
    const data = loadData()
    saveData({ ...data, sessions: [...data.sessions, session] })
  })

  ipcMain.handle('session:delete', (_, id: string) => {
    const data = loadData()
    saveData({ ...data, sessions: data.sessions.filter((s) => s.id !== id) })
  })

  ipcMain.handle('goals:save', (_, goals: Goal[], activeGoalId: string | null) => {
    saveData({ ...loadData(), goals, activeGoalId })
  })

  ipcMain.handle('settings:save', (_, settings: Settings) => {
    saveData({ ...loadData(), settings })
    mainWindow?.setAlwaysOnTop(settings.alwaysOnTop)
  })

  ipcMain.on('notify', (_, title: string, body: string) => {
    const n = new Notification({ title, body, icon })
    n.on('click', showWindow)
    n.show()
  })

  ipcMain.on('status', (_, text: string) => {
    mainWindow?.setTitle(text)
    tray?.setToolTip(text)
  })
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', showWindow)

  app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.pakus.flownow')

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    registerIpc()
    createWindow()
    createTray()
  })

  app.on('before-quit', () => {
    isQuitting = true
  })
}
