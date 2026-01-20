/**
 * @file index.ts
 * @description Haupt-Einstiegspunkt des Backend-Servers.
 * 
 * VERANTWORTLICHKEITEN:
 * - Umgebungsvariablen validieren
 * - Datenbank initialisieren
 * - Middleware starten (Rate Limit Cleanup)
 * - Routen mounten
 * - Statische Dateien servieren (Frontend)
 * - SPA-Fallback für Client-Side-Routing
 * 
 * ARCHITEKTUR:
 * - Single Server serviert API + Frontend
 * - Keine separate Nginx/Apache nötig
 * - Ideal für Low-RAM VPS
 */

import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { secureHeaders } from 'hono/secure-headers'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { mkdir } from 'node:fs/promises'

// Local Modules
import { initializeDatabase } from './db'
import { createAuthRoutes, createEntriesRoutes, createHealthRoutes, createFilesRoutes, createPasswordResetRoutes } from './routes'
import { startRateLimitCleanup } from './middleware'

// ===================
// Environment Validation
// ===================

/**
 * JWT_SECRET aus Umgebungsvariable laden.
 * SICHERHEIT: NIEMALS hardcoden oder ins Repository committen!
 */
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is required')
  console.error('   Set it with: export JWT_SECRET="your-secure-secret-here"')
  process.exit(1)  // Beenden wenn nicht gesetzt
}

// ===================
// Initialize
// ===================

const app = new Hono()

// ===================
// Security Headers
// ===================

/**
 * Secure Headers Middleware.
 * Aktiviert gängige Sicherheits-Header wie:
 * - X-XSS-Protection
 * - X-Content-Type-Options: nosniff
 * - X-Frame-Options: SAMEORIGIN
 * - Strict-Transport-Security (HSTS)
 * - Content-Security-Policy (CSP)
 */
app.use('*', secureHeaders({
  // XSS-Schutz aktivieren
  xXssProtection: '1; mode=block',
  // Verhindert MIME-Type Sniffing
  xContentTypeOptions: 'nosniff',
  // Verhindert Einbettung in fremde iframes (Clickjacking-Schutz)
  xFrameOptions: 'SAMEORIGIN',
  // HSTS: Erzwingt HTTPS für 1 Jahr (in Produktion aktivieren)
  strictTransportSecurity: 'max-age=31536000; includeSubDomains',
  // Referrer nur bei same-origin senden
  referrerPolicy: 'strict-origin-when-cross-origin',
}))

/**
 * Datenbank-Schema initialisieren.
 * Erstellt Tabellen falls nicht vorhanden.
 * IDEMPOTENT: Kann bei jedem Start aufgerufen werden.
 */
initializeDatabase()

/**
 * Rate-Limit Cleanup-Job starten.
 * Entfernt abgelaufene Einträge alle 5 Minuten.
 * Verhindert Memory Leaks.
 */
startRateLimitCleanup()

/**
 * Uploads-Verzeichnis erstellen falls nicht vorhanden.
 */
const UPLOADS_DIR = join(process.cwd(), 'uploads')
await mkdir(UPLOADS_DIR, { recursive: true })

// ===================
// Mount API Routes
// ===================

/**
 * Route-Mounting Reihenfolge:
 * 1. Health: Öffentlich, für Monitoring
 * 2. Auth: Login/Signup, rate-limited
 * 3. Password Reset: Passwort-Reset-Funktionalität
 * 4. Entries: JWT-geschützt, CRUD-Operationen
 * 5. Files: JWT-geschützt, Datei-Uploads
 */
app.route('/api/health', createHealthRoutes())
app.route('/api', createAuthRoutes(JWT_SECRET))
app.route('/api', createPasswordResetRoutes())
app.route('/api/entries', createEntriesRoutes(JWT_SECRET))
app.route('/api/files', createFilesRoutes(JWT_SECRET, UPLOADS_DIR))

// ===================
// Static Files & PWA
// ===================

/**
 * Service Worker mit No-Cache Header.
 * WICHTIG für PWA Updates!
 * 
 * Ohne diesen Header cached der Browser die sw.js
 * und Updates werden nicht erkannt.
 */
app.use('/sw.js', async (c, next) => {
  await next()
  if (c.res.status === 200) {
    c.res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
  }
})

/**
 * Statische Dateien aus /dist servieren.
 * Enthält das gebaute React-Frontend.
 * 
 * PFAD: '../dist' relativ zu /backend
 */
app.use('/*', serveStatic({ root: '../dist' }))

/**
 * SPA Fallback für Client-Side-Routing.
 * 
 * PROBLEM: React Router verwendet URLs wie /dashboard, /settings
 * Ohne Fallback → 404, weil keine physische Datei existiert
 * 
 * LÖSUNG: Alle Nicht-API, Nicht-Datei Requests → index.html
 * React Router übernimmt dann das Routing im Browser
 * 
 * BEDINGUNGEN:
 * - Nicht /api/* (API-Routen)
 * - Kein '.' im Pfad (keine Dateien wie .js, .css)
 */
app.get('*', async (c) => {
  const path = c.req.path
  if (!path.startsWith('/api') && !path.includes('.')) {
    const content = await readFile(join(process.cwd(), '../dist/index.html'), 'utf-8')
    return c.html(content)
  }
  return c.text('Not Found', 404)
})

// ===================
// Server Export
// ===================

/**
 * Bun-spezifischer Server-Export.
 * 
 * Bun erkennt default export mit fetch-Property
 * und startet automatisch HTTP-Server.
 * 
 * KONFIGURATION:
 * - port: 3000 (Standard)
 * - hostname: 0.0.0.0 (alle Interfaces, wichtig für Docker/VPS)
 */
export default {
  port: 3000,
  hostname: '0.0.0.0',
  fetch: app.fetch,
}
