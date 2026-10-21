import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { AppData, Goal, Session, Settings } from '../shared/types'

const api = {
  getData: (): Promise<AppData> => ipcRenderer.invoke('data:get'),
  addSession: (session: Session): Promise<void> => ipcRenderer.invoke('session:add', session),
  deleteSession: (id: string): Promise<void> => ipcRenderer.invoke('session:delete', id),
  saveGoals: (goals: Goal[], activeGoalId: string | null): Promise<void> =>
    ipcRenderer.invoke('goals:save', goals, activeGoalId),
  saveSettings: (settings: Settings): Promise<void> =>
    ipcRenderer.invoke('settings:save', settings),
  notify: (title: string, body: string): void => ipcRenderer.send('notify', title, body),
  setStatus: (text: string): void => ipcRenderer.send('status', text)
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
