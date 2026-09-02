VERDICT: CHANGES_REQUESTED

## Structured Compliance-Report — Glamouröser Kleiderschrank-Manager

### 1. DSGVO

#### 1.1 Kritisch — Account-Löschung im Backend nicht implementiert
- **Befund:** Das Frontend bietet unter `/account` eine Account-Löschung an (`frontend/src/pages/Account.tsx`) und ruft `DELETE /api/auth/me` auf (`frontend/src/api/account.ts`). Im Backend existiert dieser Endpunkt nicht: `backend/app/routers/auth.py` enthält nur `POST /register` und `POST /login`. Gleichzeitig verspricht die Datenschutzerklärung (`frontend/src/pages/Datenschutz.tsx`, Abschnitte 4 und 5), dass bei Account-Löschung Profil, Kleidungsstücke, Bilddateien und Outfits dauerhaft gelöscht werden. Dieses Versprechen ist nicht umgesetzt. Damit fehlt das in Art. 17 DSGVO garantierte Löschrecht funktional.
- **Abhilfe:** In `backend/app/routers/auth.py` einen authentifizierten Endpunkt `DELETE /api/auth/me` ergänzen, der den `User` inklusive der kaskadierend verknüpften Kleidungsstücke und Outfits löscht. Zuvor müssen die zugehörigen Bilddateien über `images.delete_image_file()` entfernt werden. Wichtig: Die Transaktion erst committen, wenn alle Bilddateien erfolgreich gelöscht wurden; andernfalls in einen konsistenten Zustand zurückrollen.

#### 1.2 Kritisch — Bilddateien sind ohne Authentifizierung abrufbar
- **Befund:** `backend/app/main.py` mountet `app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")`. Jede Bilddatei ist dadurch ohne JWT abrufbar, sobald die UUID-Dateinamen bekannt sind. Kleidungsfotos können personenbeziehbar sein (z. B. Person auf dem Bild, Rückschlüsse auf Identität/Wohnung). Es fehlt damit eine Zugriffskontrolle für personenbezogene Bilddaten.
- **Abhilfe:** Die statische Auslieferung durch einen authentifizierten, nutzerbezogenen Bild-Endpunkt ersetzen, z. B. `GET /api/wardrobe/items/{item_id}/image`, der `get_current_user` und die Eigentumsprüfung nutzt. Da `<img src="{image_url}">` im Frontend keinen Bearer-Header sendet, muss die Lösung funktionserhaltend sein: z. B. signierte, kurzlebige URL-Tokens als Query-Parameter, die der Server pro Bild ausstellt, oder die Authentifizierung zusätzlich als HttpOnly-Cookie etablieren. Betroffene Stellen: `frontend/src/pages/Wardrobe.tsx`, `frontend/src/pages/Outfits.tsx`, `frontend/src/components/OutfitCreator.tsx`, `backend/app/models.py` (`image_url`).

#### 1.3 Hoch — Nutzer-Enumeration bei der Registrierung
- **Befund:** `backend/app/routers/auth.py` antwortet bei bereits registrierter E-Mail mit `409 Conflict` und der Meldung `"Email already registered"`. Dadurch kann systematisch abgefragt werden, ob eine bestimmte E-Mail-Adresse ein Konto hat. Dies betrifft personenbezogene Daten Dritter.
- **Abhilfe:** Entweder eine neutrale Antwort verwenden (z. B. 201 mit Hinweis „Falls die Adresse bereits registriert ist, …“) oder die Enumeration durch strikte Ratenbegrenzung und Monitoring erschweren. Zusätzlich sollte der Login-Fall konsistent bleiben, was bereits der Fall ist.

