/**
 * @file components/ui/Input.tsx
 * @description Wiederverwendbare Input-Komponente mit Fehleranzeige.
 * 
 * DESIGN-ENTSCHEIDUNGEN:
 * - forwardRef: Ermöglicht ref-Zugriff für Formulare und Focus-Management
 * - Error-State: Integrierte Fehleranzeige mit rotem Styling
 * - Native Attribute: Alle HTML-Input-Attribute werden durchgereicht
 * - Wrapper-Div: Ermöglicht Fehlertext unter dem Input
 */

import { forwardRef, type InputHTMLAttributes } from 'react'

/**
 * Props für die Input-Komponente.
 * Erweitert native Input-Attribute um error-Property.
 */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string  // Fehlermeldung wird unter dem Input angezeigt
}

/**
 * Input-Komponente mit optionaler Fehleranzeige.
 * 
 * @example
 * <Input type="email" placeholder="E-Mail" error={errors.email} />
 * <Input type="password" required />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => {
    // Basis-Styles für alle Inputs
    const baseStyles = 'w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors'
    
    // Fehler-Styling: Roter Border und Ring bei Fehler
    const errorStyles = error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'

    return (
      <div className="w-full">
        <input
          ref={ref}
          className={`${baseStyles} ${errorStyles} ${className}`}
          {...props}  // Alle nativen Attribute durchreichen (type, placeholder, etc.)
        />
        {/* Fehlermeldung nur anzeigen wenn error gesetzt */}
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    )
  }
)

// Display Name für React DevTools
Input.displayName = 'Input'
