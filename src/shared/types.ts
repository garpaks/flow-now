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
