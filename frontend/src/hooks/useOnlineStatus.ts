/**
 * @file hooks/useOnlineStatus.ts
 * @description Hook für Online/Offline-Status Tracking.
 * 
 * VERWENDUNG:
 * - Zeigt Offline-Banner an
 * - Informiert User über pausierte Mutationen
 * - Ermöglicht UI-Feedback für Sync-Status
 */

import { useState, useEffect } from 'react'
import { isOnline, onOnlineStatusChange } from '../lib/queryClient'

/**
 * Hook für Online/Offline-Status.
 * @returns { isOnline: boolean } - Aktueller Online-Status
 */
export function useOnlineStatus() {
  const [online, setOnline] = useState(isOnline)

  useEffect(() => {
    // Initial setzen
    setOnline(isOnline())
    
    // Listener registrieren
    const cleanup = onOnlineStatusChange(setOnline)
    
    return cleanup
  }, [])

  return { isOnline: online }
}
