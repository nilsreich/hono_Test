import { Hono } from 'hono'
import type { Context, Next } from 'hono'
import { serveStatic } from 'hono/bun'
import { jwt, sign } from 'hono/jwt'
import { Database } from 'bun:sqlite'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

// Type Definitions
interface User {
  id: number
  username: string
  password: string
}

interface Entry {
  id: number
  text: string
  userId: number
}

// Environment Validation
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is required')
  console.error('   Set it with: export JWT_SECRET="your-secure-secret-here"')
  process.exit(1)
}

const app = new Hono()
const db = new Database('data.sqlite')

// ===================
// Rate Limiting
// ===================
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const rateLimit = (limit: number, windowMs: number) => {
  return async (c: Context, next: Next) => {
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
    const now = Date.now()
    const record = rateLimitMap.get(ip)

    if (!record || now > record.resetTime) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    } else if (record.count >= limit) {
      return c.json({ error: 'Too many requests. Please try again later.' }, 429)
    } else {
      record.count++
    }
    await next()
  }
}

// Cleanup rate limit map periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip)
    }
  }
}, 5 * 60 * 1000)

// ===================
// Input Validation
// ===================
type ValidationResult = 
  | { valid: true; username: string; password: string }
  | { valid: false; error: string }

const validateAuth = (username: unknown, password: unknown): ValidationResult => {
  if (typeof username !== 'string' || username.trim().length < 3 || username.length > 50) {
    return { valid: false, error: 'Username must be 3-50 characters' }
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return { valid: false, error: 'Password must be 8-128 characters' }
  }
  // Basic sanitization - only alphanumeric and some special chars for username
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscores and hyphens' }
  }
  return { valid: true, username: username.trim(), password }
}

const validateEntryText = (text: unknown): { valid: true; text: string } | { valid: false; error: string } => {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return { valid: false, error: 'Entry text cannot be empty' }
  }
  if (text.length > 10000) {
    return { valid: false, error: 'Entry text cannot exceed 10000 characters' }
  }
  return { valid: true, text: text.trim() }
}

// Initialize DB
db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT)")
db.run("CREATE TABLE IF NOT EXISTS entries (id INTEGER PRIMARY KEY AUTOINCREMENT, text TEXT, userId INTEGER)")

// ===================
// Health Check
// ===================
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// ===================
// Auth Routes (Rate Limited)
// ===================
app.post('/api/signup', rateLimit(5, 60 * 1000), async (c) => {
  try {
    const body = await c.req.json()
    const validation = validateAuth(body.username, body.password)
    
    if (!validation.valid) {
      return c.json({ error: validation.error }, 400)
    }
    
    const hashedPassword = await Bun.password.hash(validation.password)
    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [validation.username, hashedPassword])
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: 'User already exists' }, 400)
  }
})

app.post('/api/login', rateLimit(10, 60 * 1000), async (c) => {
  try {
    const body = await c.req.json()
    const validation = validateAuth(body.username, body.password)
    
    if (!validation.valid) {
      return c.json({ error: validation.error }, 400)
    }
    
    const user = db.query("SELECT * FROM users WHERE username = ?").get(validation.username) as User | null
    
    if (user && await Bun.password.verify(validation.password, user.password)) {
      const token = await sign(
        { id: user.id, username: user.username, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 },
        JWT_SECRET,
        'HS256'
      )
      return c.json({ token })
    }
    
    return c.json({ error: 'Invalid credentials' }, 401)
  } catch (e) {
    return c.json({ error: 'Invalid request' }, 400)
  }
})

// ===================
// Protected Routes (JWT Required)
// ===================
app.use('/api/entries/*', jwt({ secret: JWT_SECRET, alg: 'HS256' }))

app.get('/api/entries', (c) => {
  const payload = c.get('jwtPayload')
  const entries = db.query("SELECT * FROM entries WHERE userId = ? ORDER BY id DESC").all(payload.id) as Entry[]
  return c.json(entries || [])
})

app.post('/api/entries', async (c) => {
  const payload = c.get('jwtPayload')
  
  try {
    const body = await c.req.json()
    const validation = validateEntryText(body.text)
    
    if (!validation.valid) {
      return c.json({ error: validation.error }, 400)
    }
    
    db.run("INSERT INTO entries (text, userId) VALUES (?, ?)", [validation.text, payload.id])
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: 'Invalid request' }, 400)
  }
})

// ===================
// Static Files & PWA
// ===================

// PWA Service Worker Header
app.use('/sw.js', async (c, next) => {
  await next()
  if (c.res.status === 200) {
    c.res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
  }
})

// Serve Static Files
app.use('/*', serveStatic({ root: '../dist' }))

// SPA Fallback
app.get('*', async (c) => {
  const path = c.req.path
  if (!path.startsWith('/api') && !path.includes('.')) {
    const content = await readFile(join(process.cwd(), '../dist/index.html'), 'utf-8')
    return c.html(content)
  }
  return c.text('Not Found', 404)
})

export default {
  port: 3000,
  hostname: '0.0.0.0',
  fetch: app.fetch,
}
