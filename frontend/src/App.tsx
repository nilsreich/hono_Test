/**
 * @file App.tsx
 * @description Haupt-Komponente der Anwendung.
 * 
 * ARCHITEKTUR-ENTSCHEIDUNGEN:
 * - Hooks für State: useAuth, useEntries und useFiles kapseln alle Business-Logik
 * - Komponenten für UI: Alle UI-Elemente sind wiederverwendbare Komponenten
 * - Conditional Rendering: Auth-Status bestimmt welche View angezeigt wird
 * - URL-basiertes Routing: Passwort-Reset über URL-Parameter
 * 
 * WARUM SO WENIG CODE?
 * - Logik in Hooks ausgelagert (useAuth, useEntries, useFiles)
 * - UI in Komponenten ausgelagert (AuthForm, EntryForm, FileUpload, etc.)
 * - App.tsx ist nur noch "Orchestrierung" - verbindet Hooks mit Komponenten
 */

import { useState, useEffect } from 'react'
import { useAuth, useEntries, useFiles } from './hooks'
import {
  PageLayout,
  Card,
  CardHeader,
  Button,
  Alert,
  AuthForm,
  ForgotPasswordForm,
  ResetPasswordForm,
  EntryForm,
  EntryList,
  FileUpload,
  FileList,
  Chat,
  OfflineBanner,
} from './components'

/** Tabs für die Dashboard-Navigation */
type TabType = 'entries' | 'files' | 'chat'

/** Auth-Views */
type AuthView = 'login' | 'forgot-password' | 'reset-password'

function App() {
  // Auth-Hook: Verwaltet Login-Status, Token und Auth-Operationen
  const {
    token,
    username,
    isAuthenticated,
    loading: authLoading,
    error: authError,
    login,
    signup,
    logout,
    forgotPassword,
    resetPassword,
    validateResetToken,
  } = useAuth()

  // Entries-Hook: Verwaltet Einträge mit automatischem Logout bei 401
  const {
    entries,
    loading: entriesLoading,
    error: entriesError,
    addEntry,
    updateEntry,
    deleteEntry,
  } = useEntries(token, logout)

  // Files-Hook: Verwaltet Datei-Uploads mit automatischem Logout bei 401
  const {
    files,
    loading: filesLoading,
    error: filesError,
    uploadFile,
    downloadFile,
    deleteFile,
  } = useFiles(token, logout)

  // Tab-State für Dashboard-Navigation
  const [activeTab, setActiveTab] = useState<TabType>('entries')

  // Auth-View State & Token-Initialization in einem Schritt (Initialisierer-Funktion)
  const [authView, setAuthView] = useState<AuthView>(() => {
    const params = new URLSearchParams(window.location.search)
    return (params.get('token') && window.location.pathname === '/reset-password') 
      ? 'reset-password' 
      : 'login'
  })

  const [resetToken, setResetToken] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('token')
  })

  // URL bereinigen beim Start
  useEffect(() => {
    if (resetToken && authView === 'reset-password') {
      window.history.replaceState({}, '', '/')
    }
  }, [resetToken, authView])

  // ===================
  // Passwort vergessen View
  // ===================
  if (!isAuthenticated && authView === 'forgot-password') {
    return (
      <PageLayout centered>
        <OfflineBanner />
        <ForgotPasswordForm
          onSubmit={forgotPassword}
          onBack={() => setAuthView('login')}
        />
      </PageLayout>
    )
  }

  // ===================
  // Passwort zurücksetzen View
  // ===================
  if (!isAuthenticated && authView === 'reset-password' && resetToken) {
    return (
      <PageLayout centered>
        <OfflineBanner />
        <ResetPasswordForm
          token={resetToken}
          onValidate={validateResetToken}
          onSubmit={resetPassword}
          onBack={() => {
            setAuthView('login')
            setResetToken(null)
          }}
        />
      </PageLayout>
    )
  }

  // ===================
  // Nicht eingeloggt: Auth-Formular anzeigen
  // ===================
  if (!isAuthenticated) {
    return (
      <PageLayout centered>
        <OfflineBanner />
        <AuthForm
          loading={authLoading}
          error={authError}
          onLogin={login}
          onSignup={signup}
          onForgotPassword={() => setAuthView('forgot-password')}
        />
      </PageLayout>
    )
  }

  // ===================
  // Eingeloggt: Dashboard mit Tabs anzeigen
  // ===================
  return (
    <PageLayout>
      <OfflineBanner />
      <Card className="max-w-md mx-auto">
        {/* Header mit Titel und Logout-Button */}
        <CardHeader
          title="Dashboard"
          action={
            <Button variant="ghost" onClick={logout} className="text-sm text-red-500">
              Logout
            </Button>
          }
        />

        {/* Tab-Navigation */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => setActiveTab('entries')}
            className={`flex-1 py-2 text-center font-medium transition-colors ${
              activeTab === 'entries'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📝 Einträge
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`flex-1 py-2 text-center font-medium transition-colors ${
              activeTab === 'files'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📁 Dateien
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2 text-center font-medium transition-colors ${
              activeTab === 'chat'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            💬 Chat
          </button>
        </div>

        {/* Tab-Inhalt: Einträge */}
        {activeTab === 'entries' && (
          <>
            {/* Formular für neue Einträge */}
            <EntryForm loading={entriesLoading} onSubmit={addEntry} />

            {/* Fehlermeldung falls vorhanden */}
            {entriesError && <Alert message={entriesError} variant="error" />}

            {/* Liste der Einträge mit Edit/Delete */}
            <div className="space-y-3 mt-4">
              <EntryList
                entries={entries}
                onUpdate={updateEntry}
                onDelete={deleteEntry}
              />
            </div>
          </>
        )}

        {/* Tab-Inhalt: Dateien */}
        {activeTab === 'files' && (
          <>
            {/* Upload-Formular */}
            <FileUpload loading={filesLoading} onUpload={uploadFile} />

            {/* Fehlermeldung falls vorhanden */}
            {filesError && <Alert message={filesError} variant="error" className="mt-4" />}

            {/* Liste der Dateien */}
            <div className="mt-4">
              <FileList
                files={files}
                onDownload={downloadFile}
                onDelete={deleteFile}
              />
            </div>
          </>
        )}

        {/* Tab-Inhalt: Chat */}
        {activeTab === 'chat' && (
          <div className="mt-4">
            <Chat username={username} />
          </div>
        )}
      </Card>
    </PageLayout>
  )
}

export default App
