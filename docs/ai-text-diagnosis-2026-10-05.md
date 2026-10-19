# Live-Textimport: Diagnose vom 5. Oktober 2026

Nutzerbericht: zwei normale Textimporte auf iPhone/Safari fehlgeschlagen, beide persönlichen Versuche verbraucht; generische 422-Meldung, eine Referenz `24e3c201-f5c1-4bcb-822c-fcb0158b13eb`.

## Befund und Grenzen

Zwei synthetische DE/EN-Rezepte wurden mit unverändertem Prompt, Gemma-Modell und 3.000 Ausgabetokens direkt gegen Cloudflare reproduziert. Beide erfolgreich: HTTP 200, success true, `result.choices[0].message.content` als String, finish_reason stop, gültiges Rezept-JSON und Schema. Dauer 15,23 bzw. 12,77 Sekunden. Dieses tatsächliche Format entspricht dem bisherigen providerText-Vertrag. Eine pauschale Umstellung auf `result.response` wäre unbegründet. Offizielle Referenz: https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/

In einer weiteren Live-Reproduktion ohne angegebene Portionszahl lieferte Gemma `recipe.yield:null`. Die bisherige partielle Rezeptvalidierung erlaubt für yield nur eine positive Zahl oder ein fehlendes Feld: dies reproduziert den Schemafehler trotz HTTP 200, finish_reason stop und gültigem JSON. Sichere Diagnose zeigte ausschließlich Feldpfad yield und Typ number/null, keine Rezeptinhalte.

Die genannte Referenz wurde in den verfügbaren Plattformlogs nicht gefunden. Alte eigene Diagnostik enthält nur HTTP-Status und zufällige Referenz, keine Verarbeitungskategorie. Konkreter Nutzerfehler daher nicht rückwirkend eindeutig zugeordnet und mit den synthetischen Quellen nicht reproduziert. Verbrauch der Quota spricht für eine Exception nach erfolgreicher Eingabevalidierung und Reservierung; Timeout, Antwortdecodierung und Rezeptparser bleiben Kandidaten. Kein Beleg für einen Safari-spezifischen Parserfehler, weil diese Verarbeitung serverseitig läuft.

Bestätigte Defekte sind die pauschale 422-Zuordnung und der Ablehnungsfall für unbekanntes yield:null. Nur dieser belegte unbekannte optionale Wert wird vor strenger Validierung entfernt; negative/Nullzahl/stringförmige Portionen bleiben abgewiesen. Kein Portionswert wird geschätzt oder hinzugefügt. Ob genau dies die beiden ursprünglichen Nutzerrequests verursacht hat, ist ohne deren passende Diagnostik nicht rückwirkend bewiesen.

## Kleine Korrektur

- Bounded Streaming-Decodierung direkt aus Response, maximal 120.000 Bytes, striktes UTF-8 und JSON; kein unnötiger neuer Request um den Response-Stream.
- Unveränderter 45-Sekunden-Abbruch umfasst Fetch und Lesen des Antwortbodys. Netzwerkfehler getrennt von Deadline.
- Provider-Envelope strikt prüfen; finish_reason length als abgeschnittene Ausgabe erkennen.
- Generiertes JSON getrennt vom Provider-Envelope decodieren. Ungültiges Rezept-Schema bleibt abgewiesen; keine automatische JSON-Reparatur, allgemeine Schemaauflockerung oder Wiederholung.
- Feste Kategorie, Status, zufällige Referenz in vorhandener inhaltsfreier Diagnose. Keine Texte, Schema-Issue-Pfade, Provider-Fehlermeldungen/-Antworten, Requestobjekte, Stacks, Nutzer-IDs oder Secrets im Produktionslog. Kategorien werden zur gleichen Referenz in Antwort und Log ausgegeben.

| Fall | Kategorie | HTTP |
|---|---|---:|
| Provider-Timeout | AI_PROVIDER_TIMEOUT | 504 |
| Netzwerk | AI_PROVIDER_NETWORK | 502 |
| Providerzugang abgelehnt | AI_PROVIDER_ACCESS | 502 |
| Provider ausgelastet/429 | AI_PROVIDER_RATE_LIMIT | 503 |
| Providerfehler | AI_PROVIDER_FAILURE | 502 |
| Response zu groß / ungültiges JSON / falsches Format | AI_PROVIDER_RESPONSE_TOO_LARGE / AI_PROVIDER_JSON_INVALID / AI_PROVIDER_FORMAT_INVALID | 502 |
| Ausgabe abgeschnitten / Rezept-JSON ungültig / Schema ungültig | AI_OUTPUT_TRUNCATED / AI_OUTPUT_JSON_INVALID / AI_OUTPUT_SCHEMA_INVALID | 502 |
| Kein Rezept erkannt | AI_NO_RECIPE | 422 |
| Persönliches Kontingent verbraucht | bestehendes USER_AI_DAILY_LIMIT | 429 |

UI zeigt unterschiedliche feste verständliche DE/EN-Meldungen und bestehende Referenz. „Entwurf bleibt erhalten“ gilt weiterhin. Providerfehler und fehlerhafte Ausgaben verbrauchen weiterhin einen Versuch; keine Quota-Rücksetzung. Review und Speichern bleiben ausdrücklich erforderlich.

## Prüfung

102 Tests und TypeScript bestanden. Fehlerfälle werden durch dieselbe produktive Verarbeitung mit kontrollierten HTTP-/Body-/Parserfällen geprüft, einschließlich verzögertem Body-Timeout und UTF-8 über Bytegrenzen. Bestehende Owner-, Quota-, Backup- und Importsuites bleiben bestanden. Worker-Build und Veröffentlichung werden separat bestätigt.

Browser-Livenachweis blockiert durch nicht verfügbare administrative Browser-Sicherheitsprüfung. Keine Umgehung oder alternative Browsersteuerung. Erfolgreiche direkte Live-Providerverarbeitung ist kein Ersatz für Import → Review → Save im iPhone-Browser. Dieser End-to-End-Nachweis bleibt offen, benötigt verfügbares persönliches Kontingent nach UTC-Reset und den erneuten Test auf dem Gerät. Keine Alpha-ready-Meldung.

Nach dem yield:null-Fix wurde derselbe synthetische Kurztext erneut mit der produktiven Pipeline live gegen Cloudflare verarbeitet: Erfolg nach 8,33 Sekunden, vier Zutaten, drei Schritte, sechs Herkunftsmarkierungen, alle ungeprüft; auch der erzeugte RecipeSchema-Entwurf ist gültig. Keine automatische Speicherung. 102 Tests, TypeScript und Worker-Build bestanden. Private Veröffentlichung am 05.10.2026 erfolgreich: Commit `ad278cd7b77f93389f3faca2a40659c1819ecf70`, unveränderte Freigabe und Secrets. Die direkte Live-Providerprüfung ersetzt weiterhin nicht den wegen Browserpolicy/offenem Kontingent fehlenden iPhone-End-to-End-Nachweis.
