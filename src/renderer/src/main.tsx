import '@fontsource/pixelify-sans/400.css'
import '@fontsource/pixelify-sans/600.css'
import '@fontsource/press-start-2p/400.css'
import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
