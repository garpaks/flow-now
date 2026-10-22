import { useState } from 'react'
import PixelIcon from './PixelIcon'
import { timeOf } from '../utils'
import type { Settings, SyncStatus, Theme } from '../../../shared/types'

interface Props {
  settings: Settings
  sync: SyncStatus
  onSave: (settings: Settings) => void
  onClose: () => void
}

const NUMBER_FIELDS: { key: 'work' | 'shortBreak' | 'longBreak' | 'longEvery'; label: string }[] = [
  { key: 'work', label: 'Enfoque (min)' },
  { key: 'shortBreak', label: 'Pausa corta (min)' },
  { key: 'longBreak', label: 'Pausa larga (min)' },
  { key: 'longEvery', label: 'Pomodoros hasta pausa larga' }
]

const THEMES: { value: Theme; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'light', label: 'Claro' }
]

function SyncSection({ sync }: { sync: SyncStatus }): React.JSX.Element {
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!sync.configured) {
    return (
      <p className="sync-note">
        Esta versión no incluye las credenciales de Google. Revisa el README para activarla.
      </p>
    )
  }

  const connect = async (): Promise<void> => {
    setConnecting(true)
    setError(null)
    setError(await window.api.syncConnect())
    setConnecting(false)
  }

  if (!sync.connected) {
    return (
      <div className="sync-box">
        <p className="sync-note">
          Guarda tu progreso en tu Google Drive y úsalo en varios PC. Se abrirá el navegador para
          iniciar sesión.
        </p>
        <button type="button" className="sync-btn" onClick={connect} disabled={connecting}>
          <PixelIcon art="cloud" />
          {connecting ? 'Esperando al navegador…' : 'Conectar con Google'}
        </button>
        {(error || sync.error) && <p className="sync-error">{error ?? sync.error}</p>}
      </div>
    )
  }

  return (
    <div className="sync-box">
      <p className="sync-note">
        Conectado como <strong>{sync.email ?? 'tu cuenta de Google'}</strong>
        <br />
        {sync.state === 'syncing'
          ? 'Sincronizando…'
          : sync.lastSync
            ? `Última sincronización: ${timeOf(sync.lastSync)}`
            : 'Pendiente de sincronizar'}
      </p>
      {sync.state === 'error' && sync.error && <p className="sync-error">{sync.error}</p>}
      <div className="sync-actions">
        <button
          type="button"
          className="sync-btn"
          onClick={() => window.api.syncNow()}
          disabled={sync.state === 'syncing'}
        >
          Sincronizar ahora
        </button>
        <button
          type="button"
          className="sync-btn ghost"
          onClick={() => {
            if (confirm('¿Desconectar de Google? Tus datos locales se conservan.'))
              void window.api.syncDisconnect()
          }}
        >
          Desconectar
        </button>
      </div>
    </div>
  )
}

export default function SettingsModal({
  settings,
  sync,
  onSave,
  onClose
}: Props): React.JSX.Element {
  const [draft, setDraft] = useState(settings)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          onSave(draft)
        }}
      >
        <h2>Ajustes</h2>
        {NUMBER_FIELDS.map(({ key, label }) => (
          <label key={key} className="field">
            <span>{label}</span>
            <input
              type="number"
              min={1}
              max={180}
              required
              value={draft[key]}
              onChange={(e) => setDraft({ ...draft, [key]: Math.max(1, Number(e.target.value)) })}
            />
          </label>
        ))}
        <div className="field">
          <span>Tema</span>
          <div className="cat-filter theme-picker">
            {THEMES.map((t) => (
              <button
                key={t.value}
                type="button"
                className={draft.theme === t.value ? 'on' : ''}
                onClick={() => setDraft({ ...draft, theme: t.value })}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <label className="field check">
          <input
            type="checkbox"
            checked={draft.sound}
            onChange={(e) => setDraft({ ...draft, sound: e.target.checked })}
          />
          <span>Sonidos de 8 bits</span>
        </label>
        <label className="field check">
          <input
            type="checkbox"
            checked={draft.alwaysOnTop}
            onChange={(e) => setDraft({ ...draft, alwaysOnTop: e.target.checked })}
          />
          <span>Ventana siempre visible</span>
        </label>
        <h3 className="modal-section">Sincronización</h3>
        <SyncSection sync={sync} />
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="primary">
            Guardar
          </button>
        </div>
      </form>
    </div>
  )
}
