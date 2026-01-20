# 🤖 AGENTS.md - Automatisierung & Coding-Agents

Dieses Dokument definiert die Regeln und Best Practices für KI-Coding-Agents, die an diesem Projekt arbeiten. Da das Projekt auf **maximale Performance bei minimalem Ressourcenverbrauch** optimiert ist, müssen Agents diese Richtlinien strikt befolgen.

## 🎯 Kernphilosophie
1. **Minimalismus:** Keine schweren Bibliotheken (ORMs, UI-Kits wie MUI/Chakra).
2. **Native First:** Nutze Bun-Build-ins (z.B. `bun:sqlite`, `Bun.password`) statt externer NPM-Pakete, wo möglich.
3. **Explizität:** Alle API-Antworten müssen klare Statuscodes liefern.
4. **Single-Source-of-Truth:** Das Backend serviert das Frontend.
5. **Modularität:** Code sollte wiederverwendbar und in logische Module aufgeteilt sein.

## 🛠 Technologie-Stack für Agents
- **Runtime:** Bun (nutze `bun install`, `bun run dev`, `bun x`)
- **Backend:** Hono (Middleware-basiert, modulare Routes)
- **Validation:** Zod v4 + `@hono/zod-validator` (NICHT manuelle Validierung)
- **Security:** `secureHeaders()` Middleware (XSS, HSTS, nosniff, SAMEORIGIN)
- **Frontend:** React 19 SPA (Vite + `@tailwindcss/vite` + PWA Support)
- **DB:** SQLite via `bun:sqlite` (immer Prepared Statements!)
- **Code Quality:** ESLint + Prettier (konfiguriert im Root)

---

## 🏗 Projekt-Struktur & Konventionen

### 📂 Backend-Struktur
```
/backend
├── index.ts              # Einstiegspunkt: App-Setup, Route-Mounting, Static Serving, secureHeaders
├── db/
│   └── index.ts          # DB-Initialisierung & Repository-Funktionen (userRepository, entryRepository, fileRepository)
├── middleware/
│   ├── index.ts          # Middleware-Exports
│   └── rateLimit.ts      # Rate-Limiting Middleware
├── routes/
│   ├── auth.ts           # /api/login, /api/signup (mit Zod-Validierung)
│   ├── entries.ts        # /api/entries (CRUD, JWT-geschützt, Zod-Validierung)
│   ├── files.ts          # /api/files (File-Upload, JWT-geschützt)
│   ├── health.ts         # /api/health
│   ├── password-reset.ts # /api/forgot-password, /api/reset-password (Resend E-Mail)
│   └── index.ts          # Route-Exports
├── types/
│   └── index.ts          # Shared Types (User, Entry, FileMetadata, JwtPayload)
├── uploads/              # Datei-Uploads (nach User-ID organisiert)
└── validation/
    ├── index.ts          # Validierungsfunktionen & Schema-Exports
    └── schemas.ts        # Zod-Schemas (authSchema, entrySchema, fileMetadataSchema, forgotPasswordSchema, resetPasswordSchema)
```

**Wichtige Prinzipien:**
- **Routes:** Jede Route-Datei exportiert eine Factory-Funktion (`createXxxRoutes`), die einen `Hono`-Router zurückgibt.
- **DB:** Repositories (`userRepository`, `entryRepository`, `fileRepository`) abstrahieren DB-Zugriff.
- **Validation:** Zod-Schemas in `validation/schemas.ts`, verwendet via `@hono/zod-validator`.
- **Security:** `secureHeaders()` Middleware im Root-App aktiviert.

### 📂 Frontend-Struktur
```
/frontend/src
├── App.tsx               # Haupt-Komponente (verwendet Hooks & Components)
├── components/
│   ├── index.ts          # Barrel-Export für alle Komponenten
│   ├── ui/               # Wiederverwendbare UI-Bausteine
│   │   ├── Alert.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Input.tsx
│   ├── auth/             # Auth-spezifische Komponenten
│   │   ├── AuthForm.tsx
│   │   ├── ForgotPasswordForm.tsx
│   │   └── ResetPasswordForm.tsx
│   ├── entries/          # Entry-spezifische Komponenten
│   │   ├── EntryForm.tsx
│   │   └── EntryList.tsx  # Mit Edit/Delete Funktionalität
│   ├── files/            # File-Upload Komponenten
│   │   ├── FileList.tsx
│   │   ├── FileUpload.tsx
│   │   └── index.ts
│   └── layout/           # Layout-Komponenten
│       └── PageLayout.tsx
├── hooks/
│   ├── index.ts          # Hook-Exports
│   ├── useAuth.ts        # Authentifizierungs-State & Actions (inkl. Password Reset)
│   ├── useEntries.ts     # Entries-State & CRUD-Operationen (Create, Read, Update, Delete)
│   └── useFiles.ts       # Files-State & Upload-Operationen
├── lib/
│   ├── api.ts            # Zentralisierter API-Client mit Fetch-Wrapper
│   └── storage.ts        # LocalStorage-Abstraktion
└── types/
    └── index.ts          # Frontend-spezifische Types
```

