/**
 * @file components/chat/Chat.tsx
 * @description Einfache Chat-Komponente.
 */

import { useState } from 'react'
import { useChat } from '../../hooks'
import { Card, Button, Input, Alert } from '../ui'

interface ChatProps {
  username: string
}

export function Chat({ username }: ChatProps) {
  const { messages, isConnected, error, sendMessage } = useChat(username)
  const [inputText, setInputText] = useState('')

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputText.trim()) {
      sendMessage(inputText)
      setInputText('')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Live Chat</h3>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="text-sm text-gray-500">{isConnected ? 'Verbunden' : 'Getrennt'}</span>
        </div>
      </div>

      {error && <Alert message={error} variant="error" />}

      <Card className="h-64 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
        <div className="space-y-2">
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.sender === username ? 'items-end' : 'items-start'}`}>
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{msg.sender}</span>
                <span className="text-[10px] text-gray-400">{new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>
              <div 
                className={`px-3 py-1 rounded-lg text-sm ${
                  msg.sender === 'System' 
                    ? 'bg-blue-100 text-blue-800 italic' 
                    : msg.sender === username
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 border dark:border-gray-700'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-center text-gray-400 py-10">Keine Nachrichten vorhanden.</div>
          )}
        </div>
      </Card>

      <form onSubmit={handleSend} className="flex gap-2">
        <Input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Nachricht schreiben..."
          disabled={!isConnected}
        />
        <Button type="submit" disabled={!isConnected || !inputText.trim()}>
          Senden
        </Button>
      </form>
    </div>
  )
}
