/**
 * @file components/layout/PageLayout.tsx
 * @description Basis-Layout-Komponente für alle Seiten.
 * 
 * DESIGN-ENTSCHEIDUNGEN:
 * - Einheitliches Styling: Hintergrundfarbe, Padding für alle Seiten
 * - Flexible Zentrierung: centered-Prop für Login/Signup-Seiten
 * - Minimal: Keine komplexe Navigation, nur Basis-Container
 */

import type { ReactNode } from 'react'

/**
 * Props für PageLayout.
 */
interface PageLayoutProps {
  children: ReactNode   // Seiteninhalt
  centered?: boolean    // Zentriert Inhalt vertikal und horizontal
}

/**
 * Basis-Layout für alle Seiten der Anwendung.
 * 
 * VERWENDUNG:
 * - centered=true: Für Auth-Formulare (Login/Signup)
 * - centered=false: Für Dashboard/Content-Seiten
 * 
 * @example
 * // Auth-Seite (zentriert)
 * <PageLayout centered><AuthForm /></PageLayout>
 * 
 * // Dashboard (normal)
 * <PageLayout><Card>...</Card></PageLayout>
 */
export function PageLayout({ children, centered = false }: PageLayoutProps) {
  // Basis-Styles für alle Layouts
  const baseStyles = 'min-h-screen bg-gray-100 p-4'
  
  // Conditional: Flexbox-Zentrierung oder normales Padding
  const centeredStyles = centered ? 'flex items-center justify-center' : 'py-8'

  return (
    <div className={`${baseStyles} ${centeredStyles}`}>
      {children}
    </div>
  )
}
