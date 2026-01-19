/**
 * @file components/ui/Button.tsx
 * @description Wiederverwendbare Button-Komponente mit Varianten.
 * 
 * DESIGN-ENTSCHEIDUNGEN:
 * - forwardRef: Ermöglicht ref-Zugriff von außen (z.B. für Focus-Management)
 * - Varianten: Verschiedene Styles für verschiedene Kontexte
 * - Loading-State: Eingebaute Lade-Anzeige mit automatischem Disable
 * - Tailwind: Utility-First CSS ohne zusätzliche Stylesheets
 */

import { forwardRef, type ButtonHTMLAttributes } from 'react'

/** Verfügbare Button-Varianten */
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

/**
 * Props für die Button-Komponente.
 * Erweitert native Button-Attribute für volle HTML-Kompatibilität.
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant  // Visueller Stil (default: primary)
  loading?: boolean        // Zeigt Lade-Zustand und deaktiviert Button
}

/**
 * Tailwind-Klassen für jede Variante.
 * Zentralisiert für einfache Anpassung und Konsistenz.
 */
const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100',
  danger: 'bg-red-500 text-white hover:bg-red-600 disabled:bg-red-300',
  ghost: 'text-blue-600 hover:underline',  // Für Links/Text-Buttons
}

/**
 * Button-Komponente mit Varianten und Loading-State.
 * 
 * @example
 * <Button variant="primary" loading={isSubmitting}>Speichern</Button>
 * <Button variant="ghost" onClick={onCancel}>Abbrechen</Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', loading, disabled, children, ...props }, ref) => {
    // Basis-Styles die für alle Varianten gelten
    const baseStyles = 'px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        // Button ist disabled wenn explizit disabled ODER wenn loading
        disabled={disabled || loading}
        {...props}
      >
        {/* Bei Loading "Laden..." anzeigen, sonst children */}
        {loading ? 'Laden...' : children}
      </button>
    )
  }
)

// Display Name für React DevTools
Button.displayName = 'Button'
