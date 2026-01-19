/**
 * @file lib/storage.ts
 * @description Abstraktionsschicht für LocalStorage-Zugriffe.
 * 
 * WARUM EINE STORAGE-ABSTRAKTION?
 * - Zentrale Schlüsselverwaltung: Alle Storage-Keys an einem Ort
 * - Typsicherheit: Keine magischen Strings im Code verstreut
 * - Einfaches Refactoring: Key-Änderungen nur hier nötig
 * - Testbarkeit: Storage kann für Tests gemockt werden
 * - Erweiterbarkeit: Einfacher Wechsel zu SessionStorage oder IndexedDB
 */

// ===================
// Local Storage Keys
// ===================

/**
 * Konstante Schlüssel für LocalStorage.
 * `as const` macht die Werte readonly und ermöglicht bessere Typisierung.
 */
const STORAGE_KEYS = {
  TOKEN: 'token',  // JWT-Token für Authentifizierung
} as const

// ===================
// Token Storage
// ===================

/**
 * Wrapper für Token-Operationen im LocalStorage.
 * 
 * WARUM EIN OBJEKT STATT EINZELNER FUNKTIONEN?
 * - Namespacing: Klare Zugehörigkeit der Funktionen
 * - Erweiterbarkeit: Einfach um weitere Storage-Operationen erweiterbar
 * - Autovervollständigung: IDE zeigt alle verfügbaren Methoden
 */
export const tokenStorage = {
  /**
   * Token aus LocalStorage lesen.
   * @returns Token oder null wenn nicht vorhanden
   */
  get: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.TOKEN)
  },

  /**
   * Token in LocalStorage speichern.
   * Wird nach erfolgreichem Login aufgerufen.
   */
  set: (token: string): void => {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token)
  },

  /**
   * Token aus LocalStorage entfernen.
   * Wird beim Logout aufgerufen.
   */
  remove: (): void => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
  },
}
