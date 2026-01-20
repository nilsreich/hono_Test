/**
 * @file components/files/FileUpload.tsx
 * @description Komponente für Datei-Uploads mit Drag & Drop Support.
 * 
 * FEATURES:
 * - Drag & Drop Unterstützung
 * - Click-to-Select Fallback
 * - Optionale Beschreibung
 * - Dateityp- und Größenvalidierung
 * - Loading-State während Upload
 */

import { useState, useRef, useCallback } from 'react'
import { Button, Input } from '../ui'

// Erlaubte Dateitypen (muss mit Backend übereinstimmen)
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

interface FileUploadProps {
  loading?: boolean
  onUpload: (file: File, description?: string) => Promise<boolean>
}

export function FileUpload({ loading, onUpload }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [description, setDescription] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Validiert die ausgewählte Datei.
   */
  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Dateityp nicht erlaubt. Erlaubt: Bilder (JPG, PNG, GIF, WebP), PDF, TXT, CSV`
    }
    if (file.size > MAX_FILE_SIZE) {
      return `Datei zu groß. Maximal ${MAX_FILE_SIZE / 1024 / 1024} MB erlaubt.`
    }
    return null
  }, [])

  /**
   * Verarbeitet die Dateiauswahl (Click oder Drop).
   */
  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      setSelectedFile(null)
      return
    }
    setError(null)
    setSelectedFile(file)
  }, [validateFile])

  /**
   * Drag & Drop Handler
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  /**
   * Input Change Handler
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  /**
   * Formular-Submit Handler
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return

    const success = await onUpload(selectedFile, description.trim() || undefined)
    
    if (success) {
      // Reset Form
      setSelectedFile(null)
      setDescription('')
      setError(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [selectedFile, description, onUpload])

  /**
   * Formatiert Dateigröße für Anzeige.
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${selectedFile ? 'bg-green-50 border-green-500' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleInputChange}
          accept={ALLOWED_TYPES.join(',')}
          className="hidden"
        />
        
        {selectedFile ? (
          <div className="space-y-1">
            <p className="text-green-700 font-medium">{selectedFile.name}</p>
            <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-gray-600">Datei hierher ziehen oder klicken zum Auswählen</p>
            <p className="text-xs text-gray-400">
              Erlaubt: Bilder, PDF, TXT, CSV (max. 5 MB)
            </p>
          </div>
        )}
      </div>

      {/* Fehleranzeige */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Beschreibung (optional) */}
      {selectedFile && (
        <Input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Beschreibung (optional)"
          maxLength={500}
        />
      )}

      {/* Upload Button */}
      <Button
        type="submit"
        disabled={!selectedFile || loading}
        className="w-full"
      >
        {loading ? 'Wird hochgeladen...' : 'Datei hochladen'}
      </Button>
    </form>
  )
}
