/**
 * @file components/ui/Alert.tsx
 * @description Wiederverwendbare Alert-Komponente für Benachrichtigungen.
 * 
 * DESIGN-ENTSCHEIDUNGEN:
 * - Varianten: error, success, info für verschiedene Kontexte
 * - Null-Return: Keine Anzeige bei leerer message
 * - Kompakt: Einfache Komponente ohne komplexe Logik
 */

/**
 * Props für die Alert-Komponente.
 */
interface AlertProps {
  message: string                          // Anzuzeigender Text
  variant?: 'error' | 'success' | 'info'   // Visueller Stil (default: error)
  className?: string                       // Zusätzliche CSS-Klassen
}

/**
 * Tailwind-Klassen für jede Variante.
 * Farben entsprechen den üblichen Konventionen:
 * - error: Rot für Fehler und Warnungen
 * - success: Grün für Erfolg
 * - info: Blau für Informationen
 */
const variantStyles = {
  error: 'text-red-500 bg-red-50',
  success: 'text-green-600 bg-green-50',
  info: 'text-blue-600 bg-blue-50',
}

/**
 * Alert-Komponente für Fehlermeldungen und Benachrichtigungen.
 * 
 * @example
 * <Alert message="Speichern fehlgeschlagen" variant="error" />
 * <Alert message="Erfolgreich gespeichert!" variant="success" />
 */
export function Alert({ message, variant = 'error', className = '' }: AlertProps) {
  // Keine Anzeige bei leerer Nachricht
  // WARUM? Vermeidet leere Boxen im UI
  if (!message) return null

  return (
    <p className={`mb-4 text-sm text-center font-medium p-2 rounded ${variantStyles[variant]} ${className}`}>
      {message}
    </p>
  )
}
