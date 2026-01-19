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
  id: number       // Auto-increment ID aus SQLite
  username: string // Eindeutiger Benutzername (3-50 Zeichen)
  password: string // Gehashtes Passwort (Argon2/bcrypt via Bun.password)
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
