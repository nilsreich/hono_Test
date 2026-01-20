/**
 * @file routes/index.ts
 * @description Barrel-Export für alle Route-Module.
 * 
 * PATTERN: Route Factory Functions
 * - Jede Route-Datei exportiert eine Factory-Funktion
 * - Factory erhält Konfiguration (z.B. jwtSecret)
 * - Gibt konfigurierten Hono-Router zurück
 * 
 * VORTEILE:
 * - Dependency Injection für Tests
 * - Klare Trennung der Verantwortlichkeiten
 * - Einfaches Hinzufügen neuer Routen
 */

export { createAuthRoutes } from './auth'
export { createEntriesRoutes } from './entries'
export { createFilesRoutes } from './files'
export { createHealthRoutes } from './health'
export { createPasswordResetRoutes } from './password-reset'
export { createChatRoutes } from './chat'
