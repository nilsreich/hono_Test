/**
 * @file routes/health.ts
 * @description Health-Check Route für Monitoring.
 * 
 * WARUM HEALTH CHECKS?
 * - Load Balancer können Server-Status prüfen
 * - Monitoring-Tools (Uptime Robot, etc.) können Verfügbarkeit tracken
 * - Kubernetes/Docker können Liveness-Probes ausführen
 * 
 * KEINE AUTHENTIFIZIERUNG:
 * - Health-Endpoints sollten öffentlich sein
 * - Ermöglicht externes Monitoring ohne Credentials
 */

import { Hono } from 'hono'

// ===================
// Health Routes
// ===================

/**
 * Erstellt Health-Check Router.
 * Keine Konfiguration nötig.
 * 
 * @returns Hono-Router mit Health-Endpoint
 * 
 * @example
 * // In index.ts:
 * app.route('/api/health', createHealthRoutes())
 */
export function createHealthRoutes() {
  const health = new Hono()

  /**
   * GET /api/health
   * 
   * Gibt Server-Status zurück.
   * 
   * Response:
   * - status: 'ok' (Server läuft)
   * - timestamp: ISO-Zeitstempel
   * - uptime: Server-Laufzeit in Sekunden
   */
  health.get('/', (c) => {
    return c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),  // Sekunden seit Server-Start
    })
  })

  return health
}
