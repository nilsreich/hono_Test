/**
 * @file routes/files.ts
 * @description Datei-Upload-Routen für Benutzer.
 * 
 * SICHERHEIT:
 * - Alle Routen sind JWT-geschützt
 * - User kann nur eigene Dateien sehen/hochladen/löschen
 * - Dateitypen werden validiert (nur erlaubte MIME-Types)
 * - Maximale Dateigröße: 5 MB
 * - Dateien werden mit UUID umbenannt (verhindert Path-Traversal)
 * 
 * PATTERN: Route Factory mit JWT-Protection
 * - JWT-Middleware wird auf alle Routen angewendet
 * - User-ID aus JWT für DB-Queries und Dateipfade verwendet
 */

import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import { join } from 'node:path'
import { mkdir, unlink, readdir, stat } from 'node:fs/promises'
import { fileRepository } from '../db'
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '../validation'
import type { JwtPayload } from '../types'

// ===================
// Files Routes
// ===================

/**
 * Erstellt Files-Router mit JWT-geschützten Upload/Download-Routen.
 * 
 * @param jwtSecret - Secret für JWT-Validierung
 * @param uploadsDir - Basis-Verzeichnis für Datei-Uploads
 * @returns Konfigurierter Hono-Router
 * 
 * @example
 * // In index.ts:
 * app.route('/api/files', createFilesRoutes(JWT_SECRET, UPLOADS_DIR))
 */
export function createFilesRoutes(jwtSecret: string, uploadsDir: string) {
  const files = new Hono()

  /**
   * JWT-Middleware für ALLE Routen in diesem Router.
   */
  files.use('/*', jwt({ secret: jwtSecret, alg: 'HS256' }))

  // ===================
  // Get All Files
  // ===================
  /**
   * GET /api/files
   * 
   * Gibt alle Dateien des aktuellen Users zurück.
   * 
   * Response: FileMetadata[] (sortiert nach Upload-Datum absteigend)
   */
  files.get('/', (c) => {
    const payload = c.get('jwtPayload') as JwtPayload
    const userFiles = fileRepository.findAllByUserId(payload.id)
    return c.json(userFiles || [])
  })

  // ===================
  // Upload File
  // ===================
  /**
   * POST /api/files
   * 
   * Lädt eine neue Datei hoch.
   * 
   * Request: multipart/form-data mit:
   * - file: Die Datei selbst
   * - description (optional): Beschreibung der Datei
   * 
   * Response: { success: true, file: FileMetadata } oder { error: string }
   */
  files.post('/', async (c) => {
    const payload = c.get('jwtPayload') as JwtPayload

    try {
      // Multipart Form Data parsen
      const formData = await c.req.formData()
      const file = formData.get('file')
      const description = formData.get('description')

      // Datei vorhanden?
      if (!file || !(file instanceof File)) {
        return c.json({ error: 'No file provided' }, 400)
      }

      // Dateigröße prüfen
      if (file.size > MAX_FILE_SIZE) {
        return c.json({ error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` }, 400)
      }

      // MIME-Type prüfen
      if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
        return c.json({ 
          error: `File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` 
        }, 400)
      }

      // Beschreibung validieren (falls vorhanden)
      let fileDescription: string | undefined
      if (description && typeof description === 'string') {
        if (description.length > 500) {
          return c.json({ error: 'Description cannot exceed 500 characters' }, 400)
        }
        fileDescription = description.trim() || undefined
      }

      // Eindeutigen Dateinamen generieren (UUID + Original-Extension)
      const fileId = crypto.randomUUID()
      const originalName = file.name
      const extension = originalName.includes('.') 
        ? originalName.substring(originalName.lastIndexOf('.'))
        : ''
      const storedName = `${fileId}${extension}`

      // User-Verzeichnis erstellen falls nicht vorhanden
      const userDir = join(uploadsDir, payload.id.toString())
      await mkdir(userDir, { recursive: true })

      // Datei speichern
      const filePath = join(userDir, storedName)
      const buffer = await file.arrayBuffer()
      await Bun.write(filePath, buffer)

      // Metadaten in DB speichern
      const fileMetadata = fileRepository.create({
        originalName,
        storedName,
        mimeType: file.type,
        size: file.size,
        description: fileDescription,
        userId: payload.id,
      })

      return c.json({ success: true, file: fileMetadata })
    } catch (e) {
      console.error('File upload error:', e)
      return c.json({ error: 'File upload failed' }, 500)
    }
  })

  // ===================
  // Download File
  // ===================
  /**
   * GET /api/files/:id/download
   * 
   * Lädt eine Datei herunter.
   * SICHERHEIT: Prüft ob Datei dem aktuellen User gehört.
   */
  files.get('/:id/download', async (c) => {
    const payload = c.get('jwtPayload') as JwtPayload
    const fileId = parseInt(c.req.param('id'))

    if (isNaN(fileId)) {
      return c.json({ error: 'Invalid file ID' }, 400)
    }

    // Datei-Metadaten aus DB laden
    const fileMetadata = fileRepository.findById(fileId)

    if (!fileMetadata) {
      return c.json({ error: 'File not found' }, 404)
    }

    // Prüfen ob Datei dem User gehört
    if (fileMetadata.userId !== payload.id) {
      return c.json({ error: 'Access denied' }, 403)
    }

    // Datei vom Filesystem laden
    const filePath = join(uploadsDir, payload.id.toString(), fileMetadata.storedName)

    try {
      const file = Bun.file(filePath)
      const exists = await file.exists()

      if (!exists) {
        return c.json({ error: 'File not found on disk' }, 404)
      }

      // Response mit Original-Dateinamen im Header
      return new Response(file, {
        headers: {
          'Content-Type': fileMetadata.mimeType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(fileMetadata.originalName)}"`,
          'Content-Length': fileMetadata.size.toString(),
        },
      })
    } catch (e) {
      console.error('File download error:', e)
      return c.json({ error: 'File download failed' }, 500)
    }
  })

  // ===================
  // Delete File
  // ===================
  /**
   * DELETE /api/files/:id
   * 
   * Löscht eine Datei (Filesystem + DB).
   * SICHERHEIT: Prüft ob Datei dem aktuellen User gehört.
   */
  files.delete('/:id', async (c) => {
    const payload = c.get('jwtPayload') as JwtPayload
    const fileId = parseInt(c.req.param('id'))

    if (isNaN(fileId)) {
      return c.json({ error: 'Invalid file ID' }, 400)
    }

    // Datei-Metadaten aus DB laden
    const fileMetadata = fileRepository.findById(fileId)

    if (!fileMetadata) {
      return c.json({ error: 'File not found' }, 404)
    }

    // Prüfen ob Datei dem User gehört
    if (fileMetadata.userId !== payload.id) {
      return c.json({ error: 'Access denied' }, 403)
    }

    try {
      // Datei vom Filesystem löschen
      const filePath = join(uploadsDir, payload.id.toString(), fileMetadata.storedName)
      await unlink(filePath).catch(() => {}) // Ignoriere Fehler falls Datei nicht existiert

      // Metadaten aus DB löschen
      fileRepository.delete(fileId)

      return c.json({ success: true })
    } catch (e) {
      console.error('File delete error:', e)
      return c.json({ error: 'File deletion failed' }, 500)
    }
  })

  return files
}
