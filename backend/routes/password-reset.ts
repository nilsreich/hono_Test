/**
 * @file routes/password-reset.ts
 * @description Passwort-Reset-Routen mit Resend E-Mail-Integration.
 * 
 * SICHERHEITS-FEATURES:
 * - Rate Limiting gegen Missbrauch
 * - UUID-basierte Tokens (kryptographisch sicher)
 * - Token-Ablauf nach 1 Stunde
 * - Token wird nach Verwendung gelöscht
 * - E-Mail über Resend API (kein eigener SMTP-Server nötig)
 * 
 * UMGEBUNGSVARIABLEN (in .env):
 * - RESEND_API_KEY: API-Key von Resend
 * - APP_URL: URL der Anwendung (für Reset-Link)
 * - EMAIL_FROM: Absender-E-Mail (verifizierte Domain bei Resend)
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { userRepository } from '../db'
import { forgotPasswordSchema, resetPasswordSchema } from '../validation'
import { rateLimit } from '../middleware'

// ===================
// Resend Email Service
// ===================

/**
 * Sendet eine E-Mail über die Resend API.
 * Verwendet native Bun fetch - kein nodemailer nötig!
 * 
 * @param to - Empfänger E-Mail
 * @param subject - Betreff
 * @param html - HTML-Inhalt der E-Mail
 * @returns true bei Erfolg, false bei Fehler
 */
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM || 'noreply@example.com'

  if (!apiKey) {
    console.error('RESEND_API_KEY not configured')
    return false
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error('Resend API error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

/**
 * Generiert den HTML-Inhalt der Passwort-Reset-E-Mail.
 * Minimales, responsives Design.
 * 
 * @param resetUrl - URL zum Zurücksetzen des Passworts
 * @param username - Benutzername für Personalisierung
 */
function generateResetEmail(resetUrl: string, username: string): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Passwort zurücksetzen</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e4e4e7;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #18181b;">🔐 Passwort zurücksetzen</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 30px 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #3f3f46;">
                Hallo <strong>${username}</strong>,
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #3f3f46;">
                Du hast angefordert, dein Passwort zurückzusetzen. Klicke auf den Button unten, um ein neues Passwort zu erstellen:
              </p>
              <!-- Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 6px;">
                      Passwort zurücksetzen
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #71717a;">
                Dieser Link ist <strong>1 Stunde</strong> gültig. Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; text-align: center; border-top: 1px solid #e4e4e7; background-color: #fafafa; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: #2563eb; word-break: break-all;">
                ${resetUrl}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

// ===================
// Password Reset Routes
// ===================

/**
 * Erstellt Password-Reset-Router.
 * 
 * @returns Konfigurierter Hono-Router
 * 
 * @example
 * // In index.ts:
 * app.route('/api', createPasswordResetRoutes())
 */
export function createPasswordResetRoutes() {
  const passwordReset = new Hono()

  // ===================
  // Forgot Password
  // ===================
  /**
   * POST /api/forgot-password
   * 
   * Startet den Passwort-Reset-Prozess.
   * Rate Limit: 3 Requests pro Minute (strikt gegen Spam)
   * 
   * Request Body: { email: string }
   * Response: { success: true, message: string }
   * 
   * SICHERHEIT: Gibt immer Erfolg zurück, auch wenn E-Mail nicht existiert
   * (verhindert User Enumeration)
   */
  passwordReset.post(
    '/forgot-password',
    rateLimit(3, 60 * 1000),
    zValidator('json', forgotPasswordSchema, (result, c) => {
      if (!result.success) {
        const firstError = result.error.issues[0]?.message || 'Validation failed'
        return c.json({ error: firstError }, 400)
      }
    }),
    async (c) => {
      const { email } = c.req.valid('json')

      // User anhand der E-Mail suchen
      const user = userRepository.findByEmail(email)

      // Immer Erfolg zurückgeben (verhindert User Enumeration)
      const successResponse = {
        success: true,
        message: 'Falls ein Konto mit dieser E-Mail existiert, wurde eine E-Mail gesendet.',
      }

      // Falls User nicht gefunden, trotzdem Erfolg zurückgeben
      if (!user) {
        return c.json(successResponse)
      }

      try {
        // UUID-Token generieren (kryptographisch sicher)
        const resetToken = crypto.randomUUID()

        // Ablaufdatum: 1 Stunde ab jetzt (als Unix-Timestamp)
        const resetExpires = Date.now() + 60 * 60 * 1000

        // Token in DB speichern
        userRepository.setResetToken(user.id, resetToken, resetExpires)

        // Reset-URL generieren
        const appUrl = process.env.APP_URL || 'http://localhost:5173'
        const resetUrl = `${appUrl}/reset-password?token=${resetToken}`

        // E-Mail senden
        const emailSent = await sendEmail(
          email,
          'Passwort zurücksetzen',
          generateResetEmail(resetUrl, user.username)
        )

        if (!emailSent) {
          console.error('Failed to send password reset email to:', email)
          // Trotzdem Erfolg zurückgeben (User soll nicht wissen, dass es einen Fehler gab)
        }

        return c.json(successResponse)
      } catch (error) {
        console.error('Forgot password error:', error)
        return c.json(successResponse)
      }
    }
  )

  // ===================
  // Reset Password
  // ===================
  /**
   * POST /api/reset-password
   * 
   * Setzt das Passwort zurück mit gültigem Token.
   * Rate Limit: 5 Requests pro Minute
   * 
   * Request Body: { token: string, password: string }
   * Response: { success: true } oder { error: string }
   */
  passwordReset.post(
    '/reset-password',
    rateLimit(5, 60 * 1000),
    zValidator('json', resetPasswordSchema, (result, c) => {
      if (!result.success) {
        const firstError = result.error.issues[0]?.message || 'Validation failed'
        return c.json({ error: firstError }, 400)
      }
    }),
    async (c) => {
      const { token, password } = c.req.valid('json')

      try {
        // User anhand des Reset-Tokens suchen
        const user = userRepository.findByResetToken(token)

        if (!user) {
          return c.json({ error: 'Ungültiger oder abgelaufener Reset-Link' }, 400)
        }

        // Prüfen ob Token abgelaufen ist
        if (!user.reset_expires || user.reset_expires < Date.now()) {
          // Token löschen (aufräumen)
          userRepository.clearResetToken(user.id)
          return c.json({ error: 'Der Reset-Link ist abgelaufen. Bitte fordere einen neuen an.' }, 400)
        }

        // Neues Passwort hashen
        const hashedPassword = await Bun.password.hash(password)

        // Passwort aktualisieren
        userRepository.updatePassword(user.id, hashedPassword)

        // Reset-Token löschen (einmalige Verwendung)
        userRepository.clearResetToken(user.id)

        return c.json({ success: true, message: 'Passwort wurde erfolgreich zurückgesetzt' })
      } catch (error) {
        console.error('Reset password error:', error)
        return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500)
      }
    }
  )

  // ===================
  // Validate Token
  // ===================
  /**
   * GET /api/reset-password/:token
   * 
   * Prüft ob ein Reset-Token gültig ist.
   * Wird vom Frontend verwendet um die Reset-Seite anzuzeigen.
   * 
   * Response: { valid: true } oder { valid: false, error: string }
   */
  passwordReset.get('/reset-password/:token', (c) => {
    const token = c.req.param('token')

    // Token-Format prüfen (UUID)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
      return c.json({ valid: false, error: 'Ungültiger Token' }, 400)
    }

    const user = userRepository.findByResetToken(token)

    if (!user) {
      return c.json({ valid: false, error: 'Token nicht gefunden' }, 404)
    }

    if (!user.reset_expires || user.reset_expires < Date.now()) {
      return c.json({ valid: false, error: 'Token abgelaufen' }, 400)
    }

    return c.json({ valid: true })
  })

  return passwordReset
}
