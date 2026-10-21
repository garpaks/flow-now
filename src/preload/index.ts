import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { AppData, Goal, Session, Settings, TimerCommand, TimerState } from '../shared/types'

const api = {
  getData: (): Promise<AppData> => ipcRenderer.invoke('data:get'),
  addSession: (session: Session): Promise<void> => ipcRenderer.invoke('session:add', session),
  deleteSession: (id: string): Promise<void> => ipcRenderer.invoke('session:delete', id),
  saveGoals: (goals: Goal[], activeGoalId: string | null): Promise<void> =>
    ipcRenderer.invoke('goals:save', goals, activeGoalId),
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
  setMini: (on: boolean): void => ipcRenderer.send('window:mini', on)
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
