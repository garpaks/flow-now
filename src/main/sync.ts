import { app, safeStorage, shell } from 'electron'
import { createHash, randomBytes } from 'crypto'
import { createServer } from 'http'
import type { AddressInfo } from 'net'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { AppData, SyncStatus } from '../shared/types'
import { loadData, saveData } from './store'
import { mergeData, parseRemote, toRemote } from './merge'

/*
 * Sincronización con Google Drive.
 * Los datos viven en la carpeta oculta "appDataFolder" de la cuenta del usuario: solo esta app
 * puede verla y la app no tiene acceso al resto del Drive (scope drive.appdata).
 */

const CLIENT_ID = import.meta.env.MAIN_VITE_GOOGLE_CLIENT_ID ?? ''
const CLIENT_SECRET = import.meta.env.MAIN_VITE_GOOGLE_CLIENT_SECRET ?? ''
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata openid email'
const FILE_NAME = 'flow-now.json'
const DEBOUNCE_MS = 3000
const INTERVAL_MS = 2 * 60_000
const LOGIN_TIMEOUT_MS = 5 * 60_000
const MISSING_SCOPE_MSG =
  'Falta el permiso de Google Drive. Vuelve a conectar y, en la pantalla de Google, marca la casilla de Drive ("Ver, crear y borrar sus propios datos de configuración").'

interface StoredAuth {
  refreshToken: string // cifrado con safeStorage (DPAPI en Windows), en base64
  email?: string
}

let status: SyncStatus = {
  configured: Boolean(CLIENT_ID && CLIENT_SECRET),
  connected: false,
  state: 'idle'
}
let accessToken: { value: string; expiresAt: number } | null = null
let fileId: string | null = null
let running = false
let rerun = false
let debounce: NodeJS.Timeout | null = null

let onStatus: (s: SyncStatus) => void = () => {}
let onData: (d: AppData) => void = () => {}

const authPath = (): string => join(app.getPath('userData'), 'google-auth.json')

function setStatus(patch: Partial<SyncStatus>): void {
  status = { ...status, ...patch }
  onStatus(status)
}

function readAuth(): StoredAuth | null {
  try {
    return existsSync(authPath()) ? JSON.parse(readFileSync(authPath(), 'utf-8')) : null
  } catch {
    return null
  }
}

function refreshToken(): string | null {
  const auth = readAuth()
  if (!auth) return null
  try {
    return safeStorage.decryptString(Buffer.from(auth.refreshToken, 'base64'))
  } catch {
    return null
  }
}

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function tokenRequest(params: Record<string, string>): Promise<Record<string, string>> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, ...params })
  })
  const json = (await res.json()) as Record<string, string>
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
  return json
}

async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < accessToken.expiresAt - 60_000) return accessToken.value
  const refresh = refreshToken()
  if (!refresh) throw new Error('not_connected')
  const json = await tokenRequest({ grant_type: 'refresh_token', refresh_token: refresh })
  accessToken = { value: json.access_token, expiresAt: Date.now() + Number(json.expires_in) * 1000 }
  return accessToken.value
}

async function drive(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken()
  const res = await fetch(`https://www.googleapis.com${path}`, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error(`Drive ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return res
}

async function findFile(): Promise<string | null> {
  if (fileId) return fileId
  const q = encodeURIComponent(`name='${FILE_NAME}'`)
  const res = await drive(`/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id)`)
  const json = (await res.json()) as { files: { id: string }[] }
  fileId = json.files[0]?.id ?? null
  return fileId
}

async function upload(body: string): Promise<void> {
  const id = await findFile()
  if (id) {
    await drive(`/upload/drive/v3/files/${id}?uploadType=media`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body
    })
    return
  }
  const boundary = `flownow${randomBytes(8).toString('hex')}`
  const metadata = JSON.stringify({ name: FILE_NAME, parents: ['appDataFolder'] })
  const multipart =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${boundary}--`
  const res = await drive('/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: multipart
  })
  fileId = ((await res.json()) as { id: string }).id
}

