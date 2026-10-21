import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  DEFAULT_SETTINGS,
  type Goal,
  type Session,
  type Settings,
  type TimerCommand
} from '../../shared/types'
import { useTimer, type Phase, type WorkResult } from './hooks/useTimer'
import Timer from './components/Timer'
import History from './components/History'
import Goals from './components/Goals'
import Schedule from './components/Schedule'
import SettingsModal from './components/Settings'
import Titlebar from './components/Titlebar'
import Hud from './components/Hud'
import MiniView from './components/MiniView'
import Celebration, { type CelebrationData } from './components/Celebration'
import { formatClock, PHASE_LABEL } from './utils'
import { levelInfo, streakDays, totalXp } from './progress'
import { sfx } from './sounds'

type Tab = 'history' | 'goals' | 'schedule'
const TABS: { id: Tab; label: string }[] = [
  { id: 'history', label: 'Historial' },
  { id: 'goals', label: 'Misiones' },
  { id: 'schedule', label: 'Horarios' }
]

function App(): React.JSX.Element {
  const [loaded, setLoaded] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [goals, setGoals] = useState<Goal[]>([])
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('history')
  const [title, setTitle] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [mini, setMini] = useState(false)
  const [celebration, setCelebration] = useState<CelebrationData | null>(null)
  // Nivel alcanzado con el último pomodoro (si subió), para elegir la celebración
  const levelUpRef = useRef<number | null>(null)

  useEffect(() => {
    window.api.getData().then((data) => {
      setSessions(data.sessions)
      setGoals(data.goals)
      setActiveGoalId(data.activeGoalId)
      setSettings(data.settings)
      setLoaded(true)
    })
  }, [])

  const xp = useMemo(() => totalXp(sessions), [sessions])
  const level = useMemo(() => levelInfo(xp), [xp])
  const streak = useMemo(() => streakDays(sessions), [sessions])

  const celebrate = (data: Omit<CelebrationData, 'id'>): void =>
    setCelebration({ ...data, id: Date.now() })
  const closeCelebration = useCallback(() => setCelebration(null), [])
  const playSound = (sound: () => void): void => {
    if (settings.sound) sound()
  }

  const timer = useTimer(settings, {
    onWorkEnd: (result: WorkResult) => {
      const session: Session = {
        id: crypto.randomUUID(),
        title: title.trim(),
        ...result,
        ...(activeGoalId ? { goalId: activeGoalId } : {})
      }
      setSessions((prev) => [...prev, session])
      window.api.addSession(session)
      const after = levelInfo(xp + (result.completed ? result.durationMin : 0)).level
      levelUpRef.current = after > level.level ? after : null
    },
    onPhaseComplete: (finished: Phase, next: Phase) => {
      if (finished === 'work') {
        const newLevel = levelUpRef.current
        levelUpRef.current = null
        if (newLevel) {
          playSound(sfx.levelUp)
          celebrate({
            kind: 'level',
            title: `¡NIVEL ${newLevel}!`,
            subtitle: 'Has subido de nivel'
          })
        } else {
          playSound(sfx.complete)
          celebrate({
            kind: 'pomodoro',
            title: '¡POMODORO COMPLETADO!',
            subtitle: `+${settings.work} XP · toca ${PHASE_LABEL[next].toLowerCase()}`
          })
        }
        window.api.notify(
          '¡Pomodoro completado! 🍅',
          `"${title.trim()}" — toca ${PHASE_LABEL[next].toLowerCase()}`
        )
      } else {
        playSound(sfx.breakOver)
        window.api.notify('Pausa terminada', 'Escribe tu próxima tarea y pulsa Iniciar')
      }
    }
  })

  const total =
    (timer.phase === 'work'
      ? settings.work
      : timer.phase === 'shortBreak'
        ? settings.shortBreak
        : settings.longBreak) * 60_000
  const progress = total > 0 ? 1 - timer.remaining / total : 0
  const canStart = timer.phase !== 'work' || title.trim().length > 0

  const start = (): void => {
    playSound(sfx.start)
    timer.start()
  }
  const pause = (): void => {
    playSound(sfx.pause)
    timer.pause()
  }
  const toggle = (): void => {
    if (timer.status === 'running') pause()
    else if (canStart) start()
    else window.api.notify('Flow Now!', 'Escribe en qué vas a trabajar para empezar')
  }

  // Botones ▶/⏸ y ⏭ de la miniatura en la barra de tareas
  const commandRef = useRef<(command: TimerCommand) => void>(() => {})
  useLayoutEffect(() => {
    commandRef.current = (command) => (command === 'toggle' ? toggle() : timer.skip())
  })
  useEffect(() => window.api.onTimerCommand((command) => commandRef.current(command)), [])

  // Progreso en la barra de tareas (redondeado para no saturar el IPC)
  const progressStep = Math.round(progress * 200)
  useEffect(() => {
    window.api.setTimerState({ status: timer.status, progress: progressStep / 200 })
  }, [timer.status, progressStep])

  // Título de ventana y tooltip de la bandeja: "12:34 – tarea"
  const clock = formatClock(timer.remaining)
  const label = timer.phase === 'work' ? title.trim() || 'Flow Now!' : PHASE_LABEL[timer.phase]
  const statusText = timer.status === 'idle' ? 'Flow Now!' : `${clock} – ${label}`
  useEffect(() => {
    window.api.setStatus(statusText)
  }, [statusText])

  const toggleMini = (on: boolean): void => {
    setMini(on)
    window.api.setMini(on)
  }

  const saveSettings = (next: Settings): void => {
    setSettings(next)
    window.api.saveSettings(next)
    setShowSettings(false)
  }

  const updateGoals = (next: Goal[], nextActive: string | null): void => {
    setGoals(next)
    setActiveGoalId(nextActive)
    window.api.saveGoals(next, nextActive)
  }

  const addGoal = (goalTitle: string, category: string): void => {
    const goal: Goal = {
      id: crypto.randomUUID(),
      title: goalTitle,
      createdAt: new Date().toISOString(),
      done: false,
      ...(category ? { category } : {})
    }
    // Si no hay ninguna elegida, la nueva pasa a ser la misión actual
    updateGoals([...goals, goal], activeGoalId ?? goal.id)
  }

  const toggleGoalDone = (id: string): void => {
    const next = goals.map((g) =>
      g.id === id
        ? { ...g, done: !g.done, doneAt: g.done ? undefined : new Date().toISOString() }
        : g
    )
    const goal = next.find((g) => g.id === id)
    if (goal?.done) {
      playSound(sfx.mission)
      celebrate({ kind: 'mission', title: '¡MISIÓN COMPLETADA!', subtitle: goal.title })
    }
    updateGoals(next, goal?.done && activeGoalId === id ? null : activeGoalId)
  }

  const setGoalCategory = (id: string, category: string): void => {
    updateGoals(
      goals.map((g) => (g.id === id ? { ...g, category: category || undefined } : g)),
      activeGoalId
    )
  }

  const deleteGoal = (id: string): void => {
    updateGoals(
      goals.filter((g) => g.id !== id),
      activeGoalId === id ? null : activeGoalId
    )
  }

  const deleteSession = (id: string): void => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
    window.api.deleteSession(id)
  }

  if (!loaded) return <div className="app" />

  const celebrationLayer = celebration && (
    <Celebration data={celebration} onDone={closeCelebration} />
  )

  if (mini) {
    return (
      <div className={`app is-mini phase-${timer.phase} is-${timer.status}`}>
        <MiniView
          phase={timer.phase}
          status={timer.status}
          remaining={timer.remaining}
          total={total}
          title={title}
          canStart={canStart}
          onToggle={toggle}
          onSkip={timer.skip}
          onExpand={() => toggleMini(false)}
        />
        {celebrationLayer}
      </div>
    )
  }

  return (
    <div className={`app phase-${timer.phase} is-${timer.status}`}>
      <Titlebar onSettings={() => setShowSettings(true)} onMini={() => toggleMini(true)} />
      <Hud level={level} streak={streak} />
      <div className="main">
        <div className="col-left">
          <Timer
            phase={timer.phase}
            status={timer.status}
            remaining={timer.remaining}
            total={total}
            completedWork={timer.completedWork}
            longEvery={settings.longEvery}
            title={title}
            onTitleChange={setTitle}
            goals={goals.filter((g) => !g.done)}
            activeGoalId={activeGoalId}
            onGoalChange={(id) => updateGoals(goals, id)}
            onStart={start}
            onPause={pause}
            onSkip={timer.skip}
            onReset={timer.reset}
            onSwitch={timer.switchTo}
          />
        </div>
        <div className="col-right">
          <nav
            className="tabs"
            style={
              {
                '--idx': TABS.findIndex((t) => t.id === tab),
                '--n': TABS.length
              } as React.CSSProperties
            }
          >
            <span className="slider" />
            {TABS.map((t) => (
              <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </nav>
          {tab === 'schedule' ? (
            <Schedule sessions={sessions} goals={goals} />
          ) : tab === 'history' ? (
            <History
              sessions={sessions}
              goals={goals}
              onDelete={deleteSession}
              onReuse={(t) => timer.phase === 'work' && setTitle(t)}
            />
          ) : (
            <Goals
              goals={goals}
              sessions={sessions}
              activeGoalId={activeGoalId}
              onAdd={addGoal}
              onSelect={(id) => updateGoals(goals, id)}
              onToggleDone={toggleGoalDone}
              onSetCategory={setGoalCategory}
              onDelete={deleteGoal}
            />
          )}
        </div>
      </div>
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={saveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
      {celebrationLayer}
    </div>
  )
}

export default App
