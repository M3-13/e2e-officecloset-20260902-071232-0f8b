# Glamouröser Kleiderschrank-Manager

Ein eleganter Kleiderschrank-Manager im Hollywood-Stil: Nutzer registrieren sich,
legen bebilderte Kleidungsstücke mit Kategorien an, durchstöbern ihre Garderobe
und kombinieren Einzelteile im Outfit-Creator zu gespeicherten Outfits – präsentiert
in einer Red-Carpet-Optik.

## Tech Stack

- **Backend**: Python, FastAPI
- **Datenbank**: SQLite (via SQLAlchemy)
- **Auth**: JWT (Bearer)
- **Frontend**: Vite + React
- **Bildablage**: lokales Dateisystem

## Installation

Voraussetzung: Python 3.13 oder neuer.

```bash
cd backend
python -m pip install -r requirements.txt
```

## Starten (Entwicklung)

Vor dem Start muss `JWT_SECRET` gesetzt sein (Signierschlüssel für JWTs). Werte
einmal erzeugen und über Neustarts hinweg beibehalten:

```bash
cd backend
export JWT_SECRET=$(python -c "import secrets; print(secrets.token_hex(32))")
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Alternativ alle Variablen aus der Vorlage `.env.example` übernehmen (dort
`JWT_SECRET` eintragen) und in der Shell exportieren.

Der Server läuft danach unter `http://localhost:8000`. Die Datenbank
(`dev.db`) und die Tabellen werden beim Start automatisch angelegt.

## Umgebungsvariablen

| Variable              | Standard            | Beschreibung                                        |
| --------------------- | ------------------- | --------------------------------------------------- |
| `DATABASE_URL`        | `sqlite:///./dev.db`| Verbindung zur SQLite-Datenbank                     |
| `JWT_SECRET`          | — (kein Standard)   | Signierschlüssel für JWTs (pro Start generiert)     |
| `JWT_EXPIRES_MINUTES` | `60`                | Gültigkeitsdauer eines Tokens in Minuten            |
| `UPLOAD_DIR`          | `uploads`           | Verzeichnis für hochgeladene Bilder                 |
| `MAX_IMAGE_SIZE`      | `5242880` (5 MB)    | Maximale Bildgröße in Bytes                         |
| `CORS_ORIGIN`         | `http://localhost:5173` | Erlaubte Frontend-Origin für CORS               |

`JWT_SECRET` hat bewusst keinen Standardwert: Der Start-Kontrakt (`RUN.json`)
erzeugt ihn pro Lauf als `generate`, und für den lokalen Start wird er im
Abschnitt oben aus der Shell gesetzt bzw. aus der Vorlage `.env.example`
übernommen. Er ist nie als Literal im Repository gespeichert.

## Endpunkte

| Methode | Pfad                     | Beschreibung                                  |
| ------- | ------------------------ | --------------------------------------------- |
| GET     | `/api/health`            | Health-Check, liefert `{"status": "ok"}`      |
| POST    | `/api/auth/register`     | Registrierung                                 |
| POST    | `/api/auth/login`        | Login, liefert ein JWT                        |
| DELETE  | `/api/auth/me`           | Account inkl. aller Daten löschen             |
| GET     | `/api/wardrobe/items`    | Kleidungsstücke der eigenen Garderobe auflisten |
| POST    | `/api/wardrobe/items`    | Kleidungsstück anlegen (multipart, inkl. Bild) |
| PATCH   | `/api/wardrobe/items/{id}` | Kleidungsstück bearbeiten                   |
| DELETE  | `/api/wardrobe/items/{id}` | Kleidungsstück löschen                      |
| GET     | `/api/outfits`           | Eigene Outfits auflisten                       |
| POST    | `/api/outfits`           | Outfit anlegen                                |
| GET     | `/api/outfits/{id}`      | Einzelnes Outfit laden                        |
| PATCH   | `/api/outfits/{id}`      | Outfit bearbeiten                             |
| DELETE  | `/api/outfits/{id}`      | Outfit löschen                                |
| GET     | `/uploads/{filename}`    | Hochgeladene Bilder (ohne Auth)               |

Alle Endpunkte außer `/api/health`, `/api/auth/register`, `/api/auth/login` und
`/uploads/*` verlangen einen gültigen `Authorization: Bearer <JWT>`-Header.

## Tests

```bash
cd backend
python -m pytest
```
