/**
 * @file components/auth/AuthForm.tsx
 * @description Login/Registrierungs-Formular mit Toggle.
 * 
 * DESIGN-ENTSCHEIDUNGEN:
 * - Kombiniertes Formular: Login und Signup in einer Komponente
 * - Controlled Inputs: React verwaltet alle Formular-Werte
 * - Callback Props: onLogin/onSignup kommen von außen (lose Kopplung)
 * - HTML5 Validierung: minLength, required für einfache Validierung
 */

import { useState, type FormEvent } from 'react'
import { Input, Button, Card, CardHeader, Alert } from '../ui'

/**
 * Props für AuthForm.
 * Form-State (username, password, email) wird intern verwaltet,
 * aber Auth-Logik wird von außen injiziert.
 */
interface AuthFormProps {
  loading: boolean                                                  // Zeigt Lade-Zustand
  error: string                                                     // Fehlermeldung
  onLogin: (username: string, password: string) => Promise<boolean> // Login-Handler
  onSignup: (username: string, password: string, email?: string) => Promise<boolean> // Signup-Handler
  onForgotPassword?: () => void                                     // Passwort vergessen Handler
}

/**
 * Authentifizierungs-Formular mit Login/Signup-Toggle.
 * 
 * FLOW:
 * 1. User gibt Credentials ein
 * 2. User klickt Submit
 * 3. onLogin/onSignup wird aufgerufen (je nach Modus)
 * 4. Bei Signup-Erfolg: Wechsel zu Login-Modus
 */
export function AuthForm({ loading, error, onLogin, onSignup, onForgotPassword }: AuthFormProps) {
  // Lokaler State für Formular-Modus und Eingaben
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')

  /**
   * Formular-Submit-Handler.
   * Ruft je nach Modus login oder signup auf.
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()  // Verhindert Browser-Redirect
    
    // Handler basierend auf aktuellem Modus wählen
    const success = isLogin 
      ? await onLogin(username, password)
      : await onSignup(username, password, email || undefined)

    // Bei erfolgreichem Signup: Wechsel zu Login und Formular leeren
    // WARUM? User soll sich nach Registrierung explizit einloggen
    if (success && !isLogin) {
      setIsLogin(true)
      setUsername('')
      setPassword('')
      setEmail('')
    }
  }

  /**
   * Toggle zwischen Login und Signup.
   */
  const toggleMode = () => {
    setIsLogin(!isLogin)
  }

  return (
    <Card className="max-w-md w-full">
      {/* Dynamischer Titel basierend auf Modus */}
      <CardHeader title={isLogin ? 'Login' : 'Registrieren'} />

      {/* Fehlermeldung mit automatischer Variant-Erkennung */}
      {/* "erfolgreich" im Text → success variant (grün) */}
      {error && (
        <Alert
          message={error}
          variant={error.includes('erfolgreich') ? 'success' : 'error'}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username Input mit Validierung */}
        <Input
          type="text"
          placeholder="Benutzername"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}   // Entspricht Backend-Validierung
          maxLength={50}  // Entspricht Backend-Validierung
          autoComplete="username"  // Browser-Autofill
        />

        {/* E-Mail Input (nur bei Signup, optional) */}
        {!isLogin && (
          <Input
            type="email"
            placeholder="E-Mail (optional, für Passwort-Reset)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        )}

        {/* Password Input mit Validierung */}
        <Input
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}  // Entspricht Backend-Validierung
          // autoComplete unterscheidet sich je nach Modus
          autoComplete={isLogin ? 'current-password' : 'new-password'}
        />

        {/* Submit Button */}
        <Button type="submit" loading={loading} className="w-full">
          {isLogin ? 'Anmelden' : 'Konto erstellen'}
        </Button>
      </form>

      {/* Passwort vergessen Link (nur bei Login) */}
      {isLogin && onForgotPassword && (
        <button
          type="button"
          onClick={onForgotPassword}
          className="w-full mt-2 text-center text-sm text-blue-600 hover:text-blue-800"
        >
          Passwort vergessen?
        </button>
      )}

      {/* Toggle-Link zwischen Modi */}
      <Button
        variant="ghost"
        onClick={toggleMode}
        className="w-full mt-4 text-sm"
      >
        {isLogin ? 'Noch kein Konto? Registrieren' : 'Bereits ein Konto? Login'}
      </Button>
    </Card>
  )
}