#### 1.4 Mittel — Keine Auskunfts- und Exportfunktion
- **Befund:** Die Datenschutzerklärung nennt ausdrücklich das Recht auf Auskunft und Datenübertragbarkeit. Ein entsprechender Endpunkt oder eine UI-Funktion fehlt jedoch. Nutzer können ihre Daten nur durch die normale Oberfläche einsehen, erhalten aber keinen exportierbaren Datensatz.
- **Abhilfe:** Authentifizierten Endpunkt `GET /api/auth/me/export` ergänzen, der Accountdaten, Kleidungsstücke und Outfits in einem strukturierten Format (z. B. JSON) zurückgibt, ausgelöst über die Account-Seite (`frontend/src/pages/Account.tsx`).

#### 1.5 Mittel — Passwortrichtlinien
- **Befund:** `backend/app/schemas.py`, `UserCreate.password` ist ein reiner `str` ohne Mindestlänge. Kombiniert mit dem fehlenden Rate Limiting entsteht ein erhöhtes Risiko für Account-Übernahmen.
- **Abhilfe:** In `UserCreate.password` eine Mindestlänge (`min_length`) und ggf. eine Komplexitätsregel ergänzen. Ergänzend im Frontend (`Login.tsx`, `Register.tsx`) einen Hinweis auf die Passwortanforderungen anzeigen.

#### 1.6 Niedrig — Keine Änderung von E-Mail und Passwort
- **Befund:** Es existiert keine Funktion, die eigene E-Mail-Adresse oder das Passwort zu ändern. Das Recht auf Berichtigung (Art. 16 DSGVO) ist damit für die Account-Stammdaten nicht umgesetzt.
- **Abhilfe:** Authentifizierten `PATCH /api/auth/me` für E-Mail und Passwort ergänzen und in `frontend/src/pages/Account.tsx` eine Bearbeitungsfunktion anbieten.

#### 1.7 Positiv — Erfüllte Punkte
- Passwörter werden mit bcrypt gehasht; keine Klartext-Speicherung (`backend/app/core/security.py`).
- Der JWT-Secret ist kein Literal im Repository (`backend/app/core/config.py`, `backend/app/core/security.py`).
- Datenminimierung bei Bild-Uploads: MIME-Validierung, Pillow-Dekodierung, Downscaling, UUID-Dateinamen (`backend/app/services/images.py`).
- Keine sichtbare Protokollierung von Passwörtern, E-Mails oder Token-Inhalten.
- Eigentumsprüfungen für Kleidungsstücke und Outfits sind serverseitig vorhanden (`backend/app/routers/wardrobe.py`, `backend/app/routers/outfits.py`).

---

### 2. EU Cyber Resilience Act (CRA) / IT-Sicherheit

#### 2.1 Mittel — Keine Ratenbegrenzung auf Login und Registrierung
- **Befund:** AC-12 verlangt Ratenbegrenzung pro Client. Im sichtbaren Code fehlt jede Implementierung. Dies betrifft sowohl den Schutz vor Brute-Force-Angriffen als auch die in § 1.3 genannte User-Enumeration.
- **Abhilfe:** Middleware oder Dependency einführen, z. B. mit `slowapi`, die pro IP zählt und ab 10 Anfragen/Minute Status `429` liefert. Konkret in `backend/app/main.py` registrieren und auf `/api/auth/register` und `/api/auth/login` anwenden.

#### 2.2 Mittel — Fehlende dokumentierte SBOM- und Sicherheitsdokumentation
- **Befund:** Für ein Produkt mit digitalen Elementen fehlen eine sichtbare SBOM sowie dokumentierte Sicherheitsarchitektur und Schwachstellenmanagementprozesse. Vorhanden sind `backend/requirements.txt` und `frontend/package-lock.json`; diese sind jedoch keine formale SBOM und keine Sicherheitsdokumentation.
- **Abhilfe:** `SECURITY.md` ergänzen mit Sicherheitsannahmen, Patch-/Update-Prozess und Zuständigkeiten. Außerdem eine `SBOM.md` oder ein maschinenlesbares SBOM-Format (z. B. CycloneDX/SPDX) für Backend- und Frontend-Abhängigkeiten pflegen.

