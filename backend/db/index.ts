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
import { join } from 'node:path'
import { mkdirSync } from 'node:fs'
import type { User, Entry, FileMetadata, CreateFileInput } from '../types'

// ===================
// Database Connection
// ===================

/**
 * SQLite-Datenbankverbindung.
 * Datei wird im /data/sqlite Verzeichnis außerhalb des backend-Ordners gespeichert.
 * Dies ermöglicht einfachere Updates des Codes, ohne die Daten zu gefährden.
 */
const DATA_DIR = join(import.meta.dir, '..', '..', 'data', 'sqlite')
mkdirSync(DATA_DIR, { recursive: true })

const db = new Database(join(DATA_DIR, 'data.sqlite'))

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
      email TEXT UNIQUE,
      password TEXT NOT NULL,
      reset_token TEXT,
      reset_expires INTEGER
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

  // Files-Tabelle: Speichert Datei-Metadaten mit User-Referenz
  db.run(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      originalName TEXT NOT NULL,
      storedName TEXT NOT NULL UNIQUE,
      mimeType TEXT NOT NULL,
      size INTEGER NOT NULL,
      description TEXT,
      userId INTEGER NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
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
   * Findet einen User anhand der E-Mail.
   * @param email - Gesuchte E-Mail-Adresse
   * @returns User oder null wenn nicht gefunden
   */
  findByEmail: (email: string): User | null => {
    return db.query('SELECT * FROM users WHERE email = ?').get(email) as User | null
  },

  /**
   * Findet einen User anhand des Reset-Tokens.
   * @param token - Reset-Token
   * @returns User oder null wenn nicht gefunden
   */
  findByResetToken: (token: string): User | null => {
    return db.query('SELECT * FROM users WHERE reset_token = ?').get(token) as User | null
  },

  /**
   * Findet einen User anhand der ID.
   * @param id - User-ID
   * @returns User oder null wenn nicht gefunden
   */
  findById: (id: number): User | null => {
    return db.query('SELECT * FROM users WHERE id = ?').get(id) as User | null
  },

  /**
   * Erstellt einen neuen User.
   * @param username - Eindeutiger Benutzername
   * @param email - E-Mail-Adresse (optional)
   * @param hashedPassword - Bereits gehashtes Passwort (WICHTIG!)
   * 
   * HINWEIS: Passwort muss VOR Aufruf gehasht werden!
   * Niemals Klartext-Passwörter speichern!
   */
  create: (username: string, hashedPassword: string, email?: string): void => {
    db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email ?? null, hashedPassword])
  },

  /**
   * Setzt den Reset-Token und das Ablaufdatum für einen User.
   * @param userId - ID des Users
   * @param token - Reset-Token (UUID)
   * @param expires - Ablaufdatum als Unix-Timestamp
   */
  setResetToken: (userId: number, token: string, expires: number): void => {
    db.run('UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?', [token, expires, userId])
  },

  /**
   * Aktualisiert das Passwort eines Users.
   * @param userId - ID des Users
   * @param hashedPassword - Neues gehashtes Passwort
   */
  updatePassword: (userId: number, hashedPassword: string): void => {
    db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId])
  },

  /**
   * Löscht den Reset-Token eines Users nach erfolgreicher Passwort-Änderung.
   * @param userId - ID des Users
   */
  clearResetToken: (userId: number): void => {
    db.run('UPDATE users SET reset_token = NULL, reset_expires = NULL WHERE id = ?', [userId])
  },

  /**
   * Aktualisiert die E-Mail-Adresse eines Users.
   * @param userId - ID des Users
   * @param email - Neue E-Mail-Adresse
   */
  updateEmail: (userId: number, email: string): void => {
    db.run('UPDATE users SET email = ? WHERE id = ?', [email, userId])
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
   * Findet einen Eintrag anhand seiner ID.
   * @param id - ID des Eintrags
   * @returns Entry oder null wenn nicht gefunden
   */
  findById: (id: number): Entry | null => {
    return db.query('SELECT * FROM entries WHERE id = ?').get(id) as Entry | null
  },

  /**
   * Erstellt einen neuen Eintrag.
   * @param text - Inhalt des Eintrags (bereits validiert!)
   * @param userId - ID des zugehörigen Users
   */
  create: (text: string, userId: number): void => {
    db.run('INSERT INTO entries (text, userId) VALUES (?, ?)', [text, userId])
  },

  /**
   * Aktualisiert einen bestehenden Eintrag.
   * @param id - ID des Eintrags
   * @param text - Neuer Inhalt des Eintrags
   */
  update: (id: number, text: string): void => {
    db.run('UPDATE entries SET text = ? WHERE id = ?', [text, id])
  },

  /**
   * Löscht einen Eintrag anhand seiner ID.
   * @param id - ID des Eintrags
   */
  delete: (id: number): void => {
    db.run('DELETE FROM entries WHERE id = ?', [id])
  },
}

// ===================
// File Repository
// ===================

/**
 * Repository für File-Operationen.
 */
export const fileRepository = {
  /**
   * Findet alle Dateien eines Users.
   * @param userId - ID des Users
   * @returns Array von FileMetadata, neueste zuerst (ORDER BY id DESC)
   */
  findAllByUserId: (userId: number): FileMetadata[] => {
    return db.query('SELECT * FROM files WHERE userId = ? ORDER BY id DESC').all(userId) as FileMetadata[]
  },

  /**
   * Findet eine Datei anhand ihrer ID.
   * @param id - ID der Datei
   * @returns FileMetadata oder null wenn nicht gefunden
   */
  findById: (id: number): FileMetadata | null => {
    return db.query('SELECT * FROM files WHERE id = ?').get(id) as FileMetadata | null
  },

  /**
   * Erstellt einen neuen Datei-Eintrag.
   * @param input - Datei-Metadaten (ohne auto-generierte Felder)
   * @returns Die erstellte FileMetadata mit ID und createdAt
   */
  create: (input: CreateFileInput): FileMetadata => {
    const result = db.run(
      'INSERT INTO files (originalName, storedName, mimeType, size, description, userId) VALUES (?, ?, ?, ?, ?, ?)',
      [input.originalName, input.storedName, input.mimeType, input.size, input.description ?? null, input.userId]
    )
    // Gerade erstellte Datei zurückgeben
    return db.query('SELECT * FROM files WHERE id = ?').get(result.lastInsertRowid) as FileMetadata
  },

  /**
   * Löscht eine Datei anhand ihrer ID.
   * @param id - ID der Datei
   */
  delete: (id: number): void => {
    db.run('DELETE FROM files WHERE id = ?', [id])
  },
}
