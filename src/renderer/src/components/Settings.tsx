import { useState } from 'react'
import type { Settings } from '../../../shared/types'

interface Props {
  settings: Settings
  onSave: (settings: Settings) => void
  onClose: () => void
}

const NUMBER_FIELDS: { key: 'work' | 'shortBreak' | 'longBreak' | 'longEvery'; label: string }[] = [
  { key: 'work', label: 'Enfoque (min)' },
  { key: 'shortBreak', label: 'Pausa corta (min)' },
  { key: 'longBreak', label: 'Pausa larga (min)' },
  { key: 'longEvery', label: 'Pomodoros hasta pausa larga' }
]

export default function SettingsModal({ settings, onSave, onClose }: Props): React.JSX.Element {
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
        <label className="field check">
          <input
            type="checkbox"
            checked={draft.sound}
            onChange={(e) => setDraft({ ...draft, sound: e.target.checked })}
          />
          <span>Sonido al terminar</span>
        </label>
        <label className="field check">
          <input
            type="checkbox"
            checked={draft.alwaysOnTop}
            onChange={(e) => setDraft({ ...draft, alwaysOnTop: e.target.checked })}
          />
          <span>Ventana siempre visible</span>
        </label>
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
