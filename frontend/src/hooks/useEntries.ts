/**
 * @file hooks/useEntries.ts
 * @description Custom Hook für Einträge-Verwaltung mit TanStack Query v5.
 * 
 * FEATURES:
 * - Automatisches Caching & Background-Updates
 * - Optimistic Updates für sofortiges UI-Feedback
 * - Offline-First: Mutationen werden bei fehlender Verbindung pausiert
 * - Auto-Sync: Pausierte Mutationen werden automatisch synchronisiert
 * 
 * PATTERN: TanStack Query + Optimistic Updates
 * - useQuery: Für Daten-Fetching mit Caching
 * - useMutation: Für Schreiboperationen mit Optimistic Updates
 * - queryClient.setQueryData: Für direktes Cache-Update
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { entriesApi } from '../lib/api'
import { queryKeys } from '../lib/queryClient'
import type { Entry } from '../types'

/**
 * Return-Type des useEntries Hooks.
 */
interface UseEntriesReturn {
  entries: Entry[]
  loading: boolean
  error: string
  isPending: boolean
  fetchEntries: () => Promise<void>
  addEntry: (text: string) => Promise<boolean>
  updateEntry: (id: number, text: string) => Promise<boolean>
  deleteEntry: (id: number) => Promise<boolean>
  clearError: () => void
}

/**
 * Hook für Einträge-Verwaltung mit TanStack Query.
 * 
 * @param token - JWT-Token für API-Authentifizierung
 * @param onUnauthorized - Callback bei 401-Fehler (z.B. Logout auslösen)
 */
export function useEntries(token: string, onUnauthorized?: () => void): UseEntriesReturn {
  const queryClient = useQueryClient()

  // ===================
  // Query: Einträge laden
  // ===================
  const {
    data: entries = [],
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.entries.list(),
    queryFn: async () => {
      if (!token) return []
      
      const { data, error, status } = await entriesApi.getAll(token)
      
      if (status === 401) {
        onUnauthorized?.()
        throw new Error('Unauthorized')
      }
      
      if (error) throw new Error(error)
      return data || []
    },
    enabled: !!token,
  })

  // ===================
  // Mutation: Eintrag hinzufügen (Optimistic Update)
  // ===================
  const addMutation = useMutation({
    mutationFn: async (text: string) => {
      const { data, error } = await entriesApi.create(token, text)
      if (error) throw new Error(error)
      return { text, data }
    },
    // Optimistic Update: UI sofort aktualisieren
    onMutate: async (text) => {
      // Laufende Queries abbrechen
      await queryClient.cancelQueries({ queryKey: queryKeys.entries.list() })
      
      // Vorherigen Zustand speichern (für Rollback)
      const previousEntries = queryClient.getQueryData<Entry[]>(queryKeys.entries.list())
      
      // Optimistisch neuen Eintrag hinzufügen
      const optimisticEntry: Entry = {
        id: -Date.now(), // Temporäre negative ID
        text,
      }
      
      queryClient.setQueryData<Entry[]>(queryKeys.entries.list(), (old) => [
        optimisticEntry,
        ...(old || []),
      ])
      
      return { previousEntries }
    },
    // Bei Fehler: Rollback zum vorherigen Zustand
    onError: (_err, _text, context) => {
      if (context?.previousEntries) {
        queryClient.setQueryData(queryKeys.entries.list(), context.previousEntries)
      }
    },
    // Nach Erfolg oder Fehler: Cache invalidieren für frische Daten
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.entries.list() })
    },
  })

  // ===================
  // Mutation: Eintrag aktualisieren (Optimistic Update)
  // ===================
  const updateMutation = useMutation({
    mutationFn: async ({ id, text }: { id: number; text: string }) => {
      const { error, status } = await entriesApi.update(token, id, text)
      
      if (status === 401) {
        onUnauthorized?.()
        throw new Error('Unauthorized')
      }
      
      if (error) throw new Error(error)
      return { id, text }
    },
    // Optimistic Update
    onMutate: async ({ id, text }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.entries.list() })
      
      const previousEntries = queryClient.getQueryData<Entry[]>(queryKeys.entries.list())
      
      // Optimistisch aktualisieren
      queryClient.setQueryData<Entry[]>(queryKeys.entries.list(), (old) =>
        old?.map((entry) => (entry.id === id ? { ...entry, text } : entry)) || []
      )
      
      return { previousEntries }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousEntries) {
        queryClient.setQueryData(queryKeys.entries.list(), context.previousEntries)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.entries.list() })
    },
  })

  // ===================
  // Mutation: Eintrag löschen (Optimistic Update)
  // ===================
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error, status } = await entriesApi.delete(token, id)
      
      if (status === 401) {
        onUnauthorized?.()
        throw new Error('Unauthorized')
      }
      
      if (error) throw new Error(error)
      return id
    },
    // Optimistic Update: Sofort aus Liste entfernen
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.entries.list() })
      
      const previousEntries = queryClient.getQueryData<Entry[]>(queryKeys.entries.list())
      
      // Optimistisch löschen
      queryClient.setQueryData<Entry[]>(queryKeys.entries.list(), (old) =>
        old?.filter((entry) => entry.id !== id) || []
      )
      
      return { previousEntries }
    },
    onError: (_err, _id, context) => {
      if (context?.previousEntries) {
        queryClient.setQueryData(queryKeys.entries.list(), context.previousEntries)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.entries.list() })
    },
  })

  // ===================
  // Wrapper-Funktionen
  // ===================
  const fetchEntries = useCallback(async () => {
    await refetch()
  }, [refetch])

  const addEntry = useCallback(async (text: string): Promise<boolean> => {
    if (!text.trim()) return false
    try {
      await addMutation.mutateAsync(text)
      return true
    } catch {
      return false
    }
  }, [addMutation])

  const updateEntry = useCallback(async (id: number, text: string): Promise<boolean> => {
    if (!text.trim()) return false
    try {
      await updateMutation.mutateAsync({ id, text })
      return true
    } catch {
      return false
    }
  }, [updateMutation])

  const deleteEntry = useCallback(async (id: number): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync(id)
      return true
    } catch {
      return false
    }
  }, [deleteMutation])

  const clearError = useCallback(() => {
    // Errors werden automatisch von TanStack Query verwaltet
  }, [])

  // Kombinierter Error-State
  const error = queryError?.message 
    || addMutation.error?.message 
    || updateMutation.error?.message 
    || deleteMutation.error?.message 
    || ''

  // Kombinierter Pending-State
  const isPending = addMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  return {
    entries,
    loading: isLoading,
    error,
    isPending,
    fetchEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    clearError,
  }
}