#### 2.3 Mittel — Fehlende Security-Header
- **Befund:** Die FastAPI-Anwendung setzt keine `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy` oder `X-Frame-Options`. Das erhöht das XSS-/Clickjacking-Risiko und die Angriffsfläche für den im localStorage gespeicherten JWT.
- **Abhilfe:** Middleware in `backend/app/main.py` hinzufügen, die diese Header setzt. Die CSP muss mit den lokalen Ressourcen vereinbar sein; sie darf die eigenen lokalen Vite-/Upload-Ressourcen nicht blockieren.

#### 2.4 Mittel — JWT im localStorage
- **Befund:** Der Token wird im `localStorage` aufbewahrt und per `Authorization`-Header gesendet (`frontend/src/api/client.ts`, `frontend/src/context/AuthContext.tsx`). Bei einer erfolgreichen XSS-Attacke kann der Token entwendet werden. Ohne CSP ist dieses Risiko erhöht.
- **Abhilfe:** Zusammen mit 2.3 eine CSP umsetzen. Optional auf HttpOnly-Cookie-Authentifizierung mit CSRF-Schutz umstellen; falls der localStorage-Ansatz beibehalten wird, ist eine strikte CSP essenziell.

#### 2.5 Niedrig — Keine TLS-Erzwingung im Code
- **Befund:** Die Datenschutzerklärung spricht von „verschlüsselter Verbindung“. Im sichtbaren Code gibt es keine TLS-Konfiguration, keinen Redirect und kein HSTS. Dies ist deploymentabhängig.
- **Abhilfe:** In der Deployment-Dokumentation (`README.md` oder `DESIGN.md`) TLS als verbindlich definieren. HSTS-Handler im Backend ergänzen bzw. im Reverse Proxy konfigurieren. Die Datenschutzerklärung erst nach tatsächlicher TLS-Aktivierung so formulieren.

---

### 3. EU AI Act

- **Befund:** Kein KI-Feature ist im Code oder der Spec sichtbar. Der AI Act ist daher derzeit nicht anwendbar.
- **Abhilfe:** Entfällt. Falls später z. B. eine Stilberatung oder Bildklassifikation ergänzt wird, ist eine Risikobewertung nach Art. 6 AI Act durchzuführen.

---

### 4. Pflichttexte & UI

#### 4.1 Hoch — Impressum mit Platzhalterdaten
- **Befund:** `frontend/src/pages/Impressum.tsx` enthält offensichtlich unrichtige Pflichtangaben: `Musterstraße 1, 12345 Musterstadt`, `Max Mustermann`, `Amtsgericht Musterstadt`, `HRB 12345`, `kontakt@kleiderschrank.example`. Diese Angaben erfüllen § 5 DDG nicht und sind irreführend.
- **Abhilfe:** Die tatsächliche ladungsfähige Anschrift, die vertretungsberechtigte Person, echte Kontaktdaten, Registergericht und Registernummer einsetzen. Solange diese Daten nicht vorliegen, darf das Produkt nicht öffentlich in Verkehr gebracht werden.

#### 4.2 Mittel — AGB/Nutzungsbedingungen fehlen
- **Befund:** Für registrierungspflichtige Web-Anwendungen sind Nutzungsbedingungen regelmäßig erforderlich, insbesondere um Nutzungsrechte, Haftung und Kontosperrung zu regeln. Aktuell existieren nur Impressum und Datenschutzerklärung.
- **Abhilfe:** Seite `frontend/src/pages/Terms.tsx` mit AGB erstellen, in `App.tsx` routen und im Footer verlinken (`frontend/src/components/Footer.tsx`).

