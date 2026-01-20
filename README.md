# ⚡ Low-RAM Fullstack Stack (Bun + Hono + React + SQLite)

Ein extrem ressourceneffizientes Web-App-Template, optimiert für den Betrieb auf schwachen VPS (Virtual Private Servern) mit minimalem RAM-Verbrauch (< 100MB im Idle).

## 🚀 Technologie-Stack

### Backend
- **Runtime:** [Bun](https://bun.sh/) - Extrem schneller JavaScript-All-in-One-Runtime.
- **Framework:** [Hono](https://hono.dev/) - Ultrafast, web-standardsbasiertes Framework.
- **Database:** `bun:sqlite` - Native SQLite-Anbindung ohne schwere ORMs oder externe Prozesse.
- **Auth:** `hono/jwt` Middleware & `Bun.password` für sicheres Argon2/bcrypt Hashing.
- **Validation:** [Zod](https://zod.dev/) + `@hono/zod-validator` - Typsichere Eingabe-Validierung.
- **Security:** `secureHeaders()` Middleware für XSS, HSTS, Clickjacking-Schutz.

### Frontend
- **Framework:** [React 19](https://react.dev/) (SPA) - Als statische Dateien serviert.
- **Build-Tool:** [Vite](https://vitejs.dev/) - Schnelle Development-Experience und optimierte Builds.
- **PWA:** [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) - Offline-Support und Installierbarkeit.
- **CSS:** [Tailwind CSS v4](https://tailwindcss.com/) - Modernstes CSS-Framework via `@tailwindcss/vite`.
- **Linting:** ESLint + Prettier - Konsistente Code-Formatierung.

---

## 📁 Projekt-Struktur

```
/
├── backend/
│   ├── index.ts           # Haupteinstiegspunkt (App-Setup, Static Serving, Security Headers)
│   ├── db/
│   │   └── index.ts       # Datenbankverbindung & Repositories
│   ├── middleware/
│   │   ├── index.ts       # Middleware-Exports
│   │   └── rateLimit.ts   # Rate-Limiting Middleware
│   ├── routes/
│   │   ├── index.ts       # Route-Exports
│   │   ├── auth.ts        # Authentifizierungs-Routen (Login, Signup) mit Zod-Validierung
│   │   ├── entries.ts     # Einträge-Routen (CRUD) mit Zod-Validierung
│   │   ├── files.ts       # Datei-Upload-Routen (Upload, Download, Delete)
│   │   └── health.ts      # Health-Check-Route
│   ├── types/
│   │   └── index.ts       # TypeScript Type-Definitionen
│   └── validation/
│       ├── index.ts       # Eingabe-Validierungsfunktionen
│       └── schemas.ts     # Zod-Schemas für API-Validierung
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx        # Haupt-App-Komponente mit Tab-Navigation
│   │   ├── main.tsx       # React-Einstiegspunkt
│   │   ├── index.css      # Globale Styles (Tailwind)
│   │   ├── components/
│   │   │   ├── index.ts   # Komponenten-Barrel-Export
│   │   │   ├── ui/        # Wiederverwendbare UI-Komponenten
│   │   │   │   ├── Alert.tsx
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   └── Input.tsx
│   │   │   ├── auth/      # Authentifizierungs-Komponenten
│   │   │   │   └── AuthForm.tsx
│   │   │   ├── entries/   # Einträge-Komponenten
│   │   │   │   ├── EntryForm.tsx
│   │   │   │   └── EntryList.tsx
│   │   │   ├── files/     # Datei-Upload-Komponenten
│   │   │   │   ├── FileUpload.tsx
│   │   │   │   └── FileList.tsx
│   │   │   └── layout/    # Layout-Komponenten
│   │   │       └── PageLayout.tsx
│   │   ├── hooks/         # Custom React Hooks
│   │   │   ├── index.ts
│   │   │   ├── useAuth.ts
│   │   │   ├── useEntries.ts
│   │   │   └── useFiles.ts
│   │   ├── lib/           # Hilfsfunktionen & API-Client
│   │   │   ├── api.ts     # Zentralisierter API-Client
│   │   │   └── storage.ts # LocalStorage-Wrapper
│   │   └── types/         # TypeScript Type-Definitionen
│   │       └── index.ts
│   ├── vite.config.ts
│   └── eslint.config.js   # ESLint + Prettier Konfiguration
│
├── .prettierrc            # Prettier Konfiguration
└── dist/                  # Build-Output (vom Backend serviert)
```

---

## 🏗️ Architektur

Das Projekt ist in eine klare Trennung von Frontend und Backend unterteilt, wobei das Backend zur Produktionszeit als Single-Server fungiert:

- **`/frontend`**: Der Quellcode der React-App. Während der Entwicklung läuft hier Vite als Dev-Server.
- **`/backend`**: Die API-Logik und DB-Anbindung.
- **`/dist`**: Der Build-Output des Frontends. Das Backend serviert diesen Ordner statisch auf der Root-Route (`/`).

### 🧩 Frontend-Architektur

Das Frontend folgt einer klaren Schichtenarchitektur:

| Schicht | Zweck | Beispiele |
|---------|-------|-----------|
| **Components** | UI-Darstellung | `Button`, `Card`, `AuthForm` |
| **Hooks** | Business-Logik & State | `useAuth`, `useEntries` |
| **Lib** | Infrastruktur | `api.ts`, `storage.ts` |
| **Types** | TypeScript-Definitionen | `Entry`, `User` |

### 🛠 Backend-Architektur

Das Backend ist modular aufgebaut:

| Modul | Zweck |
|-------|-------|
| **routes/** | HTTP-Endpunkte nach Domäne gruppiert |
| **middleware/** | Request-Processing (Rate Limiting) |
| **db/** | Datenbankzugriff & Repositories |
| **validation/** | Eingabe-Validierung |
| **types/** | Gemeinsame TypeScript-Definitionen |

### 📱 PWA Features
- **Offline-Caching**: Assets werden über Workbox gecacht.
- **Smart Updates**: Service Worker (`sw.js`) wird vom Backend mit `Cache-Control: no-cache` serviert, um sofortige Updates zu ermöglichen.
- **SPA Fallback**: Das Backend leitet alle Navigationsanfragen (Deep Links) auf die `index.html` um, damit clientseitiges Routing offline funktioniert.

**Vorteile dieser Architektur:**
- **Zero-Downtime DB:** SQLite ist eine Datei, kein extra Dienst, der abstürzen kann.
- **Minimaler Footprint:** Bun kombiniert HTTP-Server, Paketmanager und Runtime in einer Binärdatei.
- **CPU-Effizienz:** Kein Server-Side-Rendering (SSR). Die CPU des VPS wird nur für API-Logik und Datei-Serving genutzt.
- **Wiederverwendbarkeit:** Modulare Komponenten, Hooks und API-Clients können leicht erweitert werden.

---

## 🛠️ Development

### Voraussetzungen
- [Bun](https://bun.sh/) (v1.0+)

### Setup
```bash
# Im Root-Verzeichnis
cd frontend && bun install
cd ../backend && bun install
cd ..
bun install  # Root-Dependencies (Prettier)
```

### Umgebungsvariablen
```bash
export JWT_SECRET="dein-sicheres-secret"
```

### Dev-Server starten
```bash
bun run dev
```
- **Frontend:** `http://localhost:5173` (Vite mit Proxy zu API)
- **Backend:** `http://localhost:3000` (Hono API)

### Verfügbare Scripts
| Script | Beschreibung |
|--------|--------------|
| `bun run dev` | Frontend + Backend gleichzeitig starten |
| `bun run dev:frontend` | Nur Vite Dev-Server |
| `bun run dev:backend` | Nur Backend mit Watch-Mode |
| `bun run build:frontend` | Frontend für Produktion bauen |
| `bun run lint` | ESLint ausführen |
| `bun run format` | Code mit Prettier formatieren |
| `bun run format:check` | Prüfen ob Code formatiert ist |

---

## 📦 Deployment (VPS)

Dieses Projekt ist darauf ausgelegt, mit minimalem Aufwand auf einem Linux-Server zu laufen.

### 1. Build erstellen
```bash
bun run build:frontend
```

### 2. Dateien übertragen
Nur diese Ordner/Dateien auf den VPS kopieren:
- `/backend`
- `/dist`

### 3. Umgebungsvariablen konfigurieren

Erstelle eine `.env` Datei im `backend/` Ordner:

```bash
# Pflicht: JWT Secret für Token-Signierung
JWT_SECRET=dein-sicheres-secret-hier

# Für Passwort-Reset Funktion (optional aber empfohlen)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@deine-domain.de
APP_URL=https://deine-domain.de
```

### 4. Server starten
```bash
cd backend
bun install --production
bun run index.ts
```
*Empfehlung: Nutze `pm2` oder `systemd` für Prozess-Management.*

---

## 📧 E-Mail Setup (Resend)

Die Passwort-vergessen-Funktion verwendet [Resend](https://resend.com) für den E-Mail-Versand. Resend ist ein moderner E-Mail-Dienst mit großzügigem Free-Tier (3.000 E-Mails/Monat).

### Warum Resend?

| Vorteil | Beschreibung |
|---------|--------------|
| **Kein SMTP-Server** | Keine eigene Mail-Infrastruktur nötig |
| **Minimaler RAM** | Nur eine HTTP-Anfrage, Resend übernimmt Queueing |
| **Hohe Zustellrate** | Professionelle Infrastruktur, weniger Spam-Probleme |
| **Einfache API** | Native `fetch()` von Bun, kein nodemailer |

### 1. Resend Account erstellen

1. Gehe zu [resend.com/signup](https://resend.com/signup)
2. Erstelle einen Account (kostenlos)
3. Im Dashboard: **API Keys** → **Create API Key**
4. Kopiere den Key (beginnt mit `re_`)

### 2. Domain verifizieren (WICHTIG!)

Ohne Domain-Verifizierung landen E-Mails im Spam oder werden abgelehnt.

1. Im Resend Dashboard: **Domains** → **Add Domain**
2. Gib deine Domain ein (z.B. `deine-domain.de`)
3. Füge die angezeigten DNS-Einträge bei deinem Domain-Provider hinzu:

| Typ | Name | Wert |
|-----|------|------|
| **TXT** | `resend._domainkey` | `p=MIGf...` (Resend zeigt den vollständigen Wert) |
| **TXT** | `@` oder `_dmarc` | `v=DMARC1; p=none;` |
| **CNAME** | `send` | `send.resend.com` |

**Beispiel für Cloudflare/Hetzner DNS:**
```
# SPF Record (falls nicht vorhanden)
TXT  @                    "v=spf1 include:_spf.resend.com ~all"

# DKIM Record
TXT  resend._domainkey    "p=MIGf..."

# DMARC Record
TXT  _dmarc               "v=DMARC1; p=none;"
```

4. Warte auf Verifizierung (kann bis zu 24h dauern, meist schneller)
5. Status sollte auf "Verified" wechseln ✅

### 3. Umgebungsvariablen setzen

```bash
# backend/.env
RESEND_API_KEY=re_123456789abcdef
EMAIL_FROM=noreply@deine-domain.de
APP_URL=https://deine-domain.de
```

**Wichtig:**
- `EMAIL_FROM` muss eine Adresse deiner verifizierten Domain sein
- `APP_URL` wird für den Reset-Link in der E-Mail verwendet
- Ohne `APP_URL` wird `http://localhost:5173` als Fallback genutzt

### 4. Testen

```bash
# Backend starten
cd backend
export RESEND_API_KEY=re_xxx
export EMAIL_FROM=noreply@deine-domain.de
export APP_URL=http://localhost:5173
bun run index.ts

# Test-Request (in neuem Terminal)
curl -X POST http://localhost:3000/api/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"deine@email.de"}'
```

### Troubleshooting

| Problem | Lösung |
|---------|--------|
| E-Mail kommt nicht an | DNS-Einträge prüfen, Spam-Ordner checken |
| `RESEND_API_KEY not configured` | `.env` Datei erstellen oder `export` verwenden |
| `Invalid API Key` | Key im Resend Dashboard neu generieren |
| E-Mail im Spam | Domain vollständig verifizieren (SPF, DKIM, DMARC) |

---

## 🔧 Code-Qualität

### ESLint
Das Projekt verwendet ESLint mit:
- TypeScript-Support (`typescript-eslint`)
- React Hooks Rules (`eslint-plugin-react-hooks`)
- React Refresh (`eslint-plugin-react-refresh`)
- Prettier-Kompatibilität (`eslint-config-prettier`)

### Prettier
Konfiguriert in `.prettierrc`:
- Keine Semikolons
- Single Quotes
- 2 Spaces Einrückung
- 100 Zeichen Zeilenlänge

**Empfehlung:** Beide Tools sollten in der CI/CD Pipeline verwendet werden:
```bash
bun run lint && bun run format:check
```

---

## 📊 Programmabläufe (Flow Diagrams)

### Authentifizierung
- **JWT (JSON Web Tokens)** mit HS256-Algorithmus und 24h Ablaufzeit.
- Passwörter werden mit **Bun.password** (Argon2/bcrypt) sicher gehasht.
- Rate Limiting schützt Login (10/min) und Signup (5/min) vor Brute-Force.

### Eingabe-Validierung
- **Zod-Schemas** validieren alle API-Eingaben mit `@hono/zod-validator`.
- Strikte Typ-Validierung für Username, Passwort, Entry-Text und Datei-Uploads.

### SQL-Injection-Schutz ✅
- **Alle** Datenbankabfragen verwenden **Prepared Statements** mit `?`-Platzhaltern.
- Werte werden nie direkt in SQL-Strings konkateniert.
- Beispiel: `db.query('SELECT * FROM users WHERE username = ?').get(username)`

### Security Headers
Die `secureHeaders()` Middleware aktiviert:
- `X-XSS-Protection: 1; mode=block`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN` (Clickjacking-Schutz)
- `Strict-Transport-Security` (HSTS)
- `Referrer-Policy: strict-origin-when-cross-origin`

### Datei-Uploads
- Erlaubte MIME-Types: Bilder (JPG, PNG, GIF, WebP), PDF, TXT, CSV.
- Maximale Dateigröße: 5 MB.
- Dateien werden mit UUID umbenannt (verhindert Path-Traversal).
- User können nur eigene Dateien sehen/löschen.

---

## 🛠️ Development

Die folgenden Diagramme zeigen die wichtigsten Abläufe in der Anwendung.

### 🔐 Registrierung (Signup)

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant UI as 🖥️ AuthForm
    participant Hook as 🪝 useAuth
    participant API as 📡 api.ts
    participant Server as 🖧 Backend
    participant DB as 💾 SQLite

    User->>UI: Füllt Formular aus
    UI->>Hook: signup(username, password)
    Hook->>Hook: setLoading(true)
    Hook->>API: authApi.signup()
    API->>Server: POST /api/signup
    
    Note over Server: Rate Limit Check (5/min)
    
    Server->>Server: validateAuth()
    
    alt Validierung fehlgeschlagen
        Server-->>API: 400 { error }
        API-->>Hook: { error }
        Hook-->>UI: setError(message)
        UI-->>User: ❌ Zeigt Fehler
    end
    
    Server->>Server: Bun.password.hash()
    Server->>DB: INSERT INTO users
    
    alt Username existiert
        DB-->>Server: UNIQUE constraint error
        Server-->>API: 400 "User already exists"
        API-->>Hook: { error }
        Hook-->>UI: setError()
        UI-->>User: ❌ Zeigt Fehler
    end
    
    DB-->>Server: ✓ User erstellt
    Server-->>API: 200 { success: true }
    API-->>Hook: { success }
    Hook-->>UI: setError("Erfolgreich!")
    UI-->>User: ✅ Wechselt zu Login
```

### 🔑 Login

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant UI as 🖥️ AuthForm
    participant Hook as 🪝 useAuth
    participant API as 📡 api.ts
    participant Server as 🖧 Backend
    participant DB as 💾 SQLite
    participant Storage as 💾 LocalStorage

    User->>UI: Gibt Credentials ein
    UI->>Hook: login(username, password)
    Hook->>API: authApi.login()
    API->>Server: POST /api/login
    
    Note over Server: Rate Limit Check (10/min)
    
    Server->>Server: validateAuth()
    Server->>DB: SELECT * FROM users WHERE username = ?
    
    alt User nicht gefunden
        DB-->>Server: null
        Server-->>API: 401 "Invalid credentials"
        API-->>Hook: { error, status: 401 }
        Hook-->>UI: setError()
        UI-->>User: ❌ Zeigt Fehler
    end
    
    DB-->>Server: User { id, password_hash }
    Server->>Server: Bun.password.verify()
    
    alt Passwort falsch
        Server-->>API: 401 "Invalid credentials"
        API-->>Hook: { error }
        Hook-->>UI: setError()
        UI-->>User: ❌ Zeigt Fehler
    end
    
    Server->>Server: jwt.sign({ id, username }, secret)
    Server-->>API: 200 { token }
    API-->>Hook: { data: { token } }
    Hook->>Storage: tokenStorage.set(token)
    Hook->>Hook: setToken(token)
    Hook-->>UI: isAuthenticated = true
    UI-->>User: ✅ Zeigt Dashboard
```

### 🚪 Logout

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant UI as 🖥️ Button
    participant Hook as 🪝 useAuth
    participant Storage as 💾 LocalStorage
    participant Entries as 🪝 useEntries

    User->>UI: Klickt "Logout"
    UI->>Hook: logout()
    Hook->>Storage: tokenStorage.remove()
    Storage-->>Hook: ✓ Token gelöscht
    Hook->>Hook: setToken('')
    
    Note over Hook,Entries: Token ist leer →<br/>isAuthenticated = false
    
    Hook-->>UI: State Update
    UI-->>User: 🔄 Zeigt Login-Formular
    
    Note over User,Storage: Kein Server-Request nötig!<br/>JWT ist stateless - Token<br/>wird einfach verworfen.
```

### 📝 Eintrag erstellen

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant Form as 🖥️ EntryForm
    participant Hook as 🪝 useEntries
    participant API as 📡 api.ts
    participant Server as 🖧 Backend
    participant JWT as 🔐 JWT Middleware
    participant DB as 💾 SQLite

    User->>Form: Gibt Text ein, klickt "Senden"
    Form->>Form: Validiert (nicht leer)
    Form->>Hook: addEntry(text)
    Hook->>API: entriesApi.create(token, text)
    API->>Server: POST /api/entries<br/>Header: Authorization: Bearer {token}
    
    Server->>JWT: jwt({ secret, alg: 'HS256' })
    
    alt Token ungültig/abgelaufen
        JWT-->>Server: 401 Unauthorized
        Server-->>API: 401
        API-->>Hook: { status: 401 }
        Hook->>Hook: onUnauthorized() → logout()
        Hook-->>Form: Redirect zu Login
    end
    
    JWT-->>Server: payload { id, username }
    Server->>Server: validateEntryText(text)
    
    alt Text ungültig
        Server-->>API: 400 { error }
        API-->>Hook: { error }
        Hook-->>Form: setError()
        Form-->>User: ❌ Zeigt Fehler
    end
    
    Server->>DB: INSERT INTO entries (text, userId)
    DB-->>Server: ✓ Entry erstellt
    Server-->>API: 200 { success: true }
    API-->>Hook: { success }
    Hook->>Hook: fetchEntries() → Refresh
    Hook-->>Form: ✓ Success
    Form->>Form: setInputText('')
    Form-->>User: ✅ Neuer Eintrag sichtbar
```

### 📊 App-Start (Einträge laden)

```mermaid
sequenceDiagram
    participant Browser as 🌐 Browser
    participant App as 🖥️ App.tsx
    participant Auth as 🪝 useAuth
    participant Entries as 🪝 useEntries
    participant Storage as 💾 LocalStorage
    participant API as 📡 api.ts
    participant Server as 🖧 Backend

    Browser->>App: Lädt Seite
    App->>Auth: useAuth()
    Auth->>Storage: tokenStorage.get()
    
    alt Kein Token
        Storage-->>Auth: null
        Auth-->>App: isAuthenticated = false
        App-->>Browser: 🔐 Zeigt Login
    end
    
    Storage-->>Auth: token
    Auth->>Auth: setToken(token)
    Auth-->>App: isAuthenticated = true
    
    App->>Entries: useEntries(token, logout)
    
    Note over Entries: useEffect() bei<br/>Token-Änderung
    
    Entries->>API: entriesApi.getAll(token)
    API->>Server: GET /api/entries
    Server->>Server: JWT validieren
    Server->>Server: DB Query für userId
    Server-->>API: 200 [ entries... ]
    API-->>Entries: { data: entries }
    Entries->>Entries: setEntries(data)
    Entries-->>App: entries = [...]
    App-->>Browser: 📋 Zeigt Einträge
```

### 🏛️ Architektur-Übersicht

```mermaid
graph TB
    subgraph "🖥️ Frontend - React SPA"
        UI["📦 Components<br/>(Button, Card, AuthForm...)"]
        Hooks["🪝 Custom Hooks<br/>(useAuth, useEntries, useFiles)"]
        APIClient["📡 api.ts<br/>(Fetch Wrapper)"]
        Storage["💾 storage.ts<br/>(LocalStorage)"]
    end
    
    subgraph "🖧 Backend - Hono + Bun"
        Routes["🛤️ Routes<br/>(auth, entries, files, health)"]
        MW["🛡️ Middleware<br/>(JWT, RateLimit, SecureHeaders)"]
        Val["✅ Validation<br/>(Zod Schemas)"]
        Repo["📚 Repositories"]
        DB[("💾 SQLite")]
        FS[("📁 Filesystem<br/>/uploads")]
    end
    
    subgraph "📧 External Services"
        Resend["📨 Resend API<br/>(E-Mail Versand)"]
    end
    
    UI --> Hooks
    Hooks --> APIClient
    Hooks --> Storage
    APIClient -->|"HTTP/JSON"| Routes
    Routes --> MW
    Routes --> Val
    Routes --> Repo
    Routes -->|"Password Reset"| Resend
    Repo --> DB
    Routes -->|"File Storage"| FS
    
    style UI fill:#61dafb,color:#000
    style Hooks fill:#61dafb,color:#000
    style APIClient fill:#61dafb,color:#000
    style Storage fill:#61dafb,color:#000
    style Routes fill:#ff6b6b,color:#000
    style MW fill:#ff6b6b,color:#000
    style Val fill:#ff6b6b,color:#000
    style Repo fill:#ff6b6b,color:#000
    style DB fill:#ffd93d,color:#000
    style FS fill:#ffd93d,color:#000
    style Resend fill:#9333ea,color:#fff
```

### 📁 Datei-Upload

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant UI as 🖥️ FileUpload
    participant Hook as 🪝 useFiles
    participant API as 📡 api.ts
    participant Server as 🖧 Backend
    participant FS as 📁 Filesystem
    participant DB as 💾 SQLite

    User->>UI: Wählt Datei aus / Drag & Drop
    UI->>UI: Validiert Dateityp & Größe
    
    alt Validierung fehlgeschlagen
        UI-->>User: ❌ Zeigt Fehler (Typ/Größe)
    end
    
    UI->>Hook: uploadFile(file, description?)
    Hook->>Hook: setLoading(true)
    Hook->>API: filesApi.upload(token, file)
    
    Note over API: multipart/form-data
    
    API->>Server: POST /api/files
    Server->>Server: JWT validieren
    
    alt Token ungültig
        Server-->>API: 401 Unauthorized
        API-->>Hook: { status: 401 }
        Hook->>Hook: onUnauthorized()
        Hook-->>UI: Redirect zu Login
    end
    
    Server->>Server: MIME-Type prüfen
    Server->>Server: Dateigröße prüfen (max 5MB)
    
    alt Validierung fehlgeschlagen
        Server-->>API: 400 { error }
        API-->>Hook: { error }
        Hook-->>UI: setError()
        UI-->>User: ❌ Zeigt Fehler
    end
    
    Server->>Server: crypto.randomUUID()
    Server->>FS: mkdir uploads/{userId}
    Server->>FS: Bun.write({uuid}.ext)
    Server->>DB: INSERT INTO files (metadata)
    DB-->>Server: ✓ FileMetadata
    Server-->>API: 200 { success, file }
    API-->>Hook: { data }
    Hook->>Hook: fetchFiles() → Refresh
    Hook-->>UI: ✓ Success
    UI-->>User: ✅ Datei in Liste sichtbar
```

### 🔐 Passwort vergessen & zurücksetzen

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant UI as 🖥️ ForgotPasswordForm
    participant API as 📡 api.ts
    participant Server as 🖧 Backend
    participant DB as 💾 SQLite
    participant Resend as 📨 Resend API
    participant Email as 📧 E-Mail Client

    Note over User,Email: Phase 1: Passwort-Reset anfordern

    User->>UI: Gibt E-Mail ein
    UI->>API: authApi.forgotPassword(email)
    API->>Server: POST /api/forgot-password
    
    Note over Server: Rate Limit Check (3/min)
    
    Server->>Server: Zod-Validierung
    Server->>DB: SELECT * FROM users WHERE email = ?
    
    alt E-Mail nicht gefunden
        DB-->>Server: null
        Server-->>API: 200 { success, message }
        Note over Server: Keine Info preisgeben!
        API-->>UI: "Falls Konto existiert..."
        UI-->>User: ✅ Generische Erfolgsmeldung
    end
    
    DB-->>Server: User { id, username }
    Server->>Server: crypto.randomUUID()
    Server->>Server: expires = now + 1h
    Server->>DB: UPDATE users SET reset_token, reset_expires
    
    Server->>Server: generateResetEmail(url, username)
    Server->>Resend: POST /emails (HTML)
    Resend-->>Server: 200 OK
    
    Server-->>API: 200 { success, message }
    API-->>UI: "Falls Konto existiert..."
    UI-->>User: ✅ Generische Erfolgsmeldung
    
    Note over Resend,Email: E-Mail Zustellung
    Resend->>Email: Reset-Link E-Mail
    
    Note over User,Email: Phase 2: Passwort zurücksetzen

    Email->>User: Öffnet E-Mail
    User->>UI: Klickt Reset-Link
    
    Note over UI: ResetPasswordForm
    
    UI->>API: authApi.validateResetToken(token)
    API->>Server: GET /api/reset-password/{token}
    Server->>DB: SELECT * FROM users WHERE reset_token = ?
    
    alt Token ungültig/abgelaufen
        Server-->>API: 400 { valid: false }
        API-->>UI: { valid: false }
        UI-->>User: ❌ "Link abgelaufen"
    end
    
    Server-->>API: 200 { valid: true }
    API-->>UI: Token gültig
    UI-->>User: Zeigt Passwort-Formular
    
    User->>UI: Gibt neues Passwort ein
    UI->>API: authApi.resetPassword(token, password)
    API->>Server: POST /api/reset-password
    
    Server->>DB: SELECT * FROM users WHERE reset_token = ?
    Server->>Server: Prüfe reset_expires
    Server->>Server: Bun.password.hash(newPassword)
    Server->>DB: UPDATE users SET password = ?
    Server->>DB: UPDATE users SET reset_token = NULL
    
    Server-->>API: 200 { success, message }
    API-->>UI: "Passwort zurückgesetzt!"
    UI-->>User: ✅ Zum Login-Button
```

---

## �📜 Lizenz
MIT
