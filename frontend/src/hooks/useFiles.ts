/**
 * @file hooks/useFiles.ts
 * @description Custom Hook für Datei-Verwaltung.
 * 
 * FEATURES:
 * - Automatisches Laden der Dateien bei Token-Änderung
 * - Upload mit Fortschritts-Feedback
 * - Download mit automatischem Browser-Download
 * - Löschen mit automatischer UI-Aktualisierung
 * - Automatischer Logout bei 401 (Token abgelaufen)
 * 
 * PATTERN: State + Actions in einem Hook
 * - Alle file-bezogenen States an einem Ort
 * - Alle file-bezogenen Aktionen exportiert
 * - Komponenten brauchen nur diesen einen Hook
 */

import { useState, useEffect, useCallback } from 'react'
import { filesApi } from '../lib/api'
import type { FileMetadata } from '../types'

/**
 * Hook für Datei-Verwaltung.
 * 
 * @param token - JWT-Token für API-Authentifizierung (null wenn nicht eingeloggt)
 * @param onUnauthorized - Callback bei 401-Fehler (z.B. logout)
 * 
 * USAGE:
 * ```tsx
 * const { files, loading, error, uploadFile, downloadFile, deleteFile } = useFiles(token, logout)
 * ```
 */
export function useFiles(token: string | null, onUnauthorized?: () => void) {
  // ===================
  // State
  // ===================
  const [files, setFiles] = useState<FileMetadata[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ===================
  // Fetch Files
  // ===================
  /**
   * Lädt alle Dateien des aktuellen Users.
   * Wird automatisch bei Token-Änderung aufgerufen.
   */
  const fetchFiles = useCallback(async () => {
    if (!token) {
      setFiles([])
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: apiError, status } = await filesApi.getAll(token)

    setLoading(false)

    // Bei 401: Automatischer Logout (Token abgelaufen)
    if (status === 401 && onUnauthorized) {
      onUnauthorized()
      return
    }

    if (apiError) {
      setError(apiError)
    } else if (data) {
      setFiles(data)
    }
  }, [token, onUnauthorized])

  // Automatisches Laden bei Token-Änderung
  useEffect(() => {
    // Prevent unnecessary calls and use an async IIFE pattern
    // to avoid the React 19 cascading render warning
    let isMounted = true
    
    const loadFiles = async () => {
      if (!token) {
        setFiles([])
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: apiError, status } = await filesApi.getAll(token)

      // Only update state if component is still mounted
      if (!isMounted) return

      setLoading(false)

      if (status === 401 && onUnauthorized) {
        onUnauthorized()
        return
      }

      if (apiError) {
        setError(apiError)
      } else if (data) {
        setFiles(data)
      }
    }

    loadFiles()

    return () => {
      isMounted = false
    }
  }, [token, onUnauthorized])

  // ===================
  // Upload File
  // ===================
  /**
   * Lädt eine neue Datei hoch.
   * 
   * @param file - Die hochzuladende Datei
   * @param description - Optionale Beschreibung
   * @returns true bei Erfolg, false bei Fehler
   */
  const uploadFile = useCallback(
    async (file: File, description?: string): Promise<boolean> => {
      if (!token) return false

      setLoading(true)
      setError(null)

      const { error: apiError, status } = await filesApi.upload(token, file, description)

      // Bei 401: Automatischer Logout
      if (status === 401 && onUnauthorized) {
        onUnauthorized()
        return false
      }

      if (apiError) {
        setError(apiError)
        setLoading(false)
        return false
      }

      // Bei Erfolg: Dateien neu laden
      await fetchFiles()
      setLoading(false)
      return true
    },
    [token, onUnauthorized, fetchFiles]
  )

  // ===================
  // Download File
  // ===================
  /**
   * Lädt eine Datei herunter und triggert Browser-Download.
   * 
   * @param fileId - ID der Datei
   */
  const downloadFile = useCallback(
    async (fileId: number): Promise<void> => {
      if (!token) return

      setError(null)

      const { data, error: apiError, status } = await filesApi.download(token, fileId)

      // Bei 401: Automatischer Logout
      if (status === 401 && onUnauthorized) {
        onUnauthorized()
        return
      }

      if (apiError) {
        setError(apiError)
        return
      }

      if (data) {
        // Browser-Download triggern
        const url = URL.createObjectURL(data.blob)
        const a = document.createElement('a')
        a.href = url
        a.download = data.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    },
    [token, onUnauthorized]
  )

  // ===================
  // Delete File
  // ===================
  /**
   * Löscht eine Datei.
   * 
   * @param fileId - ID der zu löschenden Datei
   * @returns true bei Erfolg, false bei Fehler
   */
  const deleteFile = useCallback(
    async (fileId: number): Promise<boolean> => {
      if (!token) return false

      setLoading(true)
      setError(null)

      const { error: apiError, status } = await filesApi.delete(token, fileId)

      // Bei 401: Automatischer Logout
      if (status === 401 && onUnauthorized) {
        onUnauthorized()
        return false
      }

      if (apiError) {
        setError(apiError)
        setLoading(false)
        return false
      }

      // Bei Erfolg: Lokal aus State entfernen (schneller als neu laden)
      setFiles((prev) => prev.filter((f) => f.id !== fileId))
      setLoading(false)
      return true
    },
    [token, onUnauthorized]
  )

  // ===================
  // Return
  // ===================
  return {
    files,
    loading,
    error,
    uploadFile,
    downloadFile,
    deleteFile,
    refreshFiles: fetchFiles,
  }
}
