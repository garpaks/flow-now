import { ElectronAPI } from '@electron-toolkit/preload'
import type { AppData, Goal, Session, Settings, TimerCommand, TimerState } from '../shared/types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getData: () => Promise<AppData>
      addSession: (session: Session) => Promise<void>
      deleteSession: (id: string) => Promise<void>
      saveGoals: (goals: Goal[], activeGoalId: string | null) => Promise<void>
      saveAchievements: (achievements: Record<string, string>) => Promise<void>
      saveSettings: (settings: Settings) => Promise<void>
      notify: (title: string, body: string) => void
      setStatus: (text: string) => void
      setTimerState: (state: TimerState) => void
      onTimerCommand: (cb: (command: TimerCommand) => void) => () => void
      minimize: () => void
      close: () => void
      setMini: (on: boolean) => void
    }
  }
}
