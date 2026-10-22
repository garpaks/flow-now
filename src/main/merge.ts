import type { AppData, Deleted, Goal, Session } from '../shared/types'

/** Lo que se guarda en la nube: los ajustes y la misión elegida son propios de cada equipo. */
export interface RemoteData {
  version: 1
  sessions: Session[]
  goals: Goal[]
  achievements: Record<string, string>
  deleted: Deleted
}

const goalStamp = (g: Goal): string => g.updatedAt ?? g.doneAt ?? g.createdAt

function unionById<T extends { id: string }>(
  a: T[],
  b: T[],
  deleted: Record<string, string>,
  pick: (x: T, y: T) => T
): T[] {
  const map = new Map<string, T>()
  for (const item of [...a, ...b]) {
    if (deleted[item.id]) continue
    const prev = map.get(item.id)
    map.set(item.id, prev ? pick(prev, item) : item)
  }
  return [...map.values()]
}

/**
 * Fusiona los datos locales con los de la nube sin perder nada:
 * - pomodoros y misiones: unión por id (gana la misión modificada más tarde)
 * - borrados: se respetan en ambos sentidos
 * - logros: unión, conservando la fecha más antigua
 * El resultado no depende del orden, así que dos equipos convergen al mismo estado.
 */
export function mergeData(local: AppData, remote: RemoteData): AppData {
  const deleted: Deleted = {
    sessions: { ...remote.deleted.sessions, ...local.deleted.sessions },
    goals: { ...remote.deleted.goals, ...local.deleted.goals }
  }
  const sessions = unionById(local.sessions, remote.sessions, deleted.sessions, (x) => x).sort(
    (a, b) => a.startedAt.localeCompare(b.startedAt)
  )
  const goals = unionById(local.goals, remote.goals, deleted.goals, (x, y) =>
    goalStamp(y) > goalStamp(x) ? y : x
  ).sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  let achievements: Record<string, string> | null = local.achievements
  if (local.achievements || Object.keys(remote.achievements).length) {
    achievements = { ...remote.achievements }
    for (const [id, date] of Object.entries(local.achievements ?? {})) {
      if (!achievements[id] || date < achievements[id]) achievements[id] = date
    }
  }

  const activeGoalId =
    local.activeGoalId && goals.some((g) => g.id === local.activeGoalId && !g.done)
      ? local.activeGoalId
      : null

  return { ...local, sessions, goals, achievements, deleted, activeGoalId }
}

export function toRemote(data: AppData): RemoteData {
  return {
    version: 1,
    sessions: data.sessions,
    goals: data.goals,
    achievements: data.achievements ?? {},
    deleted: data.deleted
  }
}

export function parseRemote(raw: unknown): RemoteData {
  const r = (raw ?? {}) as Partial<RemoteData>
  return {
    version: 1,
    sessions: Array.isArray(r.sessions) ? r.sessions : [],
    goals: Array.isArray(r.goals) ? r.goals : [],
    achievements: r.achievements ?? {},
    deleted: { sessions: r.deleted?.sessions ?? {}, goals: r.deleted?.goals ?? {} }
  }
}
