import type { Goal, Session } from '../../shared/types'
import type { ArtName } from './pixelArt'
import { dayKey } from './utils'

export type Tier = 'bronze' | 'silver' | 'gold'

interface Stats {
  pomodoros: number
  minutes: number
  longestStreak: number
  bestDay: number
  earlyBird: boolean
  nightOwl: boolean
  weekend: boolean
  goalsCreated: number
  goalsDone: number
  bestGoal: number
  categories: number
  level: number
}

interface Definition {
  id: string
  title: string
  description: string
  icon: ArtName
  tier: Tier
  /** [valor actual, objetivo] */
  progress: (s: Stats) => [number, number]
}

const count = (value: number, target: number): [number, number] => [value, target]
const flag = (value: boolean): [number, number] => [value ? 1 : 0, 1]

export const ACHIEVEMENTS: Definition[] = [
  {
    id: 'pomo-1',
    title: 'Primer paso',
    description: 'Completa tu primer pomodoro',
    icon: 'tomato',
    tier: 'bronze',
    progress: (s) => count(s.pomodoros, 1)
  },
  {
    id: 'pomo-10',
    title: 'Calentando motores',
    description: 'Completa 10 pomodoros',
    icon: 'tomato',
    tier: 'bronze',
    progress: (s) => count(s.pomodoros, 10)
  },
  {
    id: 'pomo-50',
    title: 'Imparable',
    description: 'Completa 50 pomodoros',
    icon: 'tomato',
    tier: 'silver',
    progress: (s) => count(s.pomodoros, 50)
  },
  {
    id: 'pomo-100',
    title: 'Centurión',
    description: 'Completa 100 pomodoros',
    icon: 'tomato',
    tier: 'gold',
    progress: (s) => count(s.pomodoros, 100)
  },
  {
    id: 'pomo-500',
    title: 'Leyenda',
    description: 'Completa 500 pomodoros',
    icon: 'crown',
    tier: 'gold',
    progress: (s) => count(s.pomodoros, 500)
  },
  {
    id: 'hours-10',
    title: 'Diez horas',
    description: 'Acumula 10 horas de enfoque',
    icon: 'bolt',
    tier: 'bronze',
    progress: (s) => count(Math.floor(s.minutes / 60), 10)
  },
  {
    id: 'hours-50',
    title: 'Maratonista',
    description: 'Acumula 50 horas de enfoque',
    icon: 'bolt',
    tier: 'silver',
    progress: (s) => count(Math.floor(s.minutes / 60), 50)
  },
  {
    id: 'hours-200',
    title: 'Maestro del flow',
    description: 'Acumula 200 horas de enfoque',
    icon: 'bolt',
    tier: 'gold',
    progress: (s) => count(Math.floor(s.minutes / 60), 200)
  },
  {
    id: 'streak-3',
    title: 'En racha',
    description: '3 días seguidos con pomodoros',
    icon: 'flame',
    tier: 'bronze',
    progress: (s) => count(s.longestStreak, 3)
  },
  {
    id: 'streak-7',
    title: 'Semana perfecta',
    description: '7 días seguidos con pomodoros',
    icon: 'flame',
    tier: 'silver',
    progress: (s) => count(s.longestStreak, 7)
  },
  {
    id: 'streak-30',
    title: 'Hábito de hierro',
    description: '30 días seguidos con pomodoros',
    icon: 'flame',
    tier: 'gold',
    progress: (s) => count(s.longestStreak, 30)
  },
  {
    id: 'day-4',
    title: 'Día productivo',
    description: '4 pomodoros en un mismo día',
    icon: 'star',
    tier: 'bronze',
    progress: (s) => count(s.bestDay, 4)
  },
  {
    id: 'day-8',
    title: 'Jornada épica',
    description: '8 pomodoros en un mismo día',
    icon: 'star',
    tier: 'silver',
    progress: (s) => count(s.bestDay, 8)
  },
  {
    id: 'day-12',
    title: 'Modo dios',
    description: '12 pomodoros en un mismo día',
    icon: 'star',
    tier: 'gold',
    progress: (s) => count(s.bestDay, 12)
  },
  {
    id: 'early',
    title: 'Madrugador',
    description: 'Empieza un pomodoro entre las 5:00 y las 8:00',
    icon: 'sunrise',
    tier: 'bronze',
    progress: (s) => flag(s.earlyBird)
  },
  {
    id: 'night',
    title: 'Búho nocturno',
    description: 'Empieza un pomodoro después de las 22:00',
    icon: 'owl',
    tier: 'bronze',
    progress: (s) => flag(s.nightOwl)
  },
  {
    id: 'weekend',
    title: 'Guerrero de finde',
    description: 'Completa un pomodoro en sábado o domingo',
    icon: 'tomato',
    tier: 'bronze',
    progress: (s) => flag(s.weekend)
  },
  {
    id: 'goal-new',
    title: 'Con propósito',
    description: 'Crea tu primera misión',
    icon: 'target',
    tier: 'bronze',
    progress: (s) => count(s.goalsCreated, 1)
  },
  {
    id: 'goal-done-1',
    title: 'Misión cumplida',
    description: 'Completa una misión',
    icon: 'target',
    tier: 'bronze',
    progress: (s) => count(s.goalsDone, 1)
  },
  {
    id: 'goal-done-5',
    title: 'Agente de élite',
    description: 'Completa 5 misiones',
    icon: 'target',
    tier: 'silver',
    progress: (s) => count(s.goalsDone, 5)
  },
  {
    id: 'goal-focus',
    title: 'Enfocado',
    description: '10 pomodoros en una misma misión',
    icon: 'target',
    tier: 'silver',
    progress: (s) => count(s.bestGoal, 10)
  },
  {
    id: 'categories',
    title: 'Todoterreno',
    description: 'Usa 3 categorías distintas en tus misiones',
    icon: 'star',
    tier: 'bronze',
    progress: (s) => count(s.categories, 3)
  },
  {
    id: 'level-5',
    title: 'Nivel 5',
    description: 'Alcanza el nivel 5',
    icon: 'trophy',
    tier: 'silver',
    progress: (s) => count(s.level, 5)
  },
  {
    id: 'level-10',
    title: 'Nivel 10',
    description: 'Alcanza el nivel 10',
    icon: 'trophy',
    tier: 'gold',
    progress: (s) => count(s.level, 10)
  }
]

