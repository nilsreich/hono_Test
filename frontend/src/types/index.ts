/**
 * @file types/index.ts
 * @description Zentrale TypeScript-Definitionen für das Frontend.
 * 
 * WARUM EIGENE TYPES-DATEI?
 * - Single Source of Truth: Alle Typen an einem Ort definiert
 * - Wiederverwendbarkeit: Hooks, Komponenten und API-Client nutzen dieselben Typen
 * - Typsicherheit: TypeScript kann Fehler zur Compile-Zeit erkennen
 * - Dokumentation: Typen dienen als lebende Dokumentation der Datenstrukturen
 */

// ===================
// Domain Types
// ===================

/**
 * Repräsentiert einen Eintrag in der Datenbank.
 * Wird sowohl für API-Responses als auch für lokalen State verwendet.
 */
export interface Entry {
  id: number    // Eindeutige ID aus der Datenbank
  text: string  // Der eigentliche Inhalt des Eintrags
}

/**
 * Repräsentiert einen Benutzer.
 * Hinweis: Passwort wird hier NICHT gespeichert (nur im Backend).
 */
export interface User {
  id: number
  username: string
}

// ===================
// API Response Types
// ===================

/**
 * Response-Typ für Login/Signup-Endpunkte.
 * - token: JWT-Token bei erfolgreichem Login
 * - success: Boolean für Signup-Erfolg
 * - error: Fehlermeldung bei Problemen
 */
export interface AuthResponse {
  token?: string
  success?: boolean
  error?: string
}

/**
 * Response-Typ für Entry-Operationen (Create/Update/Delete).
 */
export interface EntryResponse {
  success?: boolean
  error?: string
}

// ===================
// Form State Types
// ===================

/**
 * Formulardaten für Login/Registrierung.
 * Getrennt von API-Types, da Formulare andere Anforderungen haben können.
 */
export interface AuthFormData {
  username: string
  password: string
}

/**
 * Formulardaten für neue Einträge.
 */
export interface EntryFormData {
  text: string
}

