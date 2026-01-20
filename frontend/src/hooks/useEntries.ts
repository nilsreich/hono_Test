/**
 * @file hooks/useEntries.ts
 * @description Custom Hook für Einträge-Verwaltung (CRUD-Operationen).
 * 
 * WARUM EIN EIGENER HOOK FÜR ENTRIES?
 * - Separation of Concerns: Einträge-Logik getrennt von Auth-Logik
 * - Lokaler State: Jede Komponente kann eigene Instanz haben
 * - Side Effects: useEffect für automatisches Laden
 * - Callback-Pattern: onUnauthorized für Auth-Integration
 */

import { useState, useEffect, useCallback } from 'react'
import { entriesApi } from '../lib/api'
import type { Entry } from '../types'

/**
 * Return-Type des useEntries Hooks.
 */
interface UseEntriesReturn {
  entries: Entry[]                            // Liste aller Einträge
  loading: boolean                            // Ladezustand
  error: string                               // Fehlermeldung
  fetchEntries: () => Promise<void>           // Manuelles Neuladen
  addEntry: (text: string) => Promise<boolean> // Neuen Eintrag hinzufügen
  updateEntry: (id: number, text: string) => Promise<boolean> // Eintrag aktualisieren
  deleteEntry: (id: number) => Promise<boolean> // Eintrag löschen
  clearError: () => void                      // Fehler zurücksetzen
}

/**
 * Hook für Einträge-Verwaltung.
 * 
 * @param token - JWT-Token für API-Authentifizierung
 * @param onUnauthorized - Callback bei 401-Fehler (z.B. Logout auslösen)
 * 
 * WARUM onUnauthorized ALS CALLBACK?
 * - Lose Kopplung: Hook weiß nicht, wie Auth funktioniert
 * - Flexibilität: Aufrufer entscheidet über Reaktion auf 401
 * - Typisch: logout() Funktion übergeben → automatisches Ausloggen bei Token-Ablauf
 */
export function useEntries(token: string, onUnauthorized?: () => void): UseEntriesReturn {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  /**
   * Einträge vom Server laden.
   * useCallback mit [token, onUnauthorized] als Dependencies.
   */
  const fetchEntries = useCallback(async () => {
    // Ohne Token keine Anfrage senden
    if (!token) return

    setError('')
    setLoading(true)

    const { data, error: apiError, status } = await entriesApi.getAll(token)

    setLoading(false)

    // 401 = Token ungültig/abgelaufen → Callback aufrufen
    if (status === 401) {
      onUnauthorized?.()  // Optional Chaining: Nur aufrufen wenn definiert
      return
    }

    if (apiError) {
      setError('Fehler beim Laden der Einträge')
      return
    }

    // Einträge setzen (oder leeres Array als Fallback)
    setEntries(data || [])
  }, [token, onUnauthorized])

  /**
   * Neuen Eintrag hinzufügen.
   * 
   * @param text - Inhalt des neuen Eintrags
   * @returns true bei Erfolg, false bei Fehler
   */
  const addEntry = useCallback(async (text: string): Promise<boolean> => {
    // Leere Einträge nicht zulassen (Frontend-Validierung)
    if (!text.trim()) return false

    setLoading(true)
    setError('')

    const { error: apiError } = await entriesApi.create(token, text)

    setLoading(false)

    if (apiError) {
      setError(apiError)
      return false
    }

    // Nach erfolgreichem Hinzufügen: Liste neu laden
    // WARUM NICHT LOKAL HINZUFÜGEN?
    // - Server generiert ID und Timestamp
    // - Garantiert Konsistenz mit Datenbank
    // - Einfacher als optimistic Updates
    await fetchEntries()
    return true
  }, [token, fetchEntries])

  /**
   * Eintrag aktualisieren.
   * 
   * @param id - ID des Eintrags
   * @param text - Neuer Inhalt
   * @returns true bei Erfolg, false bei Fehler
   */
  const updateEntry = useCallback(async (id: number, text: string): Promise<boolean> => {
    if (!text.trim()) return false

    setLoading(true)
    setError('')

    const { error: apiError, status } = await entriesApi.update(token, id, text)

    setLoading(false)

    if (status === 401) {
      onUnauthorized?.()
      return false
    }

    if (apiError) {
      setError(apiError)
      return false
    }

    await fetchEntries()
    return true
  }, [token, fetchEntries, onUnauthorized])

  /**
   * Eintrag löschen.
   * 
   * @param id - ID des zu löschenden Eintrags
   * @returns true bei Erfolg, false bei Fehler
   */
  const deleteEntry = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true)
    setError('')

    const { error: apiError, status } = await entriesApi.delete(token, id)

    setLoading(false)

    if (status === 401) {
      onUnauthorized?.()
      return false
    }

    if (apiError) {
      setError(apiError)
      return false
    }

    // Optimistic Update: Eintrag sofort aus lokaler Liste entfernen
    setEntries((prev) => prev.filter((e) => e.id !== id))
    return true
  }, [token, onUnauthorized])

  /**
   * Fehler manuell zurücksetzen.
   */
  const clearError = useCallback(() => {
    setError('')
  }, [])

  /**
   * Automatisches Laden beim Mount und bei Token-Änderung.
   * 
   * WARUM useEffect?
   * - Side Effect: API-Call ist ein Side Effect
   * - Automatisch: User muss nicht manuell laden
   * - Reaktiv: Bei Token-Änderung (Login/Logout) wird neu geladen
   */
  useEffect(() => {
    if (token) {
      fetchEntries()
    }
  }, [token, fetchEntries])

  return {
    entries,
    loading,
    error,
    fetchEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    clearError,
  }
}
