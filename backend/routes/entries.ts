/**
 * @file routes/entries.ts
 * @description Einträge-Routen (CRUD-Operationen).
 * 
 * SICHERHEIT:
 * - Alle Routen sind JWT-geschützt
 * - User kann nur eigene Einträge sehen/erstellen
 * - Eingaben werden validiert
 * 
 * PATTERN: Route Factory mit JWT-Protection
 * - JWT-Middleware wird auf alle Routen angewendet
 * - User-ID aus JWT für DB-Queries verwendet
 */

import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import { entryRepository } from '../db'
import { validateEntryText } from '../validation'
import type { JwtPayload } from '../types'

// ===================
// Entries Routes
// ===================

/**
 * Erstellt Entries-Router mit JWT-geschützten CRUD-Routen.
 * 
 * @param jwtSecret - Secret für JWT-Validierung
 * @returns Konfigurierter Hono-Router
 * 
 * @example
 * // In index.ts:
 * app.route('/api/entries', createEntriesRoutes(JWT_SECRET))
 */
export function createEntriesRoutes(jwtSecret: string) {
  const entries = new Hono()

  /**
   * JWT-Middleware für ALLE Routen in diesem Router.
   * 
   * WICHTIG: alg: 'HS256' muss explizit gesetzt werden!
   * Ohne diese Option akzeptiert die Middleware auch 'none' Tokens.
   * 
   * Bei ungültigem/fehlendem Token: Automatisch 401 Unauthorized
   */
  entries.use('/*', jwt({ secret: jwtSecret, alg: 'HS256' }))

  // ===================
  // Get All Entries
  // ===================
  /**
   * GET /api/entries
   * 
   * Gibt alle Einträge des aktuellen Users zurück.
   * User-ID wird aus JWT-Payload extrahiert.
   * 
   * Response: Entry[] (sortiert nach ID absteigend = neueste zuerst)
   */
  entries.get('/', (c) => {
    // JWT-Payload wurde von Middleware validiert und ist verfügbar
    const payload = c.get('jwtPayload') as JwtPayload
    
    // Nur Einträge des aktuellen Users laden
    const userEntries = entryRepository.findAllByUserId(payload.id)
    
    // Leeres Array als Fallback (nie null/undefined)
    return c.json(userEntries || [])
  })

  // ===================
  // Create Entry
  // ===================
  /**
   * POST /api/entries
   * 
   * Erstellt einen neuen Eintrag für den aktuellen User.
   * 
   * Request Body: { text: string }
   * Response: { success: true } oder { error: string }
   */
  entries.post('/', async (c) => {
    const payload = c.get('jwtPayload') as JwtPayload

    try {
      const body = await c.req.json()
      
      // Text validieren (nicht leer, max 10000 Zeichen)
      const validation = validateEntryText(body.text)

      if (!validation.valid) {
        return c.json({ error: validation.error }, 400)
      }

      // Eintrag erstellen mit User-ID aus JWT
      // SICHERHEIT: User kann nur für sich selbst Einträge erstellen
      entryRepository.create(validation.text, payload.id)
      
      return c.json({ success: true })
    } catch (e) {
      return c.json({ error: 'Invalid request' }, 400)
    }
  })

  return entries
}
