/**
 * @file routes/auth.ts
 * @description Authentifizierungs-Routen (Login & Signup).
 * 
 * SICHERHEITS-FEATURES:
 * - Rate Limiting gegen Brute-Force
 * - Passwort-Hashing mit Bun.password (Argon2/bcrypt)
 * - JWT mit HS256 und 24h Ablauf
 * - Zod-basierte Eingabe-Validierung
 * 
 * PATTERN: Route Factory
 * - Funktion erhält Konfiguration (jwtSecret)
 * - Gibt konfigurierten Hono-Router zurück
 * - Ermöglicht Dependency Injection für Tests
 */

import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import { zValidator } from '@hono/zod-validator'
import { userRepository } from '../db'
import { authSchema, signupSchema } from '../validation'
import { rateLimit } from '../middleware'

// ===================
// Auth Routes
// ===================

/**
 * Erstellt Auth-Router mit Signup und Login Routen.
 * 
 * @param jwtSecret - Secret für JWT-Signierung (aus Umgebungsvariable)
 * @returns Konfigurierter Hono-Router
 * 
 * @example
 * // In index.ts:
 * app.route('/api', createAuthRoutes(JWT_SECRET))
 */
export function createAuthRoutes(jwtSecret: string) {
  const auth = new Hono()

  // ===================
  // Sign Up
  // ===================
  /**
   * POST /api/signup
   * 
   * Registriert einen neuen Benutzer.
   * Rate Limit: 5 Requests pro Minute (strikt gegen Spam)
   * 
   * Request Body: { username: string, password: string, email?: string }
   * Response: { success: true } oder { error: string }
   */
  auth.post(
    '/signup',
    rateLimit(5, 60 * 1000),
    zValidator('json', signupSchema, (result, c) => {
      if (!result.success) {
        const firstError = result.error.issues[0]?.message || 'Validation failed'
        return c.json({ error: firstError }, 400)
      }
    }),
    async (c) => {
      try {
        // Validierte Daten aus dem Request (Zod hat bereits validiert)
        const { username, password, email } = c.req.valid('json')

        // Passwort hashen BEVOR es in die DB kommt!
        // WICHTIG: Bun.password.hash() verwendet Argon2 oder bcrypt
        const hashedPassword = await Bun.password.hash(password)

        // User in DB speichern (username ist UNIQUE)
        userRepository.create(username, hashedPassword, email)

        return c.json({ success: true })
      } catch (e) {
        // UNIQUE Constraint Violation → User existiert bereits
        return c.json({ error: 'User already exists' }, 400)
      }
    }
  )

  // ===================
  // Login
  // ===================
  /**
   * POST /api/login
   * 
   * Authentifiziert einen Benutzer und gibt JWT zurück.
   * Rate Limit: 10 Requests pro Minute (etwas lockerer als Signup)
   * 
   * Request Body: { username: string, password: string }
   * Response: { token: string } oder { error: string }
   */
  auth.post(
    '/login',
    rateLimit(10, 60 * 1000),
    zValidator('json', authSchema, (result, c) => {
      if (!result.success) {
        const firstError = result.error.issues[0]?.message || 'Validation failed'
        return c.json({ error: firstError }, 400)
      }
    }),
    async (c) => {
      try {
        // Validierte Daten aus dem Request (Zod hat bereits validiert)
        const { username, password } = c.req.valid('json')

        // User aus DB laden
        const user = userRepository.findByUsername(username)

        // Passwort verifizieren wenn User existiert
        // WICHTIG: Bun.password.verify() ist timing-safe
        if (user && await Bun.password.verify(password, user.password)) {
          // JWT erstellen mit User-Infos und 24h Ablauf
          const token = await sign(
            {
              id: user.id,
              username: user.username,
              // exp: Unix-Timestamp, 24h in der Zukunft
              exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
            },
            jwtSecret,
            'HS256'  // WICHTIG: Algorithmus explizit angeben!
          )
          return c.json({ token })
        }

        // Generische Fehlermeldung (verrät nicht ob User existiert)
        return c.json({ error: 'Invalid credentials' }, 401)
      } catch (e) {
        return c.json({ error: 'Invalid request' }, 400)
      }
    }
  )

  return auth
}
