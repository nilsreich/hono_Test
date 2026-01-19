/**
 * @file App.tsx
 * @description Haupt-Komponente der Anwendung.
 * 
 * ARCHITEKTUR-ENTSCHEIDUNGEN:
 * - Hooks für State: useAuth und useEntries kapseln alle Business-Logik
 * - Komponenten für UI: Alle UI-Elemente sind wiederverwendbare Komponenten
 * - Conditional Rendering: Auth-Status bestimmt welche View angezeigt wird
 * 
 * WARUM SO WENIG CODE?
 * - Logik in Hooks ausgelagert (useAuth, useEntries)
 * - UI in Komponenten ausgelagert (AuthForm, EntryForm, etc.)
 * - App.tsx ist nur noch "Orchestrierung" - verbindet Hooks mit Komponenten
 */

import { useAuth, useEntries } from './hooks'
import {
  PageLayout,
  Card,
  CardHeader,
  Button,
  Alert,
  AuthForm,
  EntryForm,
  EntryList,
} from './components'

function App() {
  // Auth-Hook: Verwaltet Login-Status, Token und Auth-Operationen
  const { token, isAuthenticated, loading: authLoading, error: authError, login, signup, logout } = useAuth()

  // Entries-Hook: Verwaltet Einträge mit automatischem Logout bei 401
  // WICHTIG: logout wird als onUnauthorized übergeben → automatischer Logout bei Token-Ablauf
  const {
    entries,
    loading: entriesLoading,
    error: entriesError,
    addEntry,
  } = useEntries(token, logout)

  // ===================
  // Nicht eingeloggt: Auth-Formular anzeigen
  // ===================
  if (!isAuthenticated) {
    return (
      <PageLayout centered>
        <AuthForm
          loading={authLoading}
          error={authError}
          onLogin={login}
          onSignup={signup}
        />
      </PageLayout>
    )
  }

  // ===================
  // Eingeloggt: Dashboard mit Einträgen anzeigen
  // ===================
  return (
    <PageLayout>
      <Card className="max-w-md mx-auto">
        {/* Header mit Titel und Logout-Button */}
        <CardHeader
          title="Meine Einträge"
          action={
            <Button variant="ghost" onClick={logout} className="text-sm text-red-500">
              Logout
            </Button>
          }
        />

        {/* Formular für neue Einträge */}
        <EntryForm loading={entriesLoading} onSubmit={addEntry} />

        {/* Fehlermeldung falls vorhanden */}
        {entriesError && <Alert message={entriesError} variant="error" />}

        {/* Liste der Einträge */}
        <div className="space-y-3">
          <EntryList entries={entries} />
        </div>
      </Card>
    </PageLayout>
  )
}

export default App
