/**
 * @file components/ui/Card.tsx
 * @description Wiederverwendbare Card-Komponenten für Container-Layouts.
 * 
 * DESIGN-ENTSCHEIDUNGEN:
 * - Composition: Card und CardHeader als separate Komponenten
 * - Flexibilität: className-Prop ermöglicht individuelle Anpassungen
 * - Konsistenz: Einheitliches Styling für alle Card-Verwendungen
 */

import type { ReactNode } from 'react'

/**
 * Props für die Card-Komponente.
 */
interface CardProps {
  children: ReactNode   // Inhalt der Card
  className?: string    // Zusätzliche CSS-Klassen
}

/**
 * Container-Komponente mit weißem Hintergrund und Schatten.
 * Verwendet als Wrapper für zusammenhängende Inhalte.
 * 
 * @example
 * <Card className="max-w-md">
 *   <CardHeader title="Titel" />
 *   <p>Inhalt</p>
 * </Card>
 */
export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {children}
    </div>
  )
}

/**
 * Props für die CardHeader-Komponente.
 */
interface CardHeaderProps {
  title: string        // Titel-Text
  action?: ReactNode   // Optionale Aktion (z.B. Button) rechts
}

/**
 * Header-Komponente für Cards mit Titel und optionaler Aktion.
 * 
 * @example
 * <CardHeader 
 *   title="Meine Einträge" 
 *   action={<Button variant="ghost">Logout</Button>} 
 * />
 */
export function CardHeader({ title, action }: CardHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
      {action}
    </div>
  )
}
