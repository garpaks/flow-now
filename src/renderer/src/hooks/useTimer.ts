import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Settings } from '../../../shared/types'

export type Phase = 'work' | 'shortBreak' | 'longBreak'
export type Status = 'idle' | 'running' | 'paused'

export interface WorkResult {
  startedAt: string
  endedAt: string
  durationMin: number
  completed: boolean
}

interface Handlers {
  // Fin (o interrupción) de una fase de trabajo; no se llama si duró menos de 1 minuto
  onWorkEnd: (result: WorkResult) => void
  // Una fase llegó a 0 por sí sola
  onPhaseComplete: (finished: Phase, next: Phase) => void
}

const MIN_RECORD_MS = 60_000

function phaseMs(phase: Phase, s: Settings): number {
  const min = phase === 'work' ? s.work : phase === 'shortBreak' ? s.shortBreak : s.longBreak
  return min * 60_000
}

/**
 * Temporizador basado en el instante de fin (endAt), no en contar ticks:
 * así no se desfasa aunque la ventana esté minimizada o el equipo vaya lento.
 */
export interface TimerApi {
  phase: Phase
  status: Status
  remaining: number
  completedWork: number
  start: () => void
  pause: () => void
  skip: () => void
  reset: () => void
  switchTo: (phase: Phase) => void
}

export function useTimer(settings: Settings, handlers: Handlers): TimerApi {
  const [phase, setPhase] = useState<Phase>('work')
  const [status, setStatus] = useState<Status>('idle')
  const [remaining, setRemaining] = useState(() => phaseMs('work', settings))
  const [completedWork, setCompletedWork] = useState(0)

  // Refs espejo para leer el último valor desde callbacks e intervalos
  const handlersRef = useRef(handlers)
  const remainingRef = useRef(remaining)
  useLayoutEffect(() => {
    handlersRef.current = handlers
    remainingRef.current = remaining
  })

  const endAtRef = useRef<number | null>(null)
  const startedAtRef = useRef<Date | null>(null)
  const durationRef = useRef(phaseMs('work', settings))

  // Con el temporizador parado, aplicar cambios de ajustes a la fase actual
  useEffect(() => {
    if (status !== 'idle') return
    durationRef.current = phaseMs(phase, settings)
    setRemaining(durationRef.current)
  }, [settings, phase, status])

  const recordWork = useCallback((completed: boolean) => {
    if (!startedAtRef.current) return
    const elapsed = completed ? durationRef.current : durationRef.current - remainingRef.current
    if (elapsed >= MIN_RECORD_MS) {
      handlersRef.current.onWorkEnd({
        startedAt: startedAtRef.current.toISOString(),
        endedAt: new Date().toISOString(),
        durationMin: Math.round(elapsed / 60_000),
        completed
      })
    }
    startedAtRef.current = null
  }, [])

  const goTo = useCallback(
    (next: Phase, autoStart: boolean) => {
      const ms = phaseMs(next, settings)
      durationRef.current = ms
      setPhase(next)
      setRemaining(ms)
      if (autoStart) {
        endAtRef.current = Date.now() + ms
        setStatus('running')
      } else {
        endAtRef.current = null
        setStatus('idle')
      }
    },
    [settings]
  )

  const nextAfterWork = useCallback(
    (doneCount: number): Phase =>
      doneCount > 0 && doneCount % settings.longEvery === 0 ? 'longBreak' : 'shortBreak',
    [settings.longEvery]
  )

  const complete = useCallback(() => {
    if (phase === 'work') {
      recordWork(true)
      const done = completedWork + 1
      setCompletedWork(done)
      const next = nextAfterWork(done)
      handlersRef.current.onPhaseComplete('work', next)
      goTo(next, true)
    } else {
      handlersRef.current.onPhaseComplete(phase, 'work')
      goTo('work', false)
    }
  }, [phase, completedWork, recordWork, nextAfterWork, goTo])

  useEffect(() => {
    if (status !== 'running') return
    const id = setInterval(() => {
      const left = (endAtRef.current ?? 0) - Date.now()
      if (left <= 0) {
        clearInterval(id)
        setRemaining(0)
        complete()
      } else {
        setRemaining(left)
      }
    }, 250)
    return () => clearInterval(id)
  }, [status, complete])

  const start = useCallback(() => {
    if (phase === 'work' && !startedAtRef.current) startedAtRef.current = new Date()
    endAtRef.current = Date.now() + remainingRef.current
    setStatus('running')
  }, [phase])

  const pause = useCallback(() => {
    if (endAtRef.current) setRemaining(Math.max(0, endAtRef.current - Date.now()))
    endAtRef.current = null
    setStatus('paused')
  }, [])

  // Saltar: termina la fase actual sin esperar; el trabajo interrumpido se guarda como incompleto
  const skip = useCallback(() => {
    if (phase === 'work') {
      recordWork(false)
      goTo(nextAfterWork(completedWork), false)
    } else {
      goTo('work', false)
    }
  }, [phase, completedWork, recordWork, nextAfterWork, goTo])

  const reset = useCallback(() => {
    if (phase === 'work') recordWork(false)
    goTo(phase, false)
  }, [phase, recordWork, goTo])

  // Cambio manual de fase (p. ej. tomar una pausa larga cuando quieras)
  const switchTo = useCallback(
    (next: Phase) => {
      if (next === phase) return
      if (phase === 'work') recordWork(false)
      goTo(next, false)
    },
    [phase, recordWork, goTo]
  )

  return { phase, status, remaining, completedWork, start, pause, skip, reset, switchTo }
}
