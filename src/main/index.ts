import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  Menu,
  Notification,
  Tray,
  nativeImage,
  nativeTheme,
  screen,
  type NativeImage,
  type Rectangle
} from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { loadData, saveData } from './store'
import { Goal, Session, Settings, Theme, TimerCommand, TimerState } from '../shared/types'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

const MIN_SIZE = { width: 360, height: 480 }
const MINI_SIZE = { width: 240, height: 300 }
// Tamaño normal guardado al entrar en modo mini, para restaurarlo al salir
let normalBounds: Rectangle | null = null

const BG = { dark: '#14181f', light: '#f7f3ec' }

function showWindow(): void {
  if (!mainWindow) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

function applyTheme(theme: Theme): void {
  // El renderer sigue prefers-color-scheme, que respeta themeSource
  nativeTheme.themeSource = theme
  mainWindow?.setBackgroundColor(nativeTheme.shouldUseDarkColors ? BG.dark : BG.light)
}

/** Icono 16x16 para la barra de tareas a partir de una cuadrícula 8x8 ('#' = píxel blanco). */
function pixelImage(rows: string[]): NativeImage {
  const size = 16
  const buffer = Buffer.alloc(size * size * 4)
  rows.forEach((row, y) => {
    ;[...row].forEach((ch, x) => {
      if (ch !== '#') return
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const i = ((y * 2 + dy) * size + (x * 2 + dx)) * 4
          buffer.fill(255, i, i + 4) // BGRA blanco opaco
        }
      }
    })
  })
  return nativeImage.createFromBitmap(buffer, { width: size, height: size })
}

const THUMB_ICONS = {
  play: pixelImage([
    '..#.....',
    '..##....',
    '..###...',
    '..####..',
    '..####..',
    '..###...',
    '..##....',
    '..#.....'
  ]),
  pause: pixelImage([
    '.##..##.',
    '.##..##.',
    '.##..##.',
    '.##..##.',
    '.##..##.',
    '.##..##.',
    '.##..##.',
    '.##..##.'
  ]),
  skip: pixelImage([
    '#...#..#',
    '##..##.#',
    '###.####',
    '########',
    '###.####',
    '##..##.#',
    '#...#..#',
    '........'
  ])
}

function sendCommand(command: TimerCommand): void {
  mainWindow?.webContents.send('timer:command', command)
}

let lastThumbStatus: TimerState['status'] | null = null

/** Progreso en el icono de la barra de tareas y botones ▶/⏸ ⏭ en su miniatura. */
function updateTaskbar(state: TimerState): void {
  if (!mainWindow) return
  if (state.status === 'idle') mainWindow.setProgressBar(-1)
  else
    mainWindow.setProgressBar(Math.max(0.01, state.progress), {
      mode: state.status === 'paused' ? 'paused' : 'normal'
    })

  if (state.status === lastThumbStatus) return
  lastThumbStatus = state.status
  const running = state.status === 'running'
  mainWindow.setThumbarButtons([
    {
      tooltip: running ? 'Pausar' : 'Iniciar',
      icon: running ? THUMB_ICONS.pause : THUMB_ICONS.play,
      click: () => sendCommand('toggle')
    },
    { tooltip: 'Saltar fase', icon: THUMB_ICONS.skip, click: () => sendCommand('skip') }
  ])
}

function setMini(on: boolean): void {
  if (!mainWindow) return
  if (on) {
    normalBounds = mainWindow.getBounds()
    const { workArea } = screen.getDisplayMatching(normalBounds)
    mainWindow.setMinimumSize(MINI_SIZE.width, MINI_SIZE.height)
    mainWindow.setBounds({
      ...MINI_SIZE,
      x: workArea.x + workArea.width - MINI_SIZE.width - 16,
      y: workArea.y + workArea.height - MINI_SIZE.height - 16
    })
    mainWindow.setResizable(false)
    mainWindow.setAlwaysOnTop(true, 'floating')
  } else {
    mainWindow.setResizable(true)
    mainWindow.setMinimumSize(MIN_SIZE.width, MIN_SIZE.height)
    if (normalBounds) mainWindow.setBounds(normalBounds)
    mainWindow.setAlwaysOnTop(loadData().settings.alwaysOnTop)
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 820,
    minWidth: MIN_SIZE.width,
    minHeight: MIN_SIZE.height,
    show: false,
    // Sin marco de Windows: la app dibuja su propia barra de título pixel art
    frame: false,
    title: 'Flow Now!',
    icon,
    // Mismo tono que el fondo para evitar el destello blanco al abrir
    backgroundColor: nativeTheme.shouldUseDarkColors ? BG.dark : BG.light,
    alwaysOnTop: loadData().settings.alwaysOnTop,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      // El temporizador debe seguir avanzando con la ventana oculta en la bandeja
      backgroundThrottling: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    updateTaskbar({ status: 'idle', progress: 0 })
  })

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

  ipcMain.handle('achievements:save', (_, achievements: Record<string, string>) => {
    saveData({ ...loadData(), achievements })
  })

  ipcMain.handle('settings:save', (_, settings: Settings) => {
    saveData({ ...loadData(), settings })
    mainWindow?.setAlwaysOnTop(settings.alwaysOnTop)
    applyTheme(settings.theme)
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

  ipcMain.on('timer:state', (_, state: TimerState) => updateTaskbar(state))

  ipcMain.on('window:minimize', () => mainWindow?.minimize())
  ipcMain.on('window:close', () => mainWindow?.close())
  ipcMain.on('window:mini', (_, on: boolean) => setMini(on))
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', showWindow)

  app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.pakus.flownow')
    applyTheme(loadData().settings.theme)

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
