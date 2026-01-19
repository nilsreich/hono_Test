/**
 * @file components/entries/EntryForm.tsx
 * @description Formular zum Hinzufügen neuer Einträge.
 * 
 * DESIGN-ENTSCHEIDUNGEN:
 * - Minimalistisch: Nur ein Input und ein Button
 * - Controlled Input: React verwaltet den Eingabewert
 * - Callback Prop: onSubmit kommt von außen (lose Kopplung)
 * - Auto-Clear: Input wird nach erfolgreichem Submit geleert
 */

import { useState, type FormEvent } from 'react'
import { Input, Button } from '../ui'

/**
 * Props für EntryForm.
 * Minimal: Nur loading-State und Submit-Handler nötig.
 */
interface EntryFormProps {
  loading: boolean                              // Deaktiviert Input während Laden
  onSubmit: (text: string) => Promise<boolean>  // Handler für Submit, gibt Erfolg zurück
}

/**
 * Formular zum Erstellen neuer Einträge.
 * 
 * @example
 * <EntryForm loading={isSubmitting} onSubmit={handleAddEntry} />
 */
export function EntryForm({ loading, onSubmit }: EntryFormProps) {
  const [inputText, setInputText] = useState('')

  /**
   * Submit-Handler.
   * Leert das Input-Feld bei Erfolg.
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    // Leere Eingaben ignorieren (Frontend-Validierung)
    if (!inputText.trim()) return

    const success = await onSubmit(inputText)
    
    // Input nur bei Erfolg leeren
    // WARUM? Bei Fehler soll User nicht nochmal tippen müssen
    if (success) {
      setInputText('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <div className="flex gap-2">
        <Input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Neuer Eintrag..."
          disabled={loading}  // Während Submit deaktivieren
        />
        <Button type="submit" loading={loading}>
          Senden
        </Button>
      </div>
    </form>
  )
}
