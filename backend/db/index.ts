/**
 * @file db/index.ts
 * @description Datenbankverbindung und Repository-Pattern für SQLite.
 * 
 * ARCHITEKTUR-ENTSCHEIDUNG: Repository Pattern
 * - Abstrahiert SQL-Queries von Business-Logik
 * - Zentralisierte Datenbankzugriffe
 * - Einfacher zu testen (Mocking möglich)
 * - Typsicherheit durch TypeScript-Interfaces
 * 
 * WARUM bun:sqlite?
 * - Nativ in Bun integriert, kein extra Package
 * - Extrem schnell (direkter SQLite-Zugriff)
 * - Prepared Statements für Performance und Sicherheit
 */

import { Database } from 'bun:sqlite'
import type { User, Entry } from '../types'

// ===================
// Database Connection
// ===================

/**
 * SQLite-Datenbankverbindung.
 * Datei wird im aktuellen Verzeichnis erstellt.
 * 
 * HINWEIS: In Produktion ggf. Pfad anpassen oder
 * über Umgebungsvariable konfigurieren.
 */
const db = new Database('data.sqlite')

// ===================
// Schema Initialization
// ===================

/**
 * Initialisiert das Datenbankschema.
 * 
 * WICHTIG: Muss beim Server-Start aufgerufen werden!
 * Verwendet CREATE TABLE IF NOT EXISTS für Idempotenz.
 * 
 * MIGRATION HINWEIS:
 * Bei Schema-Änderungen (neue Spalten) muss die data.sqlite
 * gelöscht werden, da SQLite keine einfachen Migrationen unterstützt.
 */
export function initializeDatabase(): void {
  // Users-Tabelle: Speichert Benutzer mit gehashtem Passwort
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `)

  // Entries-Tabelle: Speichert Einträge mit User-Referenz
  db.run(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      userId INTEGER NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `)
}

// ===================
// User Repository
// ===================

/**
 * Repository für User-Operationen.
 * 
 * PATTERN: Repository als Objekt
 * - Gruppiert zusammengehörige Funktionen
 * - Klare Namespacing: userRepository.findByUsername()
 */
export const userRepository = {
  /**
   * Findet einen User anhand des Benutzernamens.
   * @param username - Gesuchter Benutzername
   * @returns User oder null wenn nicht gefunden
   */
  findByUsername: (username: string): User | null => {
    // Prepared Statement: ? wird sicher ersetzt (SQL-Injection-Schutz)
    return db.query('SELECT * FROM users WHERE username = ?').get(username) as User | null
  },

  /**
   * Erstellt einen neuen User.
   * @param username - Eindeutiger Benutzername
   * @param hashedPassword - Bereits gehashtes Passwort (WICHTIG!)
   * 
   * HINWEIS: Passwort muss VOR Aufruf gehasht werden!
   * Niemals Klartext-Passwörter speichern!
   */
  create: (username: string, hashedPassword: string): void => {
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword])
  },
}

// ===================
// Entry Repository
// ===================

/**
 * Repository für Entry-Operationen.
 */
export const entryRepository = {
  /**
   * Findet alle Einträge eines Users.
   * @param userId - ID des Users
   * @returns Array von Entries, neueste zuerst (ORDER BY id DESC)
   */
  findAllByUserId: (userId: number): Entry[] => {
    return db.query('SELECT * FROM entries WHERE userId = ? ORDER BY id DESC').all(userId) as Entry[]
  },

  /**
   * Erstellt einen neuen Eintrag.
   * @param text - Inhalt des Eintrags (bereits validiert!)
   * @param userId - ID des zugehörigen Users
   */
  create: (text: string, userId: number): void => {
    db.run('INSERT INTO entries (text, userId) VALUES (?, ?)', [text, userId])
  },
}
