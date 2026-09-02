VERDICT: CHANGES_REQUESTED

## Sicherheitsprüfung: Glamouröser Kleiderschrank-Manager

### Zusammenfassung

Die Grundarchitektur ist solide: Passwörter werden mit bcrypt gehasht, JWTs werden mit festem HS256-Algorithmus signiert, SQLAlchemy-ORM verhindert SQL-Injection, und hochgeladene Bilddateien erhalten einen serverseitig erzeugten UUID-Dateinamen ohne Nutzereingabe. Es wurden keine harten Secrets im Code gefunden.

Allerdings bestehen mehrere mittlere bis niedrige Sicherheits- und Datenschutzlücken: Das Ratenlimit für Registrierung/Login fehlt, die im Frontend angebotene Account-Löschung besitzt keinen Backend-Endpunkt, hochgeladene Bilder sind öffentlich abrufbar, und die Passwortrichtlinie ist sehr schwach. Die statischen Scanner bandit und semgrep wurden übersprungen; pip-audit/npm audit liegen nicht vor. Daher ist die Abhängigkeitslage aus dem Review nicht bewertbar.

---

## Befunde

### F1 — Fehlendes Ratenlimit für Registrierung und Login (AC-12)
- **Schweregrad:** mittel
- **Betroffene Stellen:** `backend/app/routers/auth.py`, `backend/app/main.py`
- **Problem:** `/api/auth/register` und `/api/auth/login` besitzen keinerlei Brute-Force- oder Flooding-Schutz. Ein Client kann unbegrenzt Login-Versuche und Registrierungen durchführen. Die AC-12 ist damit nicht erfüllt.
- **Konkrete Lösung:** Eine IP-basierte Ratenbegrenzung für beide Endpunkte implementieren, z. B. über SlowAPI oder eine schlanke Middleware, die pro Client maximal 10 Anfragen pro Minute zulässt und bei Überschreitung `429 Too Many Requests` liefert. `request.client.host` ist nur direkt vertrauenswürdig, wenn die Anwendung ohne Proxy betrieben wird; hinter einem Reverse Proxy sollte `X-Forwarded-For` nur aus vertrauenswürdigen Quellen ausgewertet werden. Für Tests sollte die Begrenzung konfigurierbar/abschaltbar sein.

---

### F2 — Account-Löschung ist frontendseitig angebunden, aber im Backend nicht vorhanden (AC-17)
- **Schweregrad:** mittel
- **Betroffene Stellen:** `frontend/src/pages/Account.tsx`, `frontend/src/api/account.ts`, `backend/app/routers/auth.py`
- **Problem:** Das Frontend ruft `DELETE /api/auth/me` auf. Im Backend existiert dieser Endpunkt nicht. Die Datenschutzfunktion „Account löschen“ ist damit nicht funktionsfähig und AC-17 nicht erfüllt; Nutzer können ihre personenbezogenen Daten nicht selbst löschen.
- **Konkrete Lösung:** Im Auth-Router einen authentifizierten `DELETE /api/auth/me`-Endpunkt implementieren. Er muss den aktuellen Nutzer aus dem JWT ermitteln, alle zugehörigen Kleidungsstücke inklusive Bilddateien und Outfits löschen und anschließend den Nutzerdatensatz entfernen. Die Löschung sollte transaktional sauber sein: erst Datenbank-Referenzen löschen, dann Bilddateien entfernen und den Nutzer erst nach erfolgreicher Datei-Löschung endgültig löschen.

---

### F3 — Hochgeladene Bilder sind öffentlich ohne Authentifizierung abrufbar
- **Schweregrad:** mittel
- **Betroffene Stellen:** `backend/app/main.py`, `backend/app/routers/wardrobe.py`, `backend/app/models.py`, `backend/app/services/images.py`
- **Problem:** `/uploads` wird per `StaticFiles` öffentlich gemountet. Die Bilddateien sind damit ohne JWT erreichbar, sobald die URL bekannt ist. Die UUID-Dateinamen sind schwer erratbar, aber es existiert keinerlei serverseitige Eigentümerprüfung für Bildabrufe. Das ist nicht konform zur AC-14, wonach Endpunkte mit Geschäftsdaten ein gültiges JWT verlangen.
- **Konkrete Lösung:** Die Uploads nicht länger direkt statisch ausliefern. Stattdessen einen geschützten Endpunkt schaffen, z. B. `GET /api/wardrobe/items/{item_id}/image`, der das JWT prüft und serverseitig sicherstellt, dass das Bild dem authentifizierten Nutzer gehört. Das Frontend muss dann Bilder über einen authentifizierten Fetch laden und als Objekt-URL darstellen. Alternativ sind kurzlebige signierte URLs denkbar, wobei auch hier die Frontend-Anbindung entsprechend angepasst werden muss, ohne die Produktfunktion zu brechen.

---

### F4 — Zu schwache Passwortrichtlinie
- **Schweregrad:** niedrig
- **Betroffene Stelle:** `backend/app/schemas.py`
- **Problem:** `UserCreate.password` erlaubt beliebige Strings, einschließlich leerer und sehr kurzer Passwörter. Das erleichtert Passwort-Gröbversuche und schwächt die Authentifizierung insgesamt.
- **Konkrete Lösung:** Pydantic `Field(min_length=8, max_length=128)` oder eine vergleichbare serverseitige Validierung einführen. Das Frontend sollte weiterhin die vorhandenen `required`-Attribute behalten; die serverseitige Prüfung ist die maßgebliche.

