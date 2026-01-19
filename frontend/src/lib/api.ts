/**
 * @file lib/api.ts
 * @description Zentralisierter API-Client für alle Backend-Kommunikation.
 * 
 * WARUM EIN ZENTRALER API-CLIENT?
 * - DRY (Don't Repeat Yourself): Fetch-Logik nur einmal implementiert
 * - Konsistente Fehlerbehandlung: Alle API-Fehler werden gleich verarbeitet
 * - Einfache Wartung: Änderungen an Headers/Auth nur an einer Stelle
 * - Testbarkeit: API-Aufrufe können leicht gemockt werden
 * - Type Safety: Generische Typisierung für alle Responses
 */

import type { Entry, AuthResponse, EntryResponse } from '../types'

// ===================
// API Configuration
// ===================

/**
 * Basis-URL für alle API-Aufrufe.
 * Relativ, da Frontend und Backend vom selben Server serviert werden.
 */
const API_BASE = '/api'

/** Unterstützte HTTP-Methoden */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

/** Optionen für API-Requests */
interface RequestOptions {
  method?: HttpMethod  // HTTP-Methode, Standard: GET
  body?: unknown       // Request-Body (wird zu JSON serialisiert)
  token?: string       // JWT-Token für authentifizierte Requests
}

// ===================
// Generic Fetch Wrapper
// ===================

/**
 * Generische Fetch-Funktion mit eingebauter Fehlerbehandlung.
 * 
 * WARUM GENERISCH?
 * - Typsicherheit: Der Rückgabetyp wird vom Aufrufer bestimmt
 * - Wiederverwendbar: Funktioniert für alle API-Endpunkte
 * 
 * @param endpoint - API-Endpunkt (ohne Basis-URL)
 * @param options - Request-Optionen (method, body, token)
 * @returns Promise mit data, error und status
 */
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<{ data?: T; error?: string; status: number }> {
  const { method = 'GET', body, token } = options

  // Headers aufbauen - Content-Type ist immer JSON
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  // Authorization-Header nur hinzufügen wenn Token vorhanden
  // WICHTIG: Bearer-Schema ist Standard für JWT
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      // Body nur bei Nicht-GET-Requests senden
      body: body ? JSON.stringify(body) : undefined,
    })

    // JSON parsen, bei Fehler leeres Objekt zurückgeben
    // WARUM catch(() => {})? Manche Responses haben keinen Body (z.B. 204)
    const data = await response.json().catch(() => ({}))

    // Bei HTTP-Fehlern (4xx, 5xx) error zurückgeben
    if (!response.ok) {
      return { error: data.error || 'Ein Fehler ist aufgetreten', status: response.status }
    }

    return { data, status: response.status }
  } catch (error) {
    // Netzwerkfehler (keine Verbindung, CORS, etc.)
    console.error('API Request Error:', error)
    return { error: 'Netzwerkfehler', status: 0 }
  }
}

// ===================
// Auth API
// ===================

/**
 * API-Funktionen für Authentifizierung.
 * Gruppiert als Objekt für bessere Organisation und Autovervollständigung.
 */
export const authApi = {
  /**
   * Benutzer einloggen.
   * @returns Token bei Erfolg, Fehler bei ungültigen Credentials
   */
  login: async (username: string, password: string) => {
    return request<AuthResponse>('/login', {
      method: 'POST',
      body: { username, password },
    })
  },

  /**
   * Neuen Benutzer registrieren.
   * @returns success: true bei Erfolg
   */
  signup: async (username: string, password: string) => {
    return request<AuthResponse>('/signup', {
      method: 'POST',
      body: { username, password },
    })
  },
}

// ===================
// Entries API
// ===================

/**
 * API-Funktionen für Einträge.
 * Alle Funktionen erfordern ein gültiges JWT-Token.
 */
export const entriesApi = {
  /**
   * Alle Einträge des aktuellen Benutzers abrufen.
   * @param token - JWT-Token für Authentifizierung
   */
  getAll: async (token: string) => {
    return request<Entry[]>('/entries', { token })
  },

  /**
   * Neuen Eintrag erstellen.
   * @param token - JWT-Token für Authentifizierung
   * @param text - Inhalt des neuen Eintrags
   */
  create: async (token: string, text: string) => {
    return request<EntryResponse>('/entries', {
      method: 'POST',
      token,
      body: { text },
    })
  },
}
