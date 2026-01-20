/**
 * @file components/auth/ResetPasswordForm.tsx
 * @description Formular zum Zurücksetzen des Passworts.
 */

import { useState, useEffect, type FormEvent } from 'react'
import { Input, Button, Card, CardHeader, Alert } from '../ui'

interface ResetPasswordFormProps {
  token: string
  onValidate: (token: string) => Promise<{ valid: boolean; error?: string }>
  onSubmit: (token: string, password: string) => Promise<{ success: boolean; message?: string; error?: string }>
  onBack: () => void
}

export function ResetPasswordForm({ token, onValidate, onSubmit, onBack }: ResetPasswordFormProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [tokenValid, setTokenValid] = useState(false)

  useEffect(() => {
    let isMounted = true

    const validateToken = async () => {
      const result = await onValidate(token)
      
      if (!isMounted) return

      setLoading(false)
      
      if (result.valid) {
        setTokenValid(true)
      } else {
        setError(result.error || 'Ungültiger oder abgelaufener Reset-Link')
      }
    }

    validateToken()

    return () => {
      isMounted = false
    }
  }, [token, onValidate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein')
      return
    }

    if (password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen lang sein')
      return
    }

    setSubmitting(true)
    setError('')
    setMessage('')

    const result = await onSubmit(token, password)

    setSubmitting(false)

    if (result.error) {
      setError(result.error)
    } else if (result.success) {
      setMessage(result.message || 'Passwort wurde erfolgreich zurückgesetzt!')
      setPassword('')
      setConfirmPassword('')
    }
  }

  if (loading) {
    return (
      <Card className="max-w-md w-full">
        <CardHeader title="🔐 Passwort zurücksetzen" />
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <p className="text-center text-gray-500">Token wird überprüft...</p>
      </Card>
    )
  }

  if (!tokenValid && !message) {
    return (
      <Card className="max-w-md w-full">
        <CardHeader title="🔐 Passwort zurücksetzen" />
        <Alert message={error} variant="error" />
        <button
          onClick={onBack}
          className="w-full mt-4 text-center text-sm text-blue-600 hover:text-blue-800"
        >
          ← Zurück zum Login
        </button>
      </Card>
    )
  }

  return (
    <Card className="max-w-md w-full">
      <CardHeader title="🔐 Neues Passwort setzen" />

      {message && (
        <>
          <Alert message={message} variant="success" />
          <button
            onClick={onBack}
            className="w-full mt-4 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Zum Login
          </button>
        </>
      )}

      {error && !message && <Alert message={error} variant="error" />}

      {!message && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Neues Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />

          <Input
            type="password"
            placeholder="Passwort bestätigen"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Wird gespeichert...' : 'Passwort speichern'}
          </Button>

          <button
            type="button"
            onClick={onBack}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-800"
          >
            ← Zurück zum Login
          </button>
        </form>
      )}
    </Card>
  )
}