function longestStreak(days: string[]): number {
  const sorted = [...new Set(days)].sort()
  let best = 0
  let run = 0
  let prev: Date | null = null
  for (const key of sorted) {
    const [y, m, d] = key.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    // Diferencia de días redondeada para no fallar con los cambios de horario
    const consecutive = prev && Math.round((date.getTime() - prev.getTime()) / 86_400_000) === 1
    run = consecutive ? run + 1 : 1
    best = Math.max(best, run)
    prev = date
  }
  return best
}

function computeStats(sessions: Session[], goals: Goal[], level: number): Stats {
  const done = sessions.filter((s) => s.completed)
  const perDay = new Map<string, number>()
  const perGoal = new Map<string, number>()
  for (const s of done) {
    const key = dayKey(s.startedAt)
    perDay.set(key, (perDay.get(key) ?? 0) + 1)
    if (s.goalId) perGoal.set(s.goalId, (perGoal.get(s.goalId) ?? 0) + 1)
  }
  const hours = sessions.map((s) => new Date(s.startedAt).getHours())
  return {
    pomodoros: done.length,
    minutes: done.reduce((sum, s) => sum + s.durationMin, 0),
    longestStreak: longestStreak([...perDay.keys()]),
    bestDay: Math.max(0, ...perDay.values()),
    earlyBird: hours.some((h) => h >= 5 && h < 8),
    nightOwl: hours.some((h) => h >= 22 || h < 3),
    weekend: done.some((s) => [0, 6].includes(new Date(s.startedAt).getDay())),
    goalsCreated: goals.length,
    goalsDone: goals.filter((g) => g.done).length,
    bestGoal: Math.max(0, ...perGoal.values()),
    categories: new Set(goals.map((g) => g.category).filter(Boolean)).size,
    level
  }
}

export interface AchievementStatus extends Omit<Definition, 'progress'> {
  current: number
  target: number
  unlocked: boolean
}

export function evaluateAchievements(
  sessions: Session[],
  goals: Goal[],
  level: number
): AchievementStatus[] {
  const stats = computeStats(sessions, goals, level)
  return ACHIEVEMENTS.map(({ progress, ...def }) => {
    const [current, target] = progress(stats)
    return { ...def, current: Math.min(current, target), target, unlocked: current >= target }
  })
}
