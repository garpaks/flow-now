import { ElectronAPI } from '@electron-toolkit/preload'
import type { AppData, Goal, Session, Settings } from '../shared/types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getData: () => Promise<AppData>
      addSession: (session: Session) => Promise<void>
      deleteSession: (id: string) => Promise<void>
      saveGoals: (goals: Goal[], activeGoalId: string | null) => Promise<void>
      saveSettings: (settings: Settings) => Promise<void>
      notify: (title: string, body: string) => void
      setStatus: (text: string) => void
    }
  }
}
