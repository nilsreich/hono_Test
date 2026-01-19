/**
 * @file components/ui/index.ts
 * @description Barrel-Export für UI-Komponenten.
 * 
 * PATTERN: Barrel Exports
 * - Ermöglicht: import { Button, Input, Card } from './ui'
 * - Statt: import { Button } from './ui/Button'
 * - Vorteil: Sauberere Imports und einfacheres Refactoring
 */

export { Input } from './Input'
export { Button } from './Button'
export { Card, CardHeader } from './Card'
export { Alert } from './Alert'
