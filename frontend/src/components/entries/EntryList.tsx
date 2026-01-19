/**
 * @file components/entries/EntryList.tsx
 * @description Anzeige einer Liste von Einträgen.
 * 
 * DESIGN-ENTSCHEIDUNGEN:
 * - Reine Darstellung: Keine Logik, nur Anzeige
 * - Empty State: Freundliche Nachricht wenn keine Einträge
 * - Typisiert: Entry-Type aus zentraler Types-Datei
 */

import type { Entry } from '../../types'

/**
 * Props für EntryList.
 */
interface EntryListProps {
  entries: Entry[]  // Array der anzuzeigenden Einträge
}

/**
 * Liste von Einträgen mit Empty-State.
 * 
 * PATTERN: Presentational Component
 * - Keine State-Verwaltung
 * - Keine Side Effects
 * - Nur Darstellung basierend auf Props
 * 
 * @example
 * <EntryList entries={myEntries} />
 */
export function EntryList({ entries }: EntryListProps) {
  // Empty State: Freundliche Nachricht wenn keine Einträge
  if (entries.length === 0) {
    return (
      <p className="text-gray-500 italic">Noch keine Einträge vorhanden.</p>
    )
  }

  // Liste der Einträge
  return (
    <ul className="divide-y text-gray-700">
      {entries.map((entry) => (
        // Key ist wichtig für React's Reconciliation
        <li key={entry.id} className="py-2">
          {entry.text}
        </li>
      ))}
    </ul>
  )
}
