/**
 * @file routes/entries.ts
 * @description Einträge-Routen (CRUD-Operationen).
 * 
 * SICHERHEIT:
 * - Alle Routen sind JWT-geschützt
 * - User kann nur eigene Einträge sehen/erstellen
 * - Zod-basierte Eingabe-Validierung
 * 
 * PATTERN: Route Factory mit JWT-Protection
 * - JWT-Middleware wird auf alle Routen angewendet
 * - User-ID aus JWT für DB-Queries verwendet
 */

import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import { zValidator } from '@hono/zod-validator'
import { entryRepository } from '../db'
import { entrySchema } from '../validation'
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
  entries.post(
    '/',
    zValidator('json', entrySchema, (result, c) => {
      if (!result.success) {
        const firstError = result.error.issues[0]?.message || 'Validation failed'
        return c.json({ error: firstError }, 400)
      }
    }),
    async (c) => {
      const payload = c.get('jwtPayload') as JwtPayload

      try {
        // Validierte Daten aus dem Request (Zod hat bereits validiert und getrimmt)
        const { text } = c.req.valid('json')

        // Eintrag erstellen mit User-ID aus JWT
        // SICHERHEIT: User kann nur für sich selbst Einträge erstellen
        entryRepository.create(text, payload.id)

        return c.json({ success: true })
      } catch (e) {
        return c.json({ error: 'Invalid request' }, 400)
      }
    }
  )

  // ===================
  // Update Entry
  // ===================
  /**
   * PUT /api/entries/:id
   * 
   * Aktualisiert einen bestehenden Eintrag.
   * SICHERHEIT: Prüft ob Eintrag dem aktuellen User gehört.
   * 
   * Request Body: { text: string }
   * Response: { success: true } oder { error: string }
   */
  entries.put(
    '/:id',
    zValidator('json', entrySchema, (result, c) => {
      if (!result.success) {
        const firstError = result.error.issues[0]?.message || 'Validation failed'
        return c.json({ error: firstError }, 400)
      }
    }),
    async (c) => {
      const payload = c.get('jwtPayload') as JwtPayload
      const entryId = parseInt(c.req.param('id'))

      if (isNaN(entryId)) {
        return c.json({ error: 'Invalid entry ID' }, 400)
      }

      try {
        // Prüfen ob Eintrag existiert und dem User gehört
        const entry = entryRepository.findById(entryId)

        if (!entry) {
          return c.json({ error: 'Entry not found' }, 404)
        }

        if (entry.userId !== payload.id) {
          return c.json({ error: 'Access denied' }, 403)
        }

        // Validierte Daten aus dem Request
        const { text } = c.req.valid('json')

        // Eintrag aktualisieren
        entryRepository.update(entryId, text)

        return c.json({ success: true })
      } catch (e) {
        return c.json({ error: 'Invalid request' }, 400)
      }
    }
  )

  // ===================
  // Delete Entry
  // ===================
  /**
   * DELETE /api/entries/:id
   * 
   * Löscht einen Eintrag.
   * SICHERHEIT: Prüft ob Eintrag dem aktuellen User gehört.
   * 
   * Response: { success: true } oder { error: string }
   */
  entries.delete('/:id', async (c) => {
    const payload = c.get('jwtPayload') as JwtPayload
    const entryId = parseInt(c.req.param('id'))

    if (isNaN(entryId)) {
      return c.json({ error: 'Invalid entry ID' }, 400)
    }

    try {
      // Prüfen ob Eintrag existiert und dem User gehört
      const entry = entryRepository.findById(entryId)

      if (!entry) {
        return c.json({ error: 'Entry not found' }, 404)
      }

      if (entry.userId !== payload.id) {
        return c.json({ error: 'Access denied' }, 403)
      }

      // Eintrag löschen
      entryRepository.delete(entryId)

      return c.json({ success: true })
    } catch (e) {
      return c.json({ error: 'Invalid request' }, 400)
    }
  })

  return entries
}
