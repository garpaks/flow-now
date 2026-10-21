import type { Phase } from './hooks/useTimer'

export const PHASE_LABEL: Record<Phase, string> = {
  work: 'Enfoque',
  shortBreak: 'Pausa corta',
  longBreak: 'Pausa larga'
}

export const PHASE_MOOD: Record<Phase, string> = {
  work: '~ a fluir, sin prisa ~',
  shortBreak: '~ respira y estírate ~',
  longBreak: '~ un té, te lo has ganado ~'
}

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

// Clave de día en hora local (toISOString usaría UTC y mezclaría días)
export function dayKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function dayLabel(key: string): string {
  const today = dayKey(new Date().toISOString())
  const yesterday = dayKey(new Date(Date.now() - 86_400_000).toISOString())
  if (key === today) return 'Hoy'
  if (key === yesterday) return 'Ayer'
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })
}

export function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

export function timeRange(s: { startedAt: string; endedAt: string }): string {
  return `${timeOf(s.startedAt)}–${timeOf(s.endedAt)}`
}

// Color estable por categoría: las de serie tienen uno fijo, el resto se reparte por hash
const CATEGORY_COLORS = ['var(--long)', 'var(--break)', 'var(--star)', 'var(--work)']
const FIXED_CATEGORY_COLOR: Record<string, string> = {
  trabajo: 'var(--long)',
  casa: 'var(--break)',
  escuela: 'var(--star)'
}

export function categoryColor(category: string): string {
  const key = category.trim().toLowerCase()
  if (FIXED_CATEGORY_COLOR[key]) return FIXED_CATEGORY_COLOR[key]
  let hash = 0
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length]
}
