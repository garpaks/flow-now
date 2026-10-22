import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { AppData, DEFAULT_SETTINGS } from '../shared/types'

const dataPath = (): string => join(app.getPath('userData'), 'data.json')

let cache: AppData | null = null

export function loadData(): AppData {
  if (cache) return cache
  let parsed: Partial<AppData> = {}
  try {
    if (existsSync(dataPath())) parsed = JSON.parse(readFileSync(dataPath(), 'utf-8'))
  } catch (err) {
    console.error('No se pudo leer data.json, se empieza vacío', err)
  }
  cache = {
    sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    goals: Array.isArray(parsed.goals) ? parsed.goals : [],
    activeGoalId: parsed.activeGoalId ?? null,
    achievements: parsed.achievements ?? null,
    settings: { ...DEFAULT_SETTINGS, ...parsed.settings }
  }
  return cache
}

export function saveData(data: AppData): void {
  cache = data
  const file = dataPath()
  mkdirSync(dirname(file), { recursive: true })
  // Escritura atómica: si la app se cierra a mitad, data.json no queda corrupto
  const tmp = `${file}.tmp`
  writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8')
  renameSync(tmp, file)
}
