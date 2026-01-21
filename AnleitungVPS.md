# 🚀 VPS Deployment Guide: Neue Projekte hinzufügen

Diese Anleitung beschreibt die Schritte, um ein neues Bun + Hono Projekt auf deinem VPS (85.214.10.44) zu veröffentlichen.

## 📋 Voraussetzungen im Code

Stelle sicher, dass dein Hono-Server auf `0.0.0.0` läuft und den Port aus der Umgebungsvariable liest:

```typescript
const port = process.env. PORT ? parseInt(process.env. PORT) : 3000;

export default {
  port: port,
  hostname: '0.0.0.0',
  fetch: app.fetch,
  websocket,
}
```

## 1. DNS: Subdomain erstellen (IONOS)

1. Logge dich bei IONOS ein.
2. Gehe zu **Domains & SSL** -> Wähle deine Domain -> **DNS**.
3. Klicke auf **Record hinzufügen**.
   - **Typ:** A
   - **Hostname:** Deine Subdomain (z.B. `projekt3`)
   - **Wert (IPv4):** `85.214.10.44`
   - **TTL:** 3600
4. Speichern. 

## 2. Projekt-Dateien hochladen

### Dateien vom Chromebook hochladen: 

Führe lokal in deinem Projekt-Ordner den Build aus:

```bash
bun run build:frontend
```

Übertrage dann die Ordner `backend` und `dist` (Inhalt des Frontends):

```bash
rsync -avz ./backend/ root@85.214.10.44:/var/www/projekt3/backend/
rsync -avz ./dist/ root@85.214.10.44:/var/www/projekt3/dist/
```

### Abhängigkeiten auf dem VPS installieren:

```bash
cd /var/www/projekt3/backend
bun install --production
```

## 3. Dienst: Systemd Service erstellen

Jedes Projekt benötigt einen eigenen Dienst und einen einzigartigen Port (z.B. 3000, 8080, 8081, 8082...).

### Erstelle die Service-Datei:

```bash
sudo nano /etc/systemd/system/projekt3.service
```

### Füge diesen Inhalt ein (Port und Namen anpassen):

```ini
[Unit]
Description=Hono App Projekt 3
After=network. target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/projekt3/backend
ExecStart=/root/.bun/bin/bun run index.ts
Restart=always
Environment=PORT=8081
Environment=JWT_SECRET=dein_geheimes_passwort

[Install]
WantedBy=multi-user.target
```

### Dienst aktivieren und starten: 

```bash
sudo systemctl daemon-reload
sudo systemctl enable projekt3
sudo systemctl start projekt3
```

## 4. Webserver: Caddyfile anpassen

### Öffne das Caddyfile:

```bash
sudo nano /etc/caddy/Caddyfile
```

### Füge den neuen Host-Block hinzu:

```
projekt3.k1rk.de {
    reverse_proxy localhost: 8081
}
```

### Caddy neu laden:

```bash
sudo systemctl reload caddy
```

## 🔍 Kontrolle

- **Status der App:** `systemctl status projekt3`
- **Ports prüfen:** `sudo ss -tulpn | grep LISTEN`
- **Logs einsehen:** `journalctl -u projekt3 -f`

## 💡 Port-Übersicht (Beispiel)

| Projekt | Domain | Port | Service |
|---------|--------|------|---------|
| Hauptseite | k1rk.de | 3000 | hauptseite |
| Projekt 1 | projekt1.k1rk.de | 8080 | projekt1 |
| Projekt 2 | projekt2.k1rk.de | 8081 | projekt2 |
| Projekt 3 | projekt3.k1rk.de | 8082 | projekt3 |
