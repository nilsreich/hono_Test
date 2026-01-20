/**
 * @file main.tsx
 * @description React-Einstiegspunkt mit TanStack Query + Persistenz.
 * 
 * FEATURES:
 * - TanStack Query v5 für Daten-Management
 * - localStorage Persistenz für Offline-Support
 * - Automatische Synchronisation bei Online-Status
 * 
 * STRUKTUR:
 * - PersistQueryClientProvider: Wraps App mit Query-Persistenz
 * - StrictMode: Aktiviert zusätzliche Checks in Development
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { queryClient, persister } from './lib/queryClient'
import './index.css'
import App from './App.tsx'

/**
 * App ins DOM mounten mit TanStack Query Persistenz.
 * 
 * PERSISTENZ-OPTIONEN:
 * - maxAge: 24 Stunden (wie lange Cache gültig ist)
 * - dehydrateOptions: Nur erfolgreiche Queries persistieren
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24, // 24 Stunden
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            // Nur erfolgreiche Queries persistieren
            return query.state.status === 'success'
          },
        },
      }}
      onSuccess={() => {
        // Nach Restore: Alle stale Queries refetchen
        queryClient.resumePausedMutations()
      }}
    >
      <App />
    </PersistQueryClientProvider>
  </StrictMode>,
)
