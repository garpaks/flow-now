import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  AppData,
  Goal,
  Session,
  Settings,
  SyncStatus,
  TimerCommand,
  TimerState
} from '../shared/types'

const api = {
  getData: (): Promise<AppData> => ipcRenderer.invoke('data:get'),
  addSession: (session: Session): Promise<void> => ipcRenderer.invoke('session:add', session),
  deleteSession: (id: string): Promise<void> => ipcRenderer.invoke('session:delete', id),
  saveGoals: (goals: Goal[], activeGoalId: string | null): Promise<void> =>
    ipcRenderer.invoke('goals:save', goals, activeGoalId),
  saveAchievements: (achievements: Record<string, string>): Promise<void> =>
    ipcRenderer.invoke('achievements:save', achievements),
  saveSettings: (settings: Settings): Promise<void> =>
    ipcRenderer.invoke('settings:save', settings),
  notify: (title: string, body: string): void => ipcRenderer.send('notify', title, body),
  setStatus: (text: string): void => ipcRenderer.send('status', text),
  setTimerState: (state: TimerState): void => ipcRenderer.send('timer:state', state),
  onTimerCommand: (cb: (command: TimerCommand) => void): (() => void) => {
    const listener = (_: unknown, command: TimerCommand): void => cb(command)
    ipcRenderer.on('timer:command', listener)
    return () => ipcRenderer.removeListener('timer:command', listener)
  },
  minimize: (): void => ipcRenderer.send('window:minimize'),
  close: (): void => ipcRenderer.send('window:close'),
  setMini: (on: boolean): void => ipcRenderer.send('window:mini', on),
  syncStatus: (): Promise<SyncStatus> => ipcRenderer.invoke('sync:status'),
  syncConnect: (): Promise<string | null> => ipcRenderer.invoke('sync:connect'),
  syncDisconnect: (): Promise<void> => ipcRenderer.invoke('sync:disconnect'),
  syncNow: (): Promise<void> => ipcRenderer.invoke('sync:now'),
  onSyncStatus: (cb: (status: SyncStatus) => void): (() => void) => {
    const listener = (_: unknown, status: SyncStatus): void => cb(status)
    ipcRenderer.on('sync:status', listener)
    return () => ipcRenderer.removeListener('sync:status', listener)
  },
  onDataChanged: (cb: (data: AppData) => void): (() => void) => {
    const listener = (_: unknown, data: AppData): void => cb(data)
    ipcRenderer.on('data:changed', listener)
    return () => ipcRenderer.removeListener('data:changed', listener)
  }
}

export type Api = typeof api

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
