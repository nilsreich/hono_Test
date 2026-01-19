/**
 * @file hooks/index.ts
 * @description Barrel-Export für alle Custom Hooks.
 * 
 * WARUM BARREL EXPORTS?
 * - Saubere Imports: `import { useAuth, useEntries } from './hooks'`
 * - Kapselung: Interne Hook-Struktur kann sich ändern ohne Import-Pfade anzupassen
 * - Übersichtlichkeit: Alle verfügbaren Hooks auf einen Blick
 */

export { useAuth } from './useAuth'
export { useEntries } from './useEntries'
