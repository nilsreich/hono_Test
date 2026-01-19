/**
 * @file main.tsx
 * @description React-Einstiegspunkt - mountet die App ins DOM.
 * 
 * STRUKTUR:
 * - StrictMode: Aktiviert zusätzliche Checks in Development
 * - createRoot: React 18+ Concurrent-Mode API
 * - index.css: Globale Styles (Tailwind)
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'  // Tailwind CSS importieren
import App from './App.tsx'

/**
 * App ins DOM mounten.
 * 
 * HINWEIS: '!' (Non-null assertion) ist sicher, da index.html
 * immer ein Element mit id="root" enthält.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
