/**
 * @file components/auth/ForgotPasswordForm.tsx
 * @description Formular für Passwort-vergessen-Anfrage.
 */

import { useState, type FormEvent } from 'react'
import { Input, Button, Card, CardHeader, Alert } from '../ui'

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>
  onBack: () => void
}

export function ForgotPasswordForm({ onSubmit, onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const result = await onSubmit(email)

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else if (result.message) {
      setMessage(result.message)
      setEmail('')
    }
  }

  return (
    <Card className="max-w-md w-full">
      <CardHeader title="🔐 Passwort vergessen" />

      {message && <Alert message={message} variant="success" />}
      {error && <Alert message={error} variant="error" />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-gray-600 text-sm">
          Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen deines Passworts.
        </p>

        <Input
          type="email"
          placeholder="E-Mail-Adresse"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Wird gesendet...' : 'Reset-Link senden'}
        </Button>

        <button
          type="button"
          onClick={onBack}
          className="w-full text-center text-sm text-blue-600 hover:text-blue-800"
        >
          ← Zurück zum Login
        </button>
      </form>
    </Card>
  )
}