---

### F5 — User-Enumeration über Registrierung und Login
- **Schweregrad:** niedrig
- **Betroffene Stelle:** `backend/app/routers/auth.py`
- **Problem:** Die Registrierung antwortet bei einer bereits vorhandenen E-Mail mit `409 Email already registered`, der Login antwortet bei falscher E-Mail/Passwort mit `401 Incorrect email or password`. Zusammen mit fehlendem Ratenlimit lässt sich leicht feststellen, welche E-Mail-Adressen registriert sind.
- **Konkrete Lösung:** Vor allem das Ratenlimit aus F1 umsetzen. Zusätzlich können die Meldungen vereinheitlicht werden, z. B. bei Registrierungskonflikten eine generische Bestätigung senden und beim Login generisch „E-Mail oder Passwort falsch“ verwenden. Entsprechende Tests müssen angepasst werden.

---

### F6 — Unbegrenzte `item_ids`-Listen bei Outfits
- **Schweregrad:** niedrig
- **Betroffene Stellen:** `backend/app/schemas.py`, `backend/app/routers/outfits.py`
- **Problem:** `OutfitCreate.item_ids` und `OutfitUpdate.item_ids` nehmen beliebig lange Listen an, auch leere Listen. Eine sehr große Liste kann zu einer unnötig großen SQL-`IN`-Query und potenziell zu DoS-/Serverfehlern führen.
- **Konkrete Lösung:** In den Pydantic-Schemas `min_length=1` und eine realistische `max_length` (z. B. 100) setzen. Leere Outfits sind fachlich nicht erwünscht und sollten mit `400` abgelehnt werden.

---

### F7 — Speicherlimit greift bei fehlendem `Content-Length` erst nach dem vollständigen Lesen
- **Schweregrad:** niedrig
- **Betroffene Stelle:** `backend/app/services/images.py`
- **Problem:** `validate_content_length` prüft nur den deklarierten `Content-Length`-Header. Bei Chunked-Transfer oder fehlendem Header wird der gesamte Request-Body erst in `save_image` per `await file.read()` gelesen und dann geprüft. Ein großer Body kann dadurch unnötig Speicher belegen.
- **Konkrete Lösung:** Zusätzlich auf Server-Ebene ein maximales Request-Body-Limit setzen (z. B. Uvicorn `--limit-max-request-size`) und/oder `UploadFile` in gestreamten Blöcken mit sofortiger Größenkontrolle lesen. Die bestehende AC-11-Prüfung über `Content-Length` ist korrekt, sollte aber durch eine serverseitige Gesamtbegrenzung ergänzt werden.

---

### F8 — JWT im `localStorage` speichert Token dauerhaft
- **Schweregrad:** niedrig
- **Betroffene Stellen:** `frontend/src/context/AuthContext.tsx`, `frontend/src/api/client.ts`
- **Problem:** Das JWT wird im `localStorage` abgelegt. Sollte künftig eine XSS-Lücke im Frontend bestehen, kann der Token leicht ausgelesen werden.
- **Konkrete Lösung:** Langfristig auf ein HttpOnly-Cookie mit `SameSite=Strict` und passendem CSRF-Schutz umstellen. Kurzfristig mindestens sicherstellen, dass keine ungeprüften Inhalte per `innerHTML` gerendert werden; aktuell ist keine XSS-Stelle sichtbar.

---

## Scanner-Lücken

- **bandit:** `[skipped]` — keine Python-SAST-Ergebnisse.
- **semgrep:** `[skipped]` — keine Multi-Language-SAST-Ergebnisse.
- **pip-audit / npm audit:** keine Ergebnisse vorgelegt.

Das ist kein Befund gegen den Code, aber die tatsächliche Verwundbarkeit der Abhängigkeiten in `backend/requirements.txt` und `frontend/package-lock.json` ist damit ungeprüft.

---

## Positivbefunde

- Keine hartkodierten Secrets oder Passwörter im sichtbaren Code; `JWT_SECRET` wird aus der Umgebung gelesen und hat keinen Produktiv-Literalwert.
- bcrypt wird für Passwort-Hashing verwendet; JWT wird mit fixem `HS256` signiert.
- SQLAlchemy-ORM wird konsistent verwendet; keine sichtbaren SQL-Injection-Stellen.
- Bilddateinamen werden serverseitig als UUID erzeugt; keine Pfadübergabe aus Nutzereingaben an `os.path.join`.
- CORS ist auf eine konkrete Origin begrenzt und erlaubt Credentials nur bei exakter Übereinstimmung.
- Die Besitzprüfung für Kleidungsstücke und Outfits ist serverseitig umgesetzt; fremde und nicht vorhandene IDs werden einheitlich mit `404` beantwortet.
- Die Content-Length-Prüfung für Bild-Uploads ist als Dependency vor dem Lesen des Bodys verdrahtet.
- Das Frontend lädt keine externen Ressourcen; Datenschutz und Impressum sind verlinkt.

---

## Empfehlung

Die mittleren Befunde F1, F2 und F3 sollten vor Freigabe an den Kunden behoben werden. Sie verletzen ausdrückliche Sicherheits-/Datenschutz-Akzeptanzkriterien und sind mit vertretbarem Aufwand schließbar.