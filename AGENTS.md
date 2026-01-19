# 🤖 AGENTS.md - Automatisierung & Coding-Agents

Dieses Dokument definiert die Regeln und Best Practices für KI-Coding-Agents, die an diesem Projekt arbeiten. Da das Projekt auf **maximale Performance bei minimalem Ressourcenverbrauch** optimiert ist, müssen Agents diese Richtlinien strikt befolgen.

## 🎯 Kernphilosophie
1. **Minimalismus:** Keine schweren Bibliotheken (ORMs, UI-Kits wie MUI/Chakra).
2. **Native First:** Nutze Bun-Build-ins (z.B. `bun:sqlite`, `Bun.password`) statt externer NPM-Pakete, wo möglich.
3. **Explizität:** Alle API-Antworten müssen klare Statuscodes liefern.
4. **Single-Source-of-Truth:** Das Backend serviert das Frontend.

## 🛠 Technologie-Stack für Agents
- **Runtime:** Bun (nutze `bun install`, `bun run dev`, `bun x`)
- **Backend:** Hono (Middleware-basiert)
- **Frontend:** React 19 SPA (Vite + Tailwind v4 + PWA Support)
- **DB:** SQLite via `bun:sqlite`

---

## 🏗 Projekt-Struktur & Konventionen

### 📂 Ordnerstruktur
- `/backend/index.ts`: Zentraler Einstiegspunkt. API-Routen unter `/api/*`. Static Serving am Ende der Datei.
- `/frontend/src/App.tsx`: Hauptkomponente. Halte sie modular, aber übersichtlich.
- `/dist`: Build-Artefakte. Dieser Ordner wird niemals manuell editiert.
- `/package.json` (Root): Enthält die Orchestrierungsscripts (`dev`, `build:frontend`).

### 🔑 Authentifizierung (JWT)
Agents müssen sicherstellen, dass:
- `HS256` als Algorithmus explizit gesetzt ist (in `sign` und `jwt`-Middleware).
- Der `Authorization: Bearer <token>` Header im Frontend bei jedem API-Request an `/api/entries/*` korrekt gesetzt wird.
- Passwörter immer mit `Bun.password.hash()` verarbeitet werden.

### 📱 PWA & Service Worker
Agents müssen sicherstellen, dass:
- Die `sw.js` im Backend mit `Cache-Control: no-cache` (oder ähnlichen Headern zur Deaktivierung des Browser-Caches) serviert wird.
- API-Routen (`/api/*`) niemals vom Service Worker gecacht werden (Nutze `NetworkOnly` Strategie).
- Navigations-Requests (Deep Links) im Backend auf die `index.html` zurückgefallen werden (SPA-Fallback).

---

## 📜 Workflow-Anweisungen für Agents

### 1. Datenbank-Migrationen
Bei Änderungen am Schema (in `index.ts`):
- Weise den User darauf hin, die `data.sqlite` zu löschen, falls Spalten hinzugefügt wurden.
- Nutze `CREATE TABLE IF NOT EXISTS`.

### 2. Frontend-Builds
Nach Änderungen am Frontend-Quellcode:
- Führe `bun run build:frontend` aus dem Root aus, um sicherzustellen, dass das Backend im Produktionsmodus die neuesten Änderungen serviert.

### 3. Port-Management
Falls der Agent Fehler wie `EADDRINUSE` sieht:
- Nutze `fuser -k 3000/tcp` um blockierte Ports freizugeben.
- Standard-Backend-Port: `3000`.
- Standard-Frontend-Port: `5173`.

---

## 🚀 Performance-Checkliste
- [ ] Keine unnötigen `node_modules` im Backend.
- [ ] Tailwind-Klassen statt inline Styles.
- [ ] Keine schweren Validierungs-Bibliotheken (nutze Hono-Middleware oder einfache Logic).
- [ ] SQLite-Statements als Prepared Statements (via `db.query()`).

---

## ⚠️ Bekannte Fallstricke
- **JWT Errors:** Immer `alg: 'HS256'` in `jwt({...})` und `sign({...})` angeben.
- **Vite Proxy:** Die `vite.config.ts` muss den Proxy auf Port 3000 halten.
- **SPA Routing:** Das Backend muss ein Catch-all für die `index.html` haben, damit Client-Side-Routing funktioniert.
