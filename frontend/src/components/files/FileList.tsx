/**
 * @file components/files/FileList.tsx
 * @description Komponente zur Anzeige einer Liste von hochgeladenen Dateien.
 * 
 * FEATURES:
 * - Anzeige von Dateiname, Größe und Upload-Datum
 * - Download-Button pro Datei
 * - Löschen-Button mit Bestätigung
 * - Responsive Design
 */

import { useCallback, useState } from 'react'
import { Button } from '../ui'
import type { FileMetadata } from '../../types'

interface FileListProps {
  files: FileMetadata[]
  onDownload: (fileId: number) => void
  onDelete: (fileId: number) => Promise<boolean>
}

/**
 * Formatiert Dateigröße für Anzeige.
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Formatiert Datum für Anzeige.
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Gibt ein Icon basierend auf dem MIME-Type zurück.
 */
function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType === 'text/csv') return '📊'
  if (mimeType === 'text/plain') return '📝'
  return '📎'
}

export function FileList({ files, onDownload, onDelete }: FileListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null)

  /**
   * Löschen mit Bestätigung.
   */
  const handleDelete = useCallback(async (file: FileMetadata) => {
    if (!confirm(`Datei "${file.originalName}" wirklich löschen?`)) return
    
    setDeletingId(file.id)
    await onDelete(file.id)
    setDeletingId(null)
  }, [onDelete])

  if (files.length === 0) {
    return (
      <p className="text-center text-gray-500 py-4">
        Noch keine Dateien hochgeladen.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-gray-200">
      {files.map((file) => (
        <li key={file.id} className="py-3">
          <div className="flex items-start justify-between gap-3">
            {/* Datei-Info */}
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <span className="text-2xl" title={file.mimeType}>
                {getFileIcon(file.mimeType)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 truncate" title={file.originalName}>
                  {file.originalName}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-500">
                  <span>{formatFileSize(file.size)}</span>
                  <span>{formatDate(file.createdAt)}</span>
                </div>
                {file.description && (
                  <p className="text-sm text-gray-600 mt-1">{file.description}</p>
                )}
              </div>
            </div>

            {/* Aktionen */}
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                onClick={() => onDownload(file.id)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ⬇️
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleDelete(file)}
                disabled={deletingId === file.id}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                {deletingId === file.id ? '...' : '🗑️'}
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
