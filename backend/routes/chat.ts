/**
 * @file routes/chat.ts
 * @description WebSocket-Chat-Route.
 * 
 * SICHERHEIT:
 * - WebSocket-Handshake wird über Hono abgewickelt
 * - Aktuell einfacher Broadcast im Raum
 * 
 * PROTOKOLL (JSON):
 * - Senden: { text: "Hallo" }
 * - Empfangen: { sender: "User1", text: "Hallo", timestamp: "..." }
 */

import { Hono } from 'hono'
import { upgradeWebSocket, websocket } from 'hono/bun'
import type { ServerWebSocket } from 'bun'

interface WSContext {
  userId: string
  username: string
  room: string
}

export { upgradeWebSocket, websocket }

/**
 * Erstellt Chat-Router.
 */
export function createChatRoutes() {
  const chat = new Hono()

  /**
   * GET /api/chat
   * Upgrade-Endpoint für WebSockets.
   */
  chat.get('/', upgradeWebSocket((c) => {
    const username = c.req.query('username') || `Guest_${Math.floor(Math.random() * 1000)}`
    const room = c.req.query('room') || 'general'

    return {
      onOpen(event, ws) {
        console.log(`[WS] Open: ${username} joined ${room}`)
        // Bun native pub/sub via ws.raw
        const raw = ws.raw as ServerWebSocket<WSContext>
        raw.subscribe(room)
        
        // Willkommensnachricht nur an den User
        ws.send(JSON.stringify({ 
          sender: 'System', 
          text: `Wilkommen im Raum: ${room}`, 
          timestamp: new Date().toISOString() 
        }))

        // Nachricht an alle anderen
        raw.publish(room, JSON.stringify({
          sender: 'System',
          text: `${username} ist dem Chat beigetreten`,
          timestamp: new Date().toISOString()
        }))
      },
      onMessage(event, ws) {
        console.log(`[WS] Message from ${username}: ${event.data}`)
        
        try {
          const data = JSON.parse(event.data.toString())
          if (data.text) {
            const message = {
              sender: username,
              text: data.text,
              timestamp: new Date().toISOString()
            }
            // Sende an alle im Raum (via native publish)
            const raw = ws.raw as ServerWebSocket<WSContext>
            raw.publish(room, JSON.stringify(message))
            // Echo an sich selbst (da publish nicht an den Sender schickt)
            ws.send(JSON.stringify(message))
          }
        } catch (e) {
          console.error('[WS] Parse Error:', e)
        }
      },
      onClose(event, ws) {
        console.log(`[WS] Close: ${username} left ${room}`)
        const raw = ws.raw as ServerWebSocket<WSContext>
        raw.unsubscribe(room)
        
        raw.publish(room, JSON.stringify({
          sender: 'System',
          text: `${username} hat den Chat verlassen`,
          timestamp: new Date().toISOString()
        }))
      },
    }
  }))

  return chat
}
