/**
 * @file middleware/rateLimit.ts
 * @description Rate-Limiting Middleware zum Schutz vor Brute-Force-Angriffen.
 * 
 * WARUM RATE LIMITING?
 * - Schutz vor Brute-Force-Angriffen auf Login/Signup
 * - Verhindert API-Missbrauch
 * - Schont Server-Ressourcen
 * 
 * IMPLEMENTIERUNG:
 * - In-Memory Map (kein Redis nötig für kleine Anwendungen)
 * - IP-basiertes Tracking
 * - Sliding Window Pattern
 * 
 * LIMITATIONEN:
 * - Nicht für Multi-Server-Setup geeignet (kein Shared State)
 * - Geht bei Server-Restart verloren
 * - Für größere Anwendungen: Redis-basierte Lösung empfohlen
 */

import type { Context, Next } from 'hono'

// ===================
// Rate Limit Storage
// ===================

/**
 * In-Memory Speicher für Rate-Limit-Daten.
 * Key: IP-Adresse
 * Value: Anzahl Requests + Reset-Zeitpunkt
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// ===================
// Rate Limit Middleware Factory
// ===================

/**
 * Factory-Funktion für Rate-Limiting Middleware.
 * 
 * PATTERN: Middleware Factory
 * - Ermöglicht unterschiedliche Limits pro Route
 * - z.B. strikteres Limit für /signup als für /login
 * 
 * @param limit - Maximale Anzahl Requests im Zeitfenster
 * @param windowMs - Zeitfenster in Millisekunden
 * 
 * @example
 * // Max 5 Requests pro Minute für Signup
 * app.post('/signup', rateLimit(5, 60 * 1000), handler)
 * 
 * // Max 10 Requests pro Minute für Login
 * app.post('/login', rateLimit(10, 60 * 1000), handler)
 */
export function rateLimit(limit: number, windowMs: number) {
  return async (c: Context, next: Next) => {
    // IP-Adresse ermitteln (mit Proxy-Header-Fallbacks)
    // WICHTIG: Bei Reverse Proxy (nginx) werden diese Header gesetzt
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
    const now = Date.now()
    const record = rateLimitMap.get(ip)

    if (!record || now > record.resetTime) {
      // Kein Eintrag oder Zeitfenster abgelaufen: Neu starten
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    } else if (record.count >= limit) {
      // Limit erreicht: 429 Too Many Requests
      return c.json({ error: 'Too many requests. Please try again later.' }, 429)
    } else {
      // Innerhalb des Limits: Counter erhöhen
      record.count++
    }

    // Request durchlassen
    await next()
  }
}

// ===================
// Cleanup Job
// ===================

/**
 * Startet einen periodischen Cleanup-Job für abgelaufene Rate-Limit-Einträge.
 * 
 * WARUM CLEANUP?
 * - Verhindert Memory Leaks bei vielen verschiedenen IPs
 * - Map wächst nicht unbegrenzt
 * 
 * @param intervalMs - Cleanup-Intervall (default: 5 Minuten)
 * 
 * HINWEIS: Muss beim Server-Start aufgerufen werden!
 */
export function startRateLimitCleanup(intervalMs: number = 5 * 60 * 1000): void {
  setInterval(() => {
    const now = Date.now()
    // Alle abgelaufenen Einträge entfernen
    for (const [ip, record] of rateLimitMap.entries()) {
      if (now > record.resetTime) {
        rateLimitMap.delete(ip)
      }
    }
  }, intervalMs)
}
