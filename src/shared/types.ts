export interface Session {
  id: string
  title: string
  startedAt: string
  endedAt: string
  durationMin: number
  completed: boolean
  goalId?: string
}

export interface Goal {
  id: string
  title: string
  createdAt: string
  done: boolean
  doneAt?: string
  category?: string
  /** Última modificación; decide qué versión gana al sincronizar entre equipos */
  updatedAt?: string
}

export const DEFAULT_CATEGORIES = ['Trabajo', 'Casa', 'Escuela']

export interface Settings {
  work: number
  shortBreak: number
  longBreak: number
  longEvery: number
  sound: boolean
  alwaysOnTop: boolean
  theme: Theme
}

export type Theme = 'system' | 'light' | 'dark'

// Estado del temporizador que el renderer envía al proceso principal (barra de tareas)
export interface TimerState {
  status: 'idle' | 'running' | 'paused'
  progress: number
}

export type TimerCommand = 'toggle' | 'skip'

export interface AppData {
  sessions: Session[]
  goals: Goal[]
  activeGoalId: string | null
  settings: Settings
  /** Logros desbloqueados: id → fecha ISO. null = aún no inicializados (instalación previa) */
  achievements: Record<string, string> | null
  /** Registro de borrados (id → fecha) para que la sincronización no los resucite */
  deleted: Deleted
}

export interface Deleted {
  sessions: Record<string, string>
  goals: Record<string, string>
}

export interface SyncStatus {
  /** Esta compilación incluye credenciales de Google */
  configured: boolean
  connected: boolean
  email?: string
  state: 'idle' | 'syncing' | 'error'
  lastSync?: string
  error?: string
}

export const DEFAULT_SETTINGS: Settings = {
  work: 25,
  shortBreak: 5,
  longBreak: 15,
  longEvery: 4,
  sound: true,
  alwaysOnTop: false,
  theme: 'system'
}