#### 4.3 Mittel — Datenschutzerklärung verspricht nicht vorhandene Löschung
- **Befund:** `frontend/src/pages/Datenschutz.tsx` beschreibt die Löschung als verfügbare Funktion. Sie ist aber nicht umsetzbar, weil der Backend-Endpunkt fehlt (siehe 1.1).
- **Abhilfe:** Zuerst den Lösch-Endpunkt implementieren, danach die Datenschutzerklärung unverändert beibehalten. Bis zur Umsetzung ist die aktuelle Beschreibung irreführend und damit rechtswidrig.

#### 4.4 Niedrig — Keine ausdrücklichen Cookie-/Consent-Informationen
- **Befund:** Die Anwendung speichert einen JWT und die E-Mail-Adresse im `localStorage`. Diese Speicherung ist technisch notwendig für die Anmeldung und begründet keinen eigenen Einwilligungsbedarf. Ein Consent-Banner ist daher derzeit nicht erforderlich.
- **Abhilfe:** Keine unmittelbare Maßnahme. Falls später Tracking, externe Einbettungen oder optionale Speicherung ergänzt werden, ist vorab ein Consent-Mechanismus gemäß ePrivacy-Richtlinie/DSGVO erforderlich.

#### 4.5 Positiv
- Impressum und Datenschutz sind über den Footer auf jeder Seite erreichbar (`frontend/src/components/Footer.tsx`).
- Es werden keine externen Schriften, Skripte oder Bilder geladen (`frontend/index.html`, `frontend/src/styles/globals.css`, `frontend/src/pages/Datenschutz.tsx` Abschnitt 7).

---

### 5. Barrierefreiheit (WCAG / BITV / EAA)

#### 5.1 Mittel — Fokusindikator wird entfernt
- **Befund:** `frontend/src/styles/globals.css` enthält `.input:focus { outline: none; ... }`. Ohne einen sichtbaren Ersatzfokus ist die Bedienung per Tastatur nicht ausreichend erkennbar.
- **Abhilfe:** Sichtbaren Fokusindikator ergänzen, z. B. `border-color: var(--color-accent); box-shadow: 0 0 0 3px rgba(201, 162, 75, 0.35);` statt `outline: none;`.

#### 5.2 Mittel — Farbkontraste
- **Befund:** `--color-muted: #8a8194` auf `--color-bg: #0e0b10` sowie Akzenttöne erfüllen vermutlich nicht durchgehend die geforderte Kontrastanforderung von WCAG 2.1 AA (4.5:1 für Fließtext).
- **Abhilfe:** Kontraste messen und Farbwerte in `frontend/src/styles/globals.css` so anpassen, dass mindestens 4.5:1 für Fließtext und 3:1 für große Texte/UI-Komponenten erreicht werden.

#### 5.3 Niedrig — `window.confirm` im Outfit-Bereich
- **Befund:** `frontend/src/pages/Outfits.tsx` nutzt `window.confirm` für Löschbestätigungen. Dies ist nicht optimal erweiterbar und nicht vollständig konsistent mit der restlichen UI.
- **Abhilfe:** Einen zugänglichen Inline-Dialog mit Fokusmanagement und klaren Bestätigungsschaltflächen verwenden, analog zur Account-Löschbestätigung in `frontend/src/pages/Account.tsx`.

#### 5.4 Positiv
- Formularfelder sind mit `<label>` assoziiert (`frontend/src/components/ClothingForm.tsx`, `Login.tsx`, `Register.tsx`).
- Fehlermeldungen verwenden `role="alert"` (`ClothingForm.tsx`, `Account.tsx`, `Outfits.tsx`).
- Bilder in der Garderobe und den Outfits verfügen über `alt`-Texte.

---

### Gesamteinschätzung

Das Produkt weist mehrere erhebliche, aber behebbare Mängel auf. Besonders kritisch sind die fehlende Backend-Implementierung der Account-Löschung, die ungeschützte Auslieferung personenbezogener Bilddateien sowie das Platzhalter-Impressum. Diese Punkte müssen vor einer Marktfreigabe behoben werden.