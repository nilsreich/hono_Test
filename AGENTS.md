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
- **Frontend:** React 19 SPA (Vite + Tailwind v4 + PWA Support)
- **DB:** SQLite via `bun:sqlite`

---

## 🏗 Projekt-Struktur & Konventionen

### 📂 Backend-Struktur
```
/backend
├── index.ts              # Einstiegspunkt: App-Setup, Route-Mounting, Static Serving
├── db/
│   └── index.ts          # DB-Initialisierung & Repository-Funktionen
├── middleware/
│   └── rateLimit.ts      # Rate-Limiting Middleware
├── routes/
│   ├── auth.ts           # /api/login, /api/signup
│   ├── entries.ts        # /api/entries (JWT-geschützt)
│   └── health.ts         # /api/health
├── types/
│   └── index.ts          # Shared Types (User, Entry, JwtPayload)
└── validation/
    └── index.ts          # Validierungsfunktionen
```

**Wichtige Prinzipien:**
- **Routes:** Jede Route-Datei exportiert eine Factory-Funktion (`createXxxRoutes`), die einen `Hono`-Router zurückgibt.
- **DB:** Repositories (`userRepository`, `entryRepository`) abstrahieren DB-Zugriff.
- **Validation:** Zentralisierte Validierungslogik mit TypeScript-Typen.

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
│   │   └── AuthForm.tsx
│   ├── entries/          # Entry-spezifische Komponenten
│   │   ├── EntryForm.tsx
│   │   └── EntryList.tsx
│   └── layout/           # Layout-Komponenten
│       └── PageLayout.tsx
├── hooks/
│   ├── index.ts          # Hook-Exports
│   ├── useAuth.ts        # Authentifizierungs-State & Actions
│   └── useEntries.ts     # Entries-State & CRUD-Operationen
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

### 🔧 Neue Komponente erstellen
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
- [ ] Keine schweren Validierungs-Bibliotheken.
- [ ] SQLite-Statements als Prepared Statements (via `db.query()`).
- [ ] API-Client zentral verwenden, nicht mehrfach `fetch` implementieren.
- [ ] Hooks für State-Management, keine Logik in Komponenten.

---

## ⚠️ Bekannte Fallstricke
- **JWT Errors:** Immer `alg: 'HS256'` in `jwt({...})` und `sign({...})` angeben.
- **Vite Proxy:** Die `vite.config.ts` muss den Proxy auf Port 3000 halten.
- **SPA Routing:** Das Backend muss ein Catch-all für die `index.html` haben.
- **Circular Imports:** Barrel-Exports können zu Circular-Import-Problemen führen - Types separat halten.
- **Component Props:** Immer explizite Interfaces definieren, keine `any` Types.
