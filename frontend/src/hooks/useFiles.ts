/**
 * @file hooks/useFiles.ts
 * @description Custom Hook für Datei-Verwaltung mit TanStack Query v5.
 * 
 * FEATURES:
 * - Automatisches Caching & Background-Updates
 * - Optimistic Updates für sofortiges UI-Feedback
 * - Offline-First: Mutationen werden bei fehlender Verbindung pausiert
 * - Auto-Sync: Pausierte Mutationen werden automatisch synchronisiert
 * 
 * HINWEIS: File-Uploads sind nicht offline-fähig (Binärdaten),
 * aber Löschen und Metadaten-Operationen funktionieren offline.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { filesApi } from '../lib/api'
import { queryKeys } from '../lib/queryClient'
import type { FileMetadata } from '../types'

/**
 * Hook für Datei-Verwaltung mit TanStack Query.
 * 
 * @param token - JWT-Token für API-Authentifizierung (null wenn nicht eingeloggt)
 * @param onUnauthorized - Callback bei 401-Fehler (z.B. logout)
 */
export function useFiles(token: string | null, onUnauthorized?: () => void) {
  const queryClient = useQueryClient()

  // ===================
  // Query: Dateien laden
  // ===================
  const {
    data: files = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.files.list(),
    queryFn: async () => {
      if (!token) return []
      
      const { data, error, status } = await filesApi.getAll(token)
      
      if (status === 401 && onUnauthorized) {
        onUnauthorized()
        throw new Error('Unauthorized')
      }
      
      if (error) throw new Error(error)
      return data || []
    },
    enabled: !!token,
  })

  // ===================
  // Mutation: Datei hochladen
  // ===================
  const uploadMutation = useMutation({
    mutationFn: async ({ file, description }: { file: File; description?: string }) => {
      if (!token) throw new Error('Nicht authentifiziert')
      
      const { data, error, status } = await filesApi.upload(token, file, description)
      
      if (status === 401 && onUnauthorized) {
        onUnauthorized()
        throw new Error('Unauthorized')
      }
      
      if (error) throw new Error(error)
      return data
    },
    // Nach Upload: Cache invalidieren
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.list() })
    },
  })

  // ===================
  // Mutation: Datei löschen (Optimistic Update)
  // ===================
  const deleteMutation = useMutation({
    mutationFn: async (fileId: number) => {
      if (!token) throw new Error('Nicht authentifiziert')
      
      const { error, status } = await filesApi.delete(token, fileId)
      
      if (status === 401 && onUnauthorized) {
        onUnauthorized()
        throw new Error('Unauthorized')
      }
      
      if (error) throw new Error(error)
      return fileId
    },
    // Optimistic Update: Sofort aus Liste entfernen
    onMutate: async (fileId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.files.list() })
      
      const previousFiles = queryClient.getQueryData<FileMetadata[]>(queryKeys.files.list())
      
      // Optimistisch löschen
      queryClient.setQueryData<FileMetadata[]>(queryKeys.files.list(), (old) =>
        old?.filter((file) => file.id !== fileId) || []
      )
      
      return { previousFiles }
    },
    onError: (_err, _fileId, context) => {
      if (context?.previousFiles) {
        queryClient.setQueryData(queryKeys.files.list(), context.previousFiles)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.list() })
    },
  })

  // ===================
  // Download (kein Mutation, da kein State-Change)
  // ===================
  const downloadFile = useCallback(async (fileId: number): Promise<void> => {
    if (!token) return

    const { data, error, status } = await filesApi.download(token, fileId)

    if (status === 401 && onUnauthorized) {
      onUnauthorized()
      return
    }

    if (error) {
      console.error('Download error:', error)
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
  }, [token, onUnauthorized])

  // ===================
  // Wrapper-Funktionen
  // ===================
  const uploadFile = useCallback(async (file: File, description?: string): Promise<boolean> => {
    try {
      await uploadMutation.mutateAsync({ file, description })
      return true
    } catch {
      return false
    }
  }, [uploadMutation])

  const deleteFile = useCallback(async (fileId: number): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync(fileId)
      return true
    } catch {
      return false
    }
  }, [deleteMutation])

  const refreshFiles = useCallback(async () => {
    await refetch()
  }, [refetch])

  // Kombinierter Error-State
  const error = queryError?.message 
    || uploadMutation.error?.message 
    || deleteMutation.error?.message 
    || null

  return {
    files,
    loading,
    error,
    uploadFile,
    downloadFile,
    deleteFile,
    refreshFiles,
  }
}
