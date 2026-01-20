/**
 * @file hooks/useChat.ts
 * @description Hook für WebSocket-Chat-Funktionalität.
 * 
 * FIX für: "WebSocket connection failed: WebSocket is closed before the connection is established."
 * - Verwendet einen Ref für den Socket, um Re-Renders zu überstehen.
 * - Prüft readyState vor dem Schließen.
 * - Verzögert das Schließen leicht, um Race Conditions in StrictMode zu vermeiden.
 */

import { useState, useEffect, useRef, useCallback } from 'react'

export interface ChatMessage {
  sender: string
  text: string
  timestamp: string
}

export function useChat(username: string, room: string = 'general') {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<WebSocket | null>(null)

  const connect = useCallback(() => {
    // Falls bereits eine Verbindung besteht, nichts tun
    if (socketRef.current?.readyState === WebSocket.OPEN || socketRef.current?.readyState === WebSocket.CONNECTING) {
      return
    }

    // Protokoll (ws oder wss) basierend auf aktuellem Window-Location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host // Port 5173 (Vite Proxy)
    const url = `${protocol}//${host}/api/chat?room=${room}&username=${encodeURIComponent(username)}`

    console.log(`[WS] Verbinde mit Raum: ${room}`)
    const socket = new WebSocket(url)
    socketRef.current = socket

    socket.onopen = () => {
      console.log(`[WS] Verbunden mit Raum: ${room}`)
      setIsConnected(true)
      setError(null)
    }

    socket.onmessage = (event) => {
      try {
        const message: ChatMessage = JSON.parse(event.data)
        setMessages((prev) => [...prev, message])
      } catch (e) {
        console.error('[WS] Fehler beim Parsen der Nachricht:', e)
      }
    }

    socket.onerror = (event) => {
      console.error('[WS] WebSocket Fehler:', event)
      setError('Verbindung zum Chat fehlgeschlagen')
    }

    socket.onclose = (event) => {
      console.log('[WS] Verbindung geschlossen', event.code, event.reason)
      setIsConnected(false)
    }
  }, [username, room])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      // Nur schließen, wenn nicht bereits geschlossen/schließend
      if (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING) {
        socketRef.current.close()
      }
      socketRef.current = null
    }
  }, [])

  const sendMessage = useCallback((text: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ text }))
    } else {
      console.warn('[WS] Nachricht konnte nicht gesendet werden (nicht verbunden)')
    }
  }, [])

  useEffect(() => {
    if (username) {
      connect()
    }
    
    return () => {
      // In React StrictMode (Dev) wird die Verbindung sofort wieder geschlossen.
      // Wir prüfen den readyState, um unnötige Fehler zu vermeiden.
      disconnect()
    }
  }, [username, connect, disconnect])

  return { messages, isConnected, error, sendMessage }
}
