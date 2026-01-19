import { useState, useEffect, useCallback } from 'react'

interface Entry {
  id: number
  text: string
}

function App() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [inputText, setInputText] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fetchError, setFetchError] = useState('')

  const fetchEntries = useCallback(async () => {
    if (!token) return
    setFetchError('')
    try {
      const res = await fetch('/api/entries', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setEntries(data)
      } else {
        if (res.status === 401) {
          handleLogout()
        } else {
          setFetchError('Fehler beim Laden der Einträge')
        }
      }
    } catch (error) {
      console.error('Error fetching entries:', error)
      setFetchError('Netzwerkfehler beim Laden')
    }
  }, [token])

  useEffect(() => {
    if (token) fetchEntries()
  }, [token, fetchEntries])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const endpoint = isLogin ? '/api/login' : '/api/signup'
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      
      if (res.ok) {
        if (isLogin) {
          localStorage.setItem('token', data.token)
          setToken(data.token)
        } else {
          setIsLogin(true)
          setError('Registrierung erfolgreich! Bitte einloggen.')
        }
      } else {
        setError(data.error || 'Fehler aufgetreten')
      }
    } catch (err) {
      setError('Netzwerkfehler')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken('')
    setEntries([])
  }

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return

    setLoading(true)
    setFetchError('')
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: inputText }),
      })
      if (res.ok) {
        setInputText('')
        fetchEntries()
      } else {
        const data = await res.json()
        setFetchError(data.error || 'Fehler beim Speichern')
      }
    } catch (error) {
      console.error('Error saving entry:', error)
      setFetchError('Netzwerkfehler beim Speichern')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
            {isLogin ? 'Login' : 'Registrieren'}
          </h1>
          {error && <p className="mb-4 text-red-500 text-sm text-center font-medium">{error}</p>}
          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="text"
              placeholder="Benutzername"
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Passwort"
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Laden...' : (isLogin ? 'Anmelden' : 'Konto erstellen')}
            </button>
          </form>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="w-full mt-4 text-sm text-blue-600 hover:underline"
          >
            {isLogin ? 'Noch kein Konto? Registrieren' : 'Bereits ein Konto? Login'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Meine Einträge</h1>
          <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">Logout</button>
        </div>
        
        <form onSubmit={handleAddEntry} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Neuer Eintrag..."
              className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {loading ? '...' : 'Senden'}
            </button>
          </div>
        </form>

        {fetchError && (
          <p className="mb-4 text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded">
            {fetchError}
          </p>
        )}

        <div className="space-y-3">
          {entries.length === 0 ? (
            <p className="text-gray-500 italic">Noch keine Einträge vorhanden.</p>
          ) : (
            <ul className="divide-y text-gray-700">
              {entries.map((entry) => (
                <li key={entry.id} className="py-2">
                  {entry.text}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
