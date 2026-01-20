/**
 * @file types/index.ts
 * @description Zentrale TypeScript-Definitionen für das Backend.
 * 
 * WARUM EIGENE TYPES-DATEI?
 * - Konsistenz: Gleiche Typen in Routes, DB und Validation
 * - Wartbarkeit: Änderungen nur an einer Stelle
 * - Dokumentation: Typen erklären die Datenstrukturen
 * 
 * HINWEIS: Diese Typen sollten mit den Frontend-Typen synchron sein.
 * Bei Änderungen beide Dateien aktualisieren!
 */

// ===================
// Domain Types
// ===================

/**
 * Repräsentiert einen Benutzer in der Datenbank.
 * ACHTUNG: password enthält den Hash, nie das Klartext-Passwort!
 */
export interface User {
  id: number                // Auto-increment ID aus SQLite
  username: string          // Eindeutiger Benutzername (3-50 Zeichen)
  email: string | null      // E-Mail-Adresse (optional, für Passwort-Reset)
  password: string          // Gehashtes Passwort (Argon2/bcrypt via Bun.password)
  reset_token: string | null    // Token für Passwort-Reset
  reset_expires: number | null  // Ablaufdatum des Reset-Tokens (Unix-Timestamp)
}

/**
 * Repräsentiert einen Eintrag in der Datenbank.
 * Jeder Eintrag gehört zu genau einem User (userId).
 */
export interface Entry {
  id: number      // Auto-increment ID aus SQLite
  text: string    // Inhalt des Eintrags (max 10000 Zeichen)
  userId: number  // Fremdschlüssel zu users.id
}

/**
 * Repräsentiert eine hochgeladene Datei in der Datenbank.
 * Jede Datei gehört zu genau einem User (userId).
 */
export interface FileMetadata {
  id: number           // Auto-increment ID aus SQLite
  originalName: string // Originaler Dateiname
  storedName: string   // Gespeicherter Dateiname (UUID + Extension)
  mimeType: string     // MIME-Type der Datei
  size: number         // Dateigröße in Bytes
  description?: string // Optionale Beschreibung
  userId: number       // Fremdschlüssel zu users.id
  createdAt: string    // Zeitstempel der Erstellung
}

/**
 * Input für Datei-Erstellung (ohne auto-generierte Felder).
 */
export interface CreateFileInput {
  originalName: string
  storedName: string
  mimeType: string
  size: number
  description?: string
  userId: number
}

// ===================
// JWT Payload
// ===================

/**
 * Inhalt des JWT-Tokens.
 * Wird bei Login erstellt und bei geschützten Routes validiert.
 * 
 * SICHERHEIT:
 * - exp: Token läuft nach 24h ab
 * - Keine sensiblen Daten (kein Passwort!)
 */
export interface JwtPayload {
  id: number       // User-ID für DB-Abfragen
  username: string // Username für Anzeige
  exp: number      // Ablaufzeit als Unix-Timestamp
}
