/**
 * @file validation/index.ts
 * @description Zentralisierte Eingabe-Validierung für alle API-Endpunkte.
 * 
 * WARUM EIGENE VALIDIERUNG?
 * - Keine externe Dependency (kein Zod, Joi, etc.)
 * - Volle Kontrolle über Fehlermeldungen
 * - Minimaler Footprint für VPS
 * - TypeScript-Integration mit Discriminated Unions
 * 
 * PATTERN: Discriminated Union für Ergebnisse
 * - { valid: true, ...data } bei Erfolg
 * - { valid: false, error: string } bei Fehler
 * - TypeScript kann basierend auf `valid` den Typ eingrenzen
 */

// ===================
// Validation Types
// ===================

/**
 * Erfolgreiche Validierung: valid=true + validierte Daten
 */
type ValidationSuccess<T> = { valid: true } & T

/**
 * Fehlgeschlagene Validierung: valid=false + Fehlermeldung
 */
type ValidationError = { valid: false; error: string }

/**
 * Union-Type für Validierungsergebnisse.
 * Ermöglicht Type Narrowing: if (result.valid) { result.data... }
 */
type ValidationResult<T> = ValidationSuccess<T> | ValidationError

// ===================
// Auth Validation
// ===================

/**
 * Validierte Auth-Daten.
 */
interface AuthData {
  username: string
  password: string
}

/**
 * Validiert Username und Passwort für Login/Signup.
 * 
 * REGELN:
 * - Username: 3-50 Zeichen, nur alphanumerisch + _ und -
 * - Password: 8-128 Zeichen, beliebige Zeichen erlaubt
 * 
 * @param username - Zu validierender Username (unknown für Sicherheit)
 * @param password - Zu validierendes Passwort (unknown für Sicherheit)
 * 
 * WARUM unknown statt string?
 * - Request-Body ist zur Laufzeit nicht typisiert
 * - unknown erzwingt Typprüfung vor Verwendung
 * - Verhindert Runtime-Fehler bei falschen Datentypen
 */
export function validateAuth(username: unknown, password: unknown): ValidationResult<AuthData> {
  // Typ-Check und Längenprüfung für Username
  if (typeof username !== 'string' || username.trim().length < 3 || username.length > 50) {
    return { valid: false, error: 'Username must be 3-50 characters' }
  }

  // Typ-Check und Längenprüfung für Passwort
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return { valid: false, error: 'Password must be 8-128 characters' }
  }

  // Zeichen-Whitelist für Username (Sicherheit + DB-Kompatibilität)
  // Erlaubt: a-z, A-Z, 0-9, _, -
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscores and hyphens' }
  }

  // Erfolg: Validierte und getrimmte Daten zurückgeben
  return { valid: true, username: username.trim(), password }
}

// ===================
// Entry Validation
// ===================

/**
 * Validierte Entry-Daten.
 */
interface EntryData {
  text: string
}

/**
 * Validiert Entry-Text.
 * 
 * REGELN:
 * - Nicht leer (nach Trim)
 * - Maximal 10000 Zeichen (verhindert Speicher-Probleme)
 * 
 * @param text - Zu validierender Text (unknown für Sicherheit)
 */
export function validateEntryText(text: unknown): ValidationResult<EntryData> {
  // Typ-Check und Leerprüfung
  if (typeof text !== 'string' || text.trim().length === 0) {
    return { valid: false, error: 'Entry text cannot be empty' }
  }

  // Maximale Länge (schützt vor Speicher-Exhaustion)
  if (text.length > 10000) {
    return { valid: false, error: 'Entry text cannot exceed 10000 characters' }
  }

  // Erfolg: Getrimmten Text zurückgeben
  return { valid: true, text: text.trim() }
}
