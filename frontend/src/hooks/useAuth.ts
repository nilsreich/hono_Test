/**
 * @file hooks/useAuth.ts
 * @description Custom Hook für Authentifizierungs-Logik.
 * 
 * WARUM EIN CUSTOM HOOK?
 * - Separation of Concerns: Auth-Logik getrennt von UI-Komponenten
 * - Wiederverwendbarkeit: Kann in jeder Komponente verwendet werden
 * - Testbarkeit: Hook-Logik kann isoliert getestet werden
 * - State-Management: Zentralisierte Verwaltung des Auth-Status
 * 
 * PATTERN: "Headless" Hook
 * - Der Hook verwaltet nur Logik und State
 * - Keine UI-Elemente, nur Daten und Funktionen
 * - Komponenten entscheiden selbst über die Darstellung
 */

import { useState, useCallback } from 'react'
import { authApi } from '../lib/api'
import { tokenStorage } from '../lib/storage'

/**
 * Return-Type des useAuth Hooks.
 * Explizites Interface für bessere Dokumentation und Autovervollständigung.
 */
interface UseAuthReturn {
  token: string                                                    // Aktuelles JWT-Token
  isAuthenticated: boolean                                         // Schneller Check ob eingeloggt
  loading: boolean                                                 // Ladezustand für UI-Feedback
  error: string                                                    // Fehlermeldung für Anzeige
  login: (username: string, password: string) => Promise<boolean>  // Login-Funktion
  signup: (username: string, password: string) => Promise<boolean> // Signup-Funktion
  logout: () => void                                               // Logout-Funktion
  clearError: () => void                                           // Fehler zurücksetzen
}

/**
 * Hook für Authentifizierungs-Operationen.
 * Verwaltet Token, Ladezustand und Fehlermeldungen.
 */
export function useAuth(): UseAuthReturn {
  // Token initial aus LocalStorage laden (Lazy Initialization)
  // WARUM LAZY? Verhindert unnötigen LocalStorage-Zugriff bei jedem Render
  const [token, setToken] = useState(() => tokenStorage.get() || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  /**
   * Login-Funktion.
   * useCallback verhindert unnötige Re-Renders von Kind-Komponenten.
   * 
   * @returns true bei Erfolg, false bei Fehler
   */
  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    setLoading(true)
    setError('')

    const { data, error: apiError, status } = await authApi.login(username, password)

    setLoading(false)

    if (apiError) {
      // 401 = Ungültige Credentials, speziell behandeln für bessere UX
      setError(status === 401 ? 'Ungültige Anmeldedaten' : apiError)
      return false
    }

    if (data?.token) {
      // Token sowohl im Storage als auch im State speichern
      // Storage: Für Persistenz über Page-Reloads
      // State: Für reaktive UI-Updates
      tokenStorage.set(data.token)
      setToken(data.token)
      return true
    }

    return false
  }, [])

  /**
   * Signup-Funktion.
   * Bei Erfolg wird NICHT automatisch eingeloggt - User muss Login bestätigen.
   * 
   * WARUM NICHT AUTO-LOGIN?
   * - Explizite User-Aktion für Sicherheit
   * - Möglichkeit für E-Mail-Verifizierung später
   */
  const signup = useCallback(async (username: string, password: string): Promise<boolean> => {
    setLoading(true)
    setError('')

    const { error: apiError } = await authApi.signup(username, password)

    setLoading(false)

    if (apiError) {
      setError(apiError)
      return false
    }

    // Erfolg als "Fehler" anzeigen (wird grün dargestellt durch Variant-Check)
    setError('Registrierung erfolgreich! Bitte einloggen.')
    return true
  }, [])

  /**
   * Logout-Funktion.
   * Entfernt Token und setzt State zurück.
   */
  const logout = useCallback(() => {
    tokenStorage.remove()
    setToken('')
  }, [])

  /**
   * Fehler manuell zurücksetzen.
   * Nützlich wenn User die Fehlermeldung schließen will.
   */
  const clearError = useCallback(() => {
    setError('')
  }, [])

  return {
    token,
    isAuthenticated: !!token,  // Konvertiert zu Boolean
    loading,
    error,
    login,
    signup,
    logout,
    clearError,
  }
}
