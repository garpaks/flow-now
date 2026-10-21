import { useEffect, useState } from 'react'
import { DEFAULT_SETTINGS, type Goal, type Session, type Settings } from '../../shared/types'
import { useTimer, type Phase, type WorkResult } from './hooks/useTimer'
import Timer from './components/Timer'
import History from './components/History'
import Goals from './components/Goals'
import Schedule from './components/Schedule'
import SettingsModal from './components/Settings'
import { beep, formatClock, PHASE_LABEL } from './utils'
import PixelIcon from './components/PixelIcon'

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

  useEffect(() => {
    window.api.getData().then((data) => {
      setSessions(data.sessions)
      setGoals(data.goals)
      setActiveGoalId(data.activeGoalId)
      setSettings(data.settings)
      setLoaded(true)
    })
  }, [])

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
    },
    onPhaseComplete: (finished: Phase, next: Phase) => {
      if (settings.sound) beep()
      if (finished === 'work') {
        window.api.notify(
          '¡Pomodoro completado! 🍅',
          `"${title.trim()}" — toca ${PHASE_LABEL[next].toLowerCase()}`
        )
      } else {
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

  // Título de ventana y tooltip de la bandeja: "12:34 – tarea"
  const clock = formatClock(timer.remaining)
  const label = timer.phase === 'work' ? title.trim() || 'Flow Now!' : PHASE_LABEL[timer.phase]
  const statusText = timer.status === 'idle' ? 'Flow Now!' : `${clock} – ${label}`
  useEffect(() => {
    window.api.setStatus(statusText)
  }, [statusText])

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
    const nowDone = next.find((g) => g.id === id)?.done
    updateGoals(next, nowDone && activeGoalId === id ? null : activeGoalId)
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

  return (
    <div className={`app phase-${timer.phase} is-${timer.status}`}>
      <header className="topbar">
        <div className="logo">
          <PixelIcon art="wave" scale={3} className="logo-icon" />
          <span>FLOW NOW!</span>
        </div>
        <button
          className="settings-btn icon-btn spin"
          onClick={() => setShowSettings(true)}
          title="Ajustes"
        >
          <PixelIcon art="gear" />
        </button>
      </header>
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
        onStart={timer.start}
        onPause={timer.pause}
        onSkip={timer.skip}
        onReset={timer.reset}
        onSwitch={timer.switchTo}
      />
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
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={saveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

export default App
