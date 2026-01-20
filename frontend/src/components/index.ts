/**
 * @file components/index.ts
 * @description Haupt-Barrel-Export für alle Komponenten.
 * 
 * PATTERN: Zentrale Export-Datei
 * - Ermöglicht: import { Button, Card, AuthForm } from './components'
 * - Versteckt interne Ordnerstruktur vor Konsumenten
 * - Erleichtert Refactoring der internen Struktur
 * 
 * STRUKTUR:
 * - ui/: Wiederverwendbare Basis-Komponenten (Button, Input, Card, Alert)
 * - auth/: Authentifizierungs-spezifische Komponenten
 * - entries/: Einträge-spezifische Komponenten
 * - files/: Datei-Upload-spezifische Komponenten
 * - layout/: Layout-Container und Strukturkomponenten
 */

// UI Components - Basis-Bausteine
export * from './ui'

// Auth Components - Login/Signup
export * from './auth'

// Entry Components - Einträge-Verwaltung
export * from './entries'

// File Components - Datei-Uploads
export * from './files'

// Chat Components - Echtzeit-Kommunikation
export * from './chat'

// Layout Components - Seitenstruktur
export * from './layout'
