/**
 * @file components/ui/OfflineBanner.tsx
 * @description Zeigt einen Banner an, wenn der User offline ist.
 * 
 * FEATURES:
 * - Automatische Erkennung des Online-Status
 * - Slide-Down Animation beim Erscheinen
 * - Informiert über pausierte Änderungen
 */

import { useOnlineStatus } from '../../hooks'

export function OfflineBanner() {
  const { isOnline } = useOnlineStatus()

  if (isOnline) return null

  return (
    <div 
      className="fixed top-0 left-0 right-0 bg-amber-500 text-amber-950 px-4 py-2 text-center text-sm font-medium z-50 animate-slide-down"
      role="alert"
      aria-live="polite"
    >
      <span className="inline-flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
        </svg>
        Offline – Änderungen werden synchronisiert, sobald du wieder online bist
      </span>
    </div>
  )
}
