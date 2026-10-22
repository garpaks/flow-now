import type { SyncStatus } from '../../../shared/types'
import PixelIcon from './PixelIcon'

interface Props {
  sync: SyncStatus
  onSettings: () => void
  onMini: () => void
}

// Barra de título propia (la ventana no tiene marco de Windows); se arrastra desde el fondo
export default function Titlebar({ sync, onSettings, onMini }: Props): React.JSX.Element {
  return (
    <header className="titlebar">
      <div className="logo">
        <PixelIcon art="wave" scale={3} className="logo-icon" />
        <span>FLOW NOW!</span>
      </div>
      <div className="win-controls">
        {sync.connected && (
          <button
            className={`win-btn cloud cloud-${sync.state}`}
            onClick={onSettings}
            title={
              sync.state === 'error'
                ? sync.error
                : sync.state === 'syncing'
                  ? 'Sincronizando…'
                  : `Sincronizado con ${sync.email ?? 'Google Drive'}`
            }
          >
            <PixelIcon art="cloud" />
          </button>
        )}
        <button className="win-btn" onClick={onMini} title="Modo mini">
          <PixelIcon art="mini" />
        </button>
        <button className="win-btn spin" onClick={onSettings} title="Ajustes">
          <PixelIcon art="gear" />
        </button>
        <span className="win-sep" />
        <button className="win-btn" onClick={() => window.api.minimize()} title="Minimizar">
          <PixelIcon art="minimize" />
        </button>
        <button
          className="win-btn close"
          onClick={() => window.api.close()}
          title="Cerrar (sigue en la bandeja)"
        >
          <PixelIcon art="close" />
        </button>
      </div>
    </header>
  )
}
