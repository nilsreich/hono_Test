/**
 * @file components/entries/EntryList.tsx
 * @description Anzeige einer Liste von Einträgen mit Edit/Delete.
 * 
 * DESIGN-ENTSCHEIDUNGEN:
 * - Inline-Editing: Direkt in der Liste bearbeitbar
 * - Optimistic Updates: Sofortige UI-Reaktion
 * - Typisiert: Entry-Type aus zentraler Types-Datei
 */

import { useState } from 'react'
import type { Entry } from '../../types'
import { Button, Input } from '../ui'

/**
 * Props für EntryList.
 */
interface EntryListProps {
  entries: Entry[]  // Array der anzuzeigenden Einträge
  onUpdate?: (id: number, text: string) => Promise<boolean>  // Update-Handler
  onDelete?: (id: number) => Promise<boolean>  // Delete-Handler
}

/**
 * Liste von Einträgen mit Edit/Delete-Funktionalität.
 * 
 * @example
 * <EntryList entries={myEntries} onUpdate={updateEntry} onDelete={deleteEntry} />
 */
export function EntryList({ entries, onUpdate, onDelete }: EntryListProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleEdit = (entry: Entry) => {
    setEditingId(entry.id)
    setEditText(entry.text)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editText.trim() || !onUpdate) return

    const success = await onUpdate(editingId, editText.trim())
    if (success) {
      setEditingId(null)
      setEditText('')
    }
  }

  const handleDelete = async (id: number) => {
    if (!onDelete) return

    setDeletingId(id)
    await onDelete(id)
    setDeletingId(null)
  }

  // Empty State: Freundliche Nachricht wenn keine Einträge
  if (entries.length === 0) {
    return (
      <p className="text-gray-500 italic">Noch keine Einträge vorhanden.</p>
    )
  }

  // Liste der Einträge
  return (
    <ul className="divide-y divide-gray-200">
      {entries.map((entry) => (
        <li key={entry.id} className="py-3">
          {editingId === entry.id ? (
            // Edit Mode
            <div className="space-y-2">
              <Input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit()
                  if (e.key === 'Escape') handleCancelEdit()
                }}
              />
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={handleSaveEdit}
                  className="text-sm py-1 px-3"
                >
                  Speichern
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleCancelEdit}
                  className="text-sm py-1 px-3"
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          ) : (
            // View Mode
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-700 flex-1">{entry.text}</span>
              {(onUpdate || onDelete) && (
                <div className="flex gap-1 shrink-0">
                  {onUpdate && (
                    <button
                      onClick={() => handleEdit(entry)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Bearbeiten"
                    >
                      ✏️
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => handleDelete(entry.id)}
                      disabled={deletingId === entry.id}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Löschen"
                    >
                      {deletingId === entry.id ? '⏳' : '🗑️'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