**Wichtige Prinzipien:**
- **Components:** Immer über `components/index.ts` importieren.
- **Hooks:** Business-Logik gehört in Hooks, nicht in Komponenten.
- **Lib:** API-Calls nur über `lib/api.ts`, nie direkt `fetch()` verwenden.
- **Types:** Shared Types in `types/index.ts` definieren.

---

## 📋 Coding-Konventionen für Agents

### � Zod-Validierung (WICHTIG!)
Alle API-Endpunkte, die Benutzereingaben empfangen, MÜSSEN `@hono/zod-validator` verwenden.

**Zod v4 Syntax beachten:**
```typescript
// backend/validation/schemas.ts
import { z } from 'zod'

// KORREKT für Zod v4 (message statt required_error)
export const authSchema = z.object({
  username: z.string({ message: 'Username is required' })
    .min(3, { message: 'Username must be at least 3 characters' })
    .max(50, { message: 'Username cannot exceed 50 characters' }),
  password: z.string({ message: 'Password is required' })
    .min(8, { message: 'Password must be at least 8 characters' })
})

// FALSCH (Zod v3 Syntax - NICHT verwenden!)
// z.string({ required_error: '...' })
```

**Route-Integration:**
```typescript
import { zValidator } from '@hono/zod-validator'
import { authSchema } from '../validation/schemas'

auth.post('/signup',
  zValidator('json', authSchema, (result, c) => {
    if (!result.success) {
      // Zod v4: .issues statt .errors
      return c.json({ error: result.error.issues[0]?.message }, 400)
    }
  }),
  async (c) => {
    const { username, password } = c.req.valid('json')
    // ...
  }
)
```

### �🔧 Neue Komponente erstellen
1. Erstelle die Komponente im passenden Unterordner (`ui/`, `auth/`, etc.)
2. Exportiere sie im jeweiligen `index.ts`
3. Füge den Export in `components/index.ts` hinzu

```tsx
// Beispiel: components/ui/Badge.tsx
interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'error'
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  // ...
}

// In components/ui/index.ts hinzufügen:
export { Badge } from './Badge'
```

### 🔧 Neuen API-Endpunkt hinzufügen
1. Route in passender Datei unter `backend/routes/` erstellen oder neue Datei anlegen
2. Factory-Funktion exportieren
3. In `backend/routes/index.ts` exportieren
4. In `backend/index.ts` mounten

```typescript
// Beispiel: backend/routes/tasks.ts
export function createTasksRoutes(jwtSecret: string) {
  const tasks = new Hono()
  tasks.use('/*', jwt({ secret: jwtSecret, alg: 'HS256' }))
  // ... routes
  return tasks
}

// In backend/index.ts:
app.route('/api/tasks', createTasksRoutes(JWT_SECRET))
```

### 🔧 Neuen Hook erstellen
1. Hook in `frontend/src/hooks/` erstellen
2. In `hooks/index.ts` exportieren

```typescript
// Beispiel: hooks/useTasks.ts
export function useTasks(token: string) {
  // State, API-Calls, etc.
  return { tasks, loading, error, fetchTasks, addTask }
}
```

### 📁 File-Upload implementieren
Das Projekt hat ein vollständiges File-Upload-System:

**Backend-Route (`routes/files.ts`):**
- `GET /api/files` - Liste aller Dateien des Users
- `POST /api/files` - File-Upload (multipart/form-data)
- `GET /api/files/:id/download` - Datei herunterladen
- `DELETE /api/files/:id` - Datei löschen

**Konfiguration:**
```typescript
// backend/validation/schemas.ts
export const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf', 'text/plain', 'text/csv',
  'application/json', 'application/xml'
]
export const MAX_FILE_SIZE = 10 * 1024 * 1024  // 10MB
```

**Speicherstruktur:**
```
/backend/uploads/
└── {userId}/
    └── {uuid}.{extension}
```

### 🔐 Passwort-Reset implementieren
Das Projekt verwendet Resend für E-Mail-Versand:

**Backend-Route (`routes/password-reset.ts`):**
- `POST /api/forgot-password` - Sendet Reset-E-Mail (Rate Limited: 3/min)
- `POST /api/reset-password` - Setzt Passwort zurück
- `GET /api/reset-password/:token` - Validiert Token

**Umgebungsvariablen für E-Mail:**
```bash
# backend/.env
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@deine-domain.de
APP_URL=https://deine-domain.de
```

**Sicherheitsfeatures:**
- UUID-basierte Tokens (kryptographisch sicher)
- Token-Ablauf nach 1 Stunde
- Tokens werden nach Verwendung gelöscht
- Generische Fehlermeldungen (verhindert User Enumeration)
- Native Bun `fetch()` für Resend API (kein nodemailer)

**Datenbank-Schema:**
```sql
-- users-Tabelle erweitert um:
reset_token TEXT,        -- UUID-Token für Reset
reset_expires INTEGER    -- Ablaufdatum als Unix-Timestamp
```

**Konfiguration:**
```typescript
// backend/validation/schemas.ts
export const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf', 'text/plain', 'text/csv',
  'application/json', 'application/xml'
]
export const MAX_FILE_SIZE = 10 * 1024 * 1024  // 10MB
```

**Speicherstruktur:**
```
/backend/uploads/
└── {userId}/
    └── {uuid}.{extension}
```

---

## 🔑 Authentifizierung (JWT)
Agents müssen sicherstellen, dass:
- `HS256` als Algorithmus explizit gesetzt ist (in `sign` und `jwt`-Middleware).
- Der `Authorization: Bearer <token>` Header im Frontend bei jedem API-Request an geschützte Routen korrekt gesetzt wird.
- Passwörter immer mit `Bun.password.hash()` verarbeitet werden.
- API-Client (`lib/api.ts`) automatisch Token-Header setzt.

### 📱 PWA & Service Worker
Agents müssen sicherstellen, dass:
- Die `sw.js` im Backend mit `Cache-Control: no-cache` serviert wird.
- API-Routen (`/api/*`) niemals vom Service Worker gecacht werden.
- Navigations-Requests im Backend auf die `index.html` zurückfallen (SPA-Fallback).

---

## 📜 Workflow-Anweisungen für Agents

### 1. Datenbank-Migrationen
Bei Änderungen am Schema:
- Schema-Änderungen in `backend/db/index.ts` → `initializeDatabase()` vornehmen.
- Weise den User darauf hin, die `data.sqlite` zu löschen, falls Spalten hinzugefügt wurden.
- Nutze `CREATE TABLE IF NOT EXISTS`.

### 2. Frontend-Builds
Nach Änderungen am Frontend-Quellcode:
- Führe `bun run build:frontend` aus dem Root aus.

### 3. Port-Management
Falls der Agent Fehler wie `EADDRINUSE` sieht:
- Nutze `fuser -k 3000/tcp` um blockierte Ports freizugeben.
- Standard-Backend-Port: `3000`.
- Standard-Frontend-Port: `5173`.

### 4. Import-Pfade
- Frontend: Immer über Barrel-Exports (`hooks`, `components`, `lib`)
- Backend: Relative Imports zu lokalen Modulen

---

## 🚀 Performance-Checkliste
- [ ] Keine unnötigen `node_modules` im Backend.
- [ ] Tailwind-Klassen statt inline Styles.
- [ ] Zod für Validierung (NICHT manuelle if-Checks).
- [ ] SQLite-Statements als Prepared Statements (via `db.query()`).
- [ ] API-Client zentral verwenden, nicht mehrfach `fetch` implementieren.
- [ ] Hooks für State-Management, keine Logik in Komponenten.
- [ ] `secureHeaders()` Middleware aktiv.
- [ ] File-Uploads mit MIME-Type und Größen-Validierung.

---

## ⚠️ Bekannte Fallstricke
- **JWT Errors:** Immer `alg: 'HS256'` in `jwt({...})` und `sign({...})` angeben.
- **Vite Proxy:** Die `vite.config.ts` muss den Proxy auf Port 3000 halten.
- **SPA Routing:** Das Backend muss ein Catch-all für die `index.html` haben.
- **Circular Imports:** Barrel-Exports können zu Circular-Import-Problemen führen - Types separat halten.
- **Component Props:** Immer explizite Interfaces definieren, keine `any` Types.
- **Zod v4 API:** Nutze `message` statt `required_error` und `.issues` statt `.errors`.
- **Tailwind v4:** Nutze `@tailwindcss/vite` Plugin, NICHT PostCSS-Konfiguration.
- **React 19 useEffect:** Bei async-Operationen in useEffect `isMounted`-Pattern verwenden.
