import type { Session } from '../../shared/types'
import { dayKey } from './utils'

// 1 XP por minuto de enfoque completado. Para llegar al nivel n hacen falta 50·n·(n−1) XP:
// nivel 2 = 100 XP (4 pomodoros), nivel 3 = 300, nivel 4 = 600, nivel 5 = 1000…
const xpForLevel = (level: number): number => 50 * level * (level - 1)

export interface LevelInfo {
  level: number
  /** XP conseguida dentro del nivel actual */
  into: number
  /** XP que separa el nivel actual del siguiente */
  needed: number
}

export function totalXp(sessions: Session[]): number {
  return sessions.filter((s) => s.completed).reduce((sum, s) => sum + s.durationMin, 0)
}

export function levelInfo(xp: number): LevelInfo {
  let level = 1
  while (xp >= xpForLevel(level + 1)) level++
  const base = xpForLevel(level)
  return { level, into: xp - base, needed: xpForLevel(level + 1) - base }
}

/** Días seguidos con al menos un pomodoro completado; si hoy aún no hay, cuenta desde ayer. */
export function streakDays(sessions: Session[]): number {
  const days = new Set(sessions.filter((s) => s.completed).map((s) => dayKey(s.startedAt)))
  const cursor = new Date()
  if (!days.has(dayKey(cursor.toISOString()))) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (days.has(dayKey(cursor.toISOString()))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
