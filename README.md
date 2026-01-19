# ⚡ Low-RAM Fullstack Stack (Bun + Hono + React + SQLite)

Ein extrem ressourceneffizientes Web-App-Template, optimiert für den Betrieb auf schwachen VPS (Virtual Private Servern) mit minimalem RAM-Verbrauch (< 100MB im Idle).

## 🚀 Technologie-Stack

### Backend
- **Runtime:** [Bun](https://bun.sh/) - Extrem schneller JavaScript-All-in-One-Runtime.
- **Framework:** [Hono](https://hono.dev/) - Ultrafast, web-standardsbasiertes Framework.
- **Database:** `bun:sqlite` - Native SQLite-Anbindung ohne schwere ORMs oder externe Prozesse.
- **Auth:** `hono/jwt` Middleware & `Bun.password` für sicheres Argon2/bcrypt Hashing.

### Frontend
- **Framework:** [React 19](https://react.dev/) (SPA) - Als statische Dateien serviert.
- **Build-Tool:** [Vite](https://vitejs.dev/) - Schnelle Development-Experience und optimierte Builds.
- **PWA:** [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) - Offline-Support und Installierbarkeit.
- **CSS:** [Tailwind CSS v4](https://tailwindcss.com/) - Modernstes CSS-Framework ohne Runtime-Overhead.

---

## 🏗️ Architektur

Das Projekt ist in eine klare Trennung von Frontend und Backend unterteilt, wobei das Backend zur Produktionszeit als Single-Server fungiert:

- **`/frontend`**: Der Quellcode der React-App. Während der Entwicklung läuft hier Vite als Dev-Server.
- **`/backend`**: Die API-Logik und DB-Anbindung.
- **`/dist`**: Der Build-Output des Frontends. Das Backend serviert diesen Ordner statisch auf der Root-Route (`/`).

### 📱 PWA Features
- **Offline-Caching**: Assets werden über Workbox gecacht.
- **Smart Updates**: Service Worker (`sw.js`) wird vom Backend mit `Cache-Control: no-cache` serviert, um sofortige Updates zu ermöglichen.
- **SPA Fallback**: Das Backend leitet alle Navigationsanfragen (Deep Links) auf die `index.html` um, damit clientseitiges Routing offline funktioniert.

**Vorteile dieser Architektur:**
- **Zero-Downtime DB:** SQLite ist eine Datei, kein extra Dienst, der abstürzen kann.
- **Minimaler Footprint:** Bun kombiniert HTTP-Server, Paketmanager und Runtime in einer Binärdatei.
- **CPU-Effizienz:** Kein Server-Side-Rendering (SSR). Die CPU des VPS wird nur für API-Logik und Datei-Serving genutzt.

---

## 🛠️ Lokale Entwicklung

### Voraussetzungen
Stelle sicher, dass [Bun](https://bun.sh/) auf deinem System installiert ist.

### Setup
1. Repository klonen.
2. Abhängigkeiten installieren:
   ```bash
   # Im Root-Verzeichnis
   cd frontend && bun install
   cd ../backend && bun install
   ```

### Dev-Server starten
Nutze das zentrale Skript im Root-Verzeichnis:
```bash
# Im Root-Verzeichnis
bun run dev
```
- **Frontend:** `http://localhost:5173` (Vite mit Proxy zu API)
- **Backend:** `http://localhost:3000` (Hono API)

---

## 🚢 Deployment (VPS)

Dieses Projekt ist darauf ausgelegt, mit minimalem Aufwand auf einem Linux-Server zu laufen.

### 1. Build erstellen
Lokal ausführen:
```bash
cd frontend
bun run build
```
Dies erstellt den `/dist` Ordner im Root-Verzeichnis.

### 2. Dateien übertragen
Du musst **nur** folgende Ordner/Dateien auf deinen VPS kopieren (z.B. via SCP oder Git):
- `/backend` (enthält die Logic)
- `/dist` (enthält das fertige Frontend)
- `package.json` (im Root, falls du zentrale Scripte nutzt)

### 3. Server starten
Auf dem VPS im `backend`-Ordner:
```bash
cd backend
bun install --production
bun run index.ts
```
*Empfehlung: Nutze `pm2` oder ein `systemd` Service-File, um den Prozess im Hintergrund am Laufen zu halten.*

---

## 📊 Vor- und Nachteile

### Vorteile
1. **Performance:** Bun startet in Millisekunden. SQLite-Abfragen sind durch In-Memory-Caching von Bun extrem schnell.
2. **Kosten:** Läuft stabil auf dem kleinsten $2-4 VPS von Hetzner, DigitalOcean oder Netcup.
3. **Einfachheit:** Kein Docker-Zwang, kein komplexes Setup von Datenbank-Clustern notwendig.

### Nachteile
1. **Vertikale Skalierung:** SQLite ist für sehr hohen Schreibzugriff (Tausende pro Sekunde) weniger geeignet als Postgres (wobei WAL-Mode hier viel hilft).
2. **Persistence:** Da die DB eine Datei ist, müssen Backups (Snapshots der `.sqlite`-Datei) selbst verwaltet werden.

---

## 🔒 Sicherheit
- Die App nutzt **JWT (JSON Web Tokens)** zur Authentifizierung.
- Passwörter werden niemals im Klartext gespeichert, sondern mit dem nativen **Bun Password Hashing** (stark gesalzen) verarbeitet.
- API-Routen unter `/api/entries/*` sind durch eine Middleware geschützt.

---

## 📜 Lizenz
MIT
