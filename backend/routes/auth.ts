/**
 * @file routes/auth.ts
 * @description Authentifizierungs-Routen (Login & Signup).
 * 
 * SICHERHEITS-FEATURES:
 * - Rate Limiting gegen Brute-Force
 * - Passwort-Hashing mit Bun.password (Argon2/bcrypt)
 * - JWT mit HS256 und 24h Ablauf
 * - Validierung aller Eingaben
 * 
 * PATTERN: Route Factory
 * - Funktion erhält Konfiguration (jwtSecret)
 * - Gibt konfigurierten Hono-Router zurück
 * - Ermöglicht Dependency Injection für Tests
 */

import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import { userRepository } from '../db'
import { validateAuth } from '../validation'
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
   * Request Body: { username: string, password: string }
   * Response: { success: true } oder { error: string }
   */
  auth.post('/signup', rateLimit(5, 60 * 1000), async (c) => {
    try {
      const body = await c.req.json()
      
      // Validierung der Eingaben (Username 3-50 Zeichen, Password 8-128 Zeichen)
      const validation = validateAuth(body.username, body.password)

      if (!validation.valid) {
        return c.json({ error: validation.error }, 400)
      }

      // Passwort hashen BEVOR es in die DB kommt!
      // WICHTIG: Bun.password.hash() verwendet Argon2 oder bcrypt
      const hashedPassword = await Bun.password.hash(validation.password)
      
      // User in DB speichern (username ist UNIQUE)
      userRepository.create(validation.username, hashedPassword)

      return c.json({ success: true })
    } catch (e) {
      // UNIQUE Constraint Violation → User existiert bereits
      return c.json({ error: 'User already exists' }, 400)
    }
  })

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
  auth.post('/login', rateLimit(10, 60 * 1000), async (c) => {
    try {
      const body = await c.req.json()
      
      // Auch beim Login validieren (verhindert ungültige DB-Queries)
      const validation = validateAuth(body.username, body.password)

      if (!validation.valid) {
        return c.json({ error: validation.error }, 400)
      }

      // User aus DB laden
      const user = userRepository.findByUsername(validation.username)

      // Passwort verifizieren wenn User existiert
      // WICHTIG: Bun.password.verify() ist timing-safe
      if (user && await Bun.password.verify(validation.password, user.password)) {
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
  })

  return auth
}
