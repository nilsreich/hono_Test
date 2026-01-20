/**
 * @file lib/queryClient.ts
 * @description TanStack Query v5 Client-Konfiguration mit Offline-First & Persistenz.
 * 
 * FEATURES:
 * - Offline-First: Mutationen werden bei fehlender Verbindung pausiert
 * - localStorage Persistenz: Query- und Mutation-Cache überleben Page-Reloads
 * - Optimistic Updates: UI wird sofort aktualisiert, Rollback bei Fehler
 * - Auto-Sync: Pausierte Mutationen werden automatisch synchronisiert
 * 
 * WARUM TANSTACK QUERY?
 * - Automatisches Caching und Background-Updates
 * - Deduplizierung von Requests
 * - Eingebaute Retry-Logik
 * - Devtools für einfaches Debugging
 */

import { QueryClient } from '@tanstack/react-query'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

// ===================
// Query Client
// ===================

/**
 * Globaler QueryClient mit Offline-First Konfiguration.
 * 
 * KONFIGURATION:
 * - gcTime: 24h (wie lange Cache im Speicher bleibt)
 * - staleTime: 5min (wie lange Daten als "frisch" gelten)
 * - networkMode: 'offlineFirst' (Offline-First für alle Queries/Mutations)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache bleibt 24 Stunden im Speicher
      gcTime: 1000 * 60 * 60 * 24,
      // Daten sind 5 Minuten "frisch"
      staleTime: 1000 * 60 * 5,
      // Bei Netzwerkfehler: Aus Cache laden
      networkMode: 'offlineFirst',
      // Automatischer Retry bei Fehlern
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch wenn Tab wieder aktiv wird
      refetchOnWindowFocus: true,
    },
    mutations: {
      // Offline-First: Pausiert bei fehlender Verbindung, auto-sync wenn online
      networkMode: 'offlineFirst',
      // Retry bei Netzwerkfehlern
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
})

// ===================
// Storage Persister
// ===================

/**
 * localStorage Persister für Query-Cache.
 * Speichert den kompletten Cache im localStorage.
 * 
 * HINWEIS:
 * - Maximale Größe: ~5MB (Browser-Limit)
 * - Serialisiert mit JSON.stringify
 * - Schlüssel: 'REACT_QUERY_OFFLINE_CACHE'
 */
export const persister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: 'REACT_QUERY_OFFLINE_CACHE',
  // Throttle writes (max alle 1 Sekunde)
  throttleTime: 1000,
})

// ===================
// Query Keys
// ===================

/**
 * Zentrale Query-Key Definitionen.
 * WARUM QUERY KEYS?
 * - Konsistente Cache-Invalidierung
 * - Typsicherheit durch zentrale Definition
 * - Einfache Verwaltung von abhängigen Queries
 */
export const queryKeys = {
  // Entries
  entries: {
    all: ['entries'] as const,
    list: () => [...queryKeys.entries.all, 'list'] as const,
  },
  // Files
  files: {
    all: ['files'] as const,
    list: () => [...queryKeys.files.all, 'list'] as const,
  },
} as const

// ===================
// Online Status Helper
// ===================

/**
 * Prüft ob der Client online ist.
 * Wird für Offline-Hinweise in der UI verwendet.
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

/**
 * Event-Listener für Online/Offline-Status.
 * @param callback - Wird mit aktuellem Status aufgerufen
 * @returns Cleanup-Funktion
 */
export function onOnlineStatusChange(callback: (online: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  
  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)
  
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}