/** Descarga, fusiona con lo local, guarda y sube el resultado. */
export async function syncNow(): Promise<void> {
  if (!status.connected) return
  if (running) {
    rerun = true
    return
  }
  running = true
  setStatus({ state: 'syncing', error: undefined })
  try {
    const id = await findFile()
    const remoteRaw = id ? await (await drive(`/drive/v3/files/${id}?alt=media`)).text() : null
    const remote = parseRemote(remoteRaw ? JSON.parse(remoteRaw) : null)

    const local = loadData()
    const merged = mergeData(local, remote)
    if (JSON.stringify(toRemote(merged)) !== JSON.stringify(toRemote(local))) {
      saveData(merged)
      onData(merged)
    }
    const body = JSON.stringify(toRemote(merged))
    if (body !== JSON.stringify(remote)) await upload(body)
    setStatus({ state: 'idle', lastSync: new Date().toISOString() })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    // Acceso revocado o caducado: hay que volver a conectar
    if (message === 'invalid_grant' || message === 'not_connected') {
      disconnect()
      setStatus({ state: 'error', error: 'La sesión de Google caducó. Vuelve a conectar.' })
    } else if (message.includes('insufficient authentication scopes')) {
      disconnect()
      setStatus({ state: 'error', error: MISSING_SCOPE_MSG })
    } else {
      fileId = null
      setStatus({ state: 'error', error: 'Sin conexión o error de Google Drive. Se reintentará.' })
      console.error('Sync:', message)
    }
  } finally {
    running = false
    if (rerun) {
      rerun = false
      void syncNow()
    }
  }
}

/** Programa una sincronización unos segundos después de un cambio local. */
export function scheduleSync(): void {
  if (!status.connected) return
  if (debounce) clearTimeout(debounce)
  debounce = setTimeout(() => void syncNow(), DEBOUNCE_MS)
}

/** Abre el navegador para iniciar sesión con Google (OAuth para apps de escritorio + PKCE). */
export async function connect(): Promise<void> {
  if (!status.configured) throw new Error('Sin credenciales de Google en esta compilación')
  const verifier = base64url(randomBytes(48))
  const challenge = base64url(createHash('sha256').update(verifier).digest())
  const state = base64url(randomBytes(16))

  const code = await new Promise<{ code: string; redirect: string }>((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      const ok = url.searchParams.get('state') === state && url.searchParams.get('code')
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(
        `<body style="font-family:sans-serif;background:#14181f;color:#e8e6e1;display:grid;place-items:center;height:100vh;margin:0">` +
          `<h2>${ok ? '✓ Listo, ya puedes volver a Flow Now!' : 'No se pudo conectar. Inténtalo de nuevo.'}</h2></body>`
      )
      clearTimeout(timer)
      server.close()
      if (ok) resolve({ code: ok, redirect })
      else reject(new Error(url.searchParams.get('error') ?? 'cancelado'))
    })
    let redirect = ''
    const timer = setTimeout(() => {
      server.close()
      reject(new Error('Tiempo de espera agotado'))
    }, LOGIN_TIMEOUT_MS)
    server.listen(0, '127.0.0.1', () => {
      redirect = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: redirect,
        response_type: 'code',
        scope: SCOPES,
        code_challenge: challenge,
        code_challenge_method: 'S256',
        access_type: 'offline',
        prompt: 'consent',
        state
      })
      void shell.openExternal(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
    })
  })

  const json = await tokenRequest({
    grant_type: 'authorization_code',
    code: code.code,
    code_verifier: verifier,
    redirect_uri: code.redirect
  })
  if (!json.refresh_token) throw new Error('Google no devolvió un token de acceso permanente')
  // Google deja desmarcar permisos al autorizar: sin el de Drive la app no puede sincronizar
  if (!json.scope?.includes('drive.appdata')) {
    void fetch(
      `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(json.refresh_token)}`,
      {
        method: 'POST'
      }
    ).catch(() => {})
    throw new Error(MISSING_SCOPE_MSG)
  }

  // El email solo se usa para mostrar con qué cuenta está conectada la app
  let email: string | undefined
  try {
    const payload = JSON.parse(Buffer.from(json.id_token.split('.')[1], 'base64url').toString())
    email = payload.email
  } catch {
    email = undefined
  }
  const stored: StoredAuth = {
    refreshToken: safeStorage.encryptString(json.refresh_token).toString('base64'),
    email
  }
  writeFileSync(authPath(), JSON.stringify(stored), 'utf-8')
  accessToken = { value: json.access_token, expiresAt: Date.now() + Number(json.expires_in) * 1000 }
  fileId = null
  setStatus({ connected: true, email, state: 'idle', error: undefined })
  await syncNow()
}

export function disconnect(): void {
  const refresh = refreshToken()
  if (refresh) {
    // Revoca el acceso en Google (si falla por estar sin red, al menos se olvida localmente)
    void fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refresh)}`, {
      method: 'POST'
    }).catch(() => {})
  }
  rmSync(authPath(), { force: true })
  accessToken = null
  fileId = null
  setStatus({ connected: false, email: undefined, lastSync: undefined })
}

export function getStatus(): SyncStatus {
  return status
}

export function initSync(handlers: {
  onStatus: (s: SyncStatus) => void
  onData: (d: AppData) => void
}): void {
  onStatus = handlers.onStatus
  onData = handlers.onData
  const auth = readAuth()
  if (status.configured && auth && refreshToken()) {
    status = { ...status, connected: true, email: auth.email }
    void syncNow()
  }
  setInterval(() => void syncNow(), INTERVAL_MS)
}
