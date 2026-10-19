# MVP Alpha: Import → Review → Save → Find again

Prüfstand: 2026-10-03 (Europe/Berlin). Fokus dieses Changes: Datenintegrität und sichere private Alpha-Nutzung. Kein neuer KI-Anbieter, keine zusätzliche Infrastruktur, keine Änderung der Sites-Freigabe. Parallele Product-Metriken werden separat vorbereitet und sind nicht Teil dieses Changes.

## Aktuelle Korrektur des Smartphone-Nachweises: 19. Oktober 2026

Founder stellt klar: Der erfolgreiche englische Bildimport auf dem echten Smartphone lief **mit Cloudflare AI**. Der mobile AI-Bildpfad gilt daher live als bestanden. Die früheren Einträge „Smartphone-KI-Bildimport offen“ beschreiben einen überholten Zwischenstand. Gemeldet sind zwei fehlgeschlagene Text-only-AI-Imports; sie dürfen nicht als Ausfall des gesamten Cloudflare-Diensts oder als fehlgeschlagener mobiler Bildpfad ausgewiesen werden.

Text-Requestvergleich und aktueller Nachweis stehen in `ai-text-image-comparison-2026-10-19.md`. Zwei echte Live-Konten und tatsächliche aktualisierte Providerreserve bleiben unabhängig davon offen.

## Ergebnis und Grenzen

| Prüfpunkt | Nachweis | Status |
|---|---|---|
| Private Live-Freigabe | Sites: ein zugelassener Owner, keine Gruppen/externe Nutzer | Bestätigt |
| Anonyme Live-API | GET `/api/state` und nicht existierendes Foto: 401 | Bestätigt |
| Gefälschte Live-Identität | GET state mit selbst gesetzten Identitätsheadern: 401 | Bestätigt |
| Echter angemeldeter Live-Owner | Browser zeigt vorhandene Recipe Library | Bestätigt, keine Nutzerdaten geändert |
| Zwei reale Live-Konten | Kein zweites Testkonto zugelassen; Freigabe blieb privat | Offen vor Alpha-Einladung weiterer Konten |
| Besitzertrennung im Repository | Echte SQLite-Abfragen, zwei Besitzer, fremde Fotos und Notizbücher | Automatisiert bestanden |
| Same-Origin | Lokale authentifizierte POST-Anfrage mit fremdem Origin: 403 | Bestätigt |
| Foto-Backup → Restore | Mobile Browseransicht: Foto-Upload, speichern, Download, dieselbe Datei einlesen, Restore | Vollständig lokal bestanden |
| Byte-Integrität und Löschung | SHA-256 des wiederhergestellten Fotos stimmt; neue Foto-ID; alte ID 404 | Lokal über API bestätigt |
| Referenziertes Foto löschen | DELETE lokales aktuelles Rezeptfoto: 409 | Bestätigt |
| Text DE/EN/FA | Extraktion → manuelle Korrektur → SQL-Speicherung → Reload → Suche, ohne KI | Automatisiert bestanden |
| Mobile Text-User-Journey | 390 × 844 Browserviewport: DE-Import, Bereich/Einheit bearbeiten, Foto, speichern, Reload, Suche | Praktisch lokal bestanden |
| DE-Bild-OCR | Live: Bild → Entwurf → Review → Save → Reload → Suche, inklusive Foto | Bestanden am 03.10.; Nachweis in alpha-gates-2026-10-03.md |
| EN-Bild-OCR / KI-Bildreview | Live EN-OCR und zweiseitiger KI-Import mit DE-Ausgabe, Review-Marks, Save, Reload, Suche | Bestanden am 03.10.; echter Smartphone-Test separat offen |
| Cloudflare-Tarif / Konfiguration | Aktueller Workers-Plan Free in Dashboard; konfiguriertes Konto passt; Token aktiv, Modell im Katalog verfügbar | Free erneut bestätigt; synthetische Messaufrufe dokumentiert in alpha-ai-usage.md |
| Inhaltsfreie Fehlerdiagnostik | Fehlerstatus, fester HTTP-Code und erzeugte Request-ID; Test auf erlaubte Keys | Implementiert und getestet |

Ein mobiler Browserviewport ersetzt keinen Test auf echtem iOS-/Android-Gerät. Produktions-D1/R2-Restore wurde bewusst nicht auf echten Nutzerdaten ausgeführt. Der lokale Roundtrip verwendete die gleichen API-/Backupfunktionen auf der lokalen Worker-, D1- und R2-Laufzeit mit synthetischem Material. Durch die danach nicht verfügbare administrative Browserrichtlinien-Prüfung bleiben die Bildprüfungen offen; keine Umgehung wurde versucht.

## Kleine technische Änderungen

1. `lib/backup.ts` ist der gemeinsame Vertrag für Export und Import. Kompaktes JSON, echte UTF-8-Dateigröße maximal 20 MiB, Notizbuch-Schreibgröße maximal 1 MiB, gültige referenzierte Fotos mit maximal 2 MiB. Vor Upload wird der gesamte Backupinhalt validiert. Export benutzt denselben Importvalidator und produziert deshalb keine wissentlich nicht importierbare Datei. Das bestehende 14-MiB-Rohfotolimit bleibt zusätzlich im UI-Export. Export nahe der Grenze ist automatisiert abgedeckt.
2. Restore prüft verfügbare Fotoplätze, lädt neue Bilder separat hoch und ersetzt das Notizbuch erst nach erfolgreicher Validierung. Foto-IDs werden auch in Revisionen neu zugeordnet. Bei Fehler/Konflikt werden neu hochgeladene unreferenzierte Bilder entfernt. Eine mehrdeutige Netzwerkantwort darf keine tatsächlich gespeicherten Fotos löschen: die serverseitige Referenzprüfung bleibt maßgeblich.
3. Fotoentfernung prüft im selben atomaren SQL-Schritt die Besitzerzuordnung und sämtliche aktuellen/Revisionsreferenzen. Sie markiert das Foto zuerst als gelöscht, entfernt danach R2-Bytes und schließlich Metadaten. Fehler lassen eine wiederholbare Löschmarkierung zurück. Notizbuchschreiben prüft Foto-Eigentum und Löschstatus nochmals atomar, um ein Wiederbeleben durch konkurrierende Saves zu verhindern.
4. Nach erfolgreicher Notizbuchänderung werden weggefallene Foto-Referenzen entfernt. Abgebrochene/neue Entwurfsuploads erhalten 24 Stunden Schonzeit; unter „Daten & Sicherung“ bereinigt der Nutzer ausdrücklich bis zu 50 ältere unreferenzierte Fotos je Aufruf. Aktuelle Rezepte und Revisionen sind geschützt. Vor Bereinigung lange offene Entwürfe speichern; ein seit über 24 Stunden ungespeichertes Foto kann sonst entfernt werden. Keine neuen Cronjobs.
5. Die 600-Foto-Grenze wird beim Metadaten-Insert atomar erneut geprüft. Restore nahe der Fotoquote kann zusätzlichen temporären Platz benötigen. Die sichere Alpha-Variante bricht vor dem Überschreiben ab, statt alte aktuelle Fotos zur Platzgewinnung zu löschen. Deduplication und Streamingarchive bleiben zurückgestellt.
6. Eigene Diagnoseeinträge enthalten ausschließlich `event`, `status`, `code` und `requestId`. Keine Requestobjekte, Fehlerstacks, Rezeptinhalte, URLs, Besitzer, Tokens oder Bilder. Request-IDs erscheinen in Fehlermeldungen zur Zuordnung. Plattformzugriffslogs sind davon getrennt; ihre Aufbewahrung wird hier nicht neu konfiguriert.
7. Mobile Navigation schließt das Menü nach einer Auswahl. Veraltete Aussagen über nicht angeschlossene KI wurden korrigiert. Kein Redesign und keine neue Produkterweiterung.

## Kosten: sicherer Alpha-Betrieb

Cloudflare wurde vor der autorisierten Verbrauchsmessung lesend geprüft; kein Upgrade, AI Gateway oder bezahlter Fallback eingerichtet. Bestätigt im Dashboard: Workers **Free**, zum geprüften konfigurierten Konto. Tokenprüfung zuvor aktiv; synthetische Modellanfragen jetzt erfolgreich. Produktions-Secrets werden von Sites maskiert und bleiben unverändert; ihre Werte werden nicht veröffentlicht.

[Offizielle Workers-AI-Preise](https://developers.cloudflare.com/workers-ai/platform/pricing/): 10.000 Neurons pro UTC-Tag kostenlos, kontoweit. Weitere Nutzung erfordert Paid; im Free-Plan werden überschrittene Grenzen abgewiesen. Das ausgewählte Modell kostet außerhalb des Freikontingents derzeit 0,10 USD je Million Eingabetokens und 0,30 USD je Million Ausgabetokens. Kein Upgrade vornehmen. Die Anwendung nutzt direkte REST-Inferenz, keinen Gateway mit Credits. Der atomare persönliche Zähler begrenzt auf zwei Versuche je Nutzer und UTC-Tag, einschließlich Fehlern; 3.000 maximale Ausgabetokens, 45 Sekunden Timeout, keine automatischen Wiederholungen. Diese Begrenzungen sind zusätzliche Schutzmaßnahmen, kein Ersatz für den Free-Tarif. Ein späterer manueller Tarifwechsel im Dashboard verändert die Kostensituation und verlangt vorherige erneute Prüfung; dann KI zunächst mit `CF_AI_FREE_ONLY_CONFIRMED=false` deaktivieren. Manuelle Library und andere Imports bleiben unabhängig nutzbar.

[Cloudflare-Datenverwendung](https://developers.cloudflare.com/workers-ai/platform/data-usage/): Cloudflare erklärt, Kundeneingaben/-ausgaben ohne ausdrückliche Zustimmung nicht zum Training oder zur Verbesserung ihrer bzw. fremder Dienste zu nutzen. Das ist kein Beleg für Ende-zu-Ende-Verschlüsselung oder ausschließliche EU-Verarbeitung. KI bleibt zustimmungspflichtig, Quellen können private Angaben enthalten. In diesen Prüfungen wurden keine echten Rezepte übertragen.

Sites-eigene Hostingressourcen sind getrennt vom persönlichen Cloudflare-AI-Konto. Die Free-Tarifprüfung ist keine Aussage über beliebige zukünftige Sites-/Speicherkosten.

## Offene Abnahmeschritte vor mehreren Alpha-Nutzern

- Mit explizit freigegebenen zwei Testkonten: A speichert synthetisches Rezept/Fotodaten, B sieht und verändert weder A-Notizbuch noch A-Foto; anonym und Cross-Origin weiter abgewiesen. Private Freigabe nicht für diese Prüfung pauschal öffnen.
- DE/EN-Bild-Kernflow inklusive Mehrseiten-Import ist live im mobilen Viewport bestanden und vom Founder akzeptiert. Echte Smartphone-Dateiauswahl, Tastatur und Backup/Restore bleiben separat abzunehmen. FA-Bilder sind kein Gate.
- Auf echtem Telefon prüfen: Dateiauswahl, OCR-Wartezustand, Tastatur/Mengenbereiche, Editorbuttons, Foto-Backupdownload und Dateiauswahl für Restore.
- Produktions-Restore nur mit separatem synthetischem Testkonto nach Freigabe, nie durch Überschreiben des persönlichen Kochbuchs.

Keine Alpha-Freigabe für acht Nutzer wird durch diesen Change behauptet. Die fehlenden praktischen Bild- und Zweikontoprüfungen sind explizite Abnahmegrenzen.

## Migration und Betrieb

`0002_wide_sumo.sql` ergänzt `attachments.deleted` und `attachments.created_at` mit kompatiblen Defaults. Bestehende Fotos bleiben aktiv; vorhandene unreferenzierte Metadaten mit Zeitpunkt 0 können bei ausdrücklicher Bereinigung entfernt werden. Die neue Migration wurde lokal angewendet, der Sites-Publish wendet sie vor Workerwechsel an. Keine Bestandsdatenlöschung durch die Migration selbst.

Bei R2-Ausfall Bereinigung später erneut ausführen. Nach dem Change bevorzugt vorwärts korrigieren; ein Rollback auf Code vor Einführung des Löschstatus benötigt Prüfung, weil alter Code Löschmarkierungen nicht berücksichtigt. Änderungen an Datenbankschema nicht blind zurückrollen.

## Persönliche Alpha-Quota: Beschluss und Umsetzung vom 3. Oktober 2026

Option A ist ausdrücklich beschlossen: **2 KI-Versuche je Nutzer und UTC-Tag**. Die frühere globale Haupttestbegrenzung von 5/Tag entfällt. Die Übergangsregel für drei Pilotnutzer endet mit der Veröffentlichung dieses Changes.

`ai_user_usage` speichert ausschließlich serverseitige Owner-ID, UTC-Tag und Zahl der reservierten Versuche. Der zusammengesetzte Primärschlüssel und ein einzelnes `INSERT ... ON CONFLICT ... WHERE requests < 2 RETURNING` verhindern Überbuchung. GET liest nur das eigene Kontingent. Identität stammt aus `authorize`, nicht aus Eingaben. Reservierung erfolgt nach Input-/Bildvalidierung, vor dem Provideraufruf; Provider-/Netzwerkfehler zählen mit. Keine Rückerstattung, Wiederholung, Billing- oder Analytics-Infrastruktur. Quotenfehler liefern 429 mit `USER_AI_DAILY_LIMIT`; keine Quota-Inhalte werden geloggt. Bestehende Authentifizierung, Same-Origin- und Foto-Ownerprüfungen bleiben erhalten.

Migration `0003_empty_zaran.sql` ist additiv. Alte `ai_usage`-Daten bleiben unverändert als Historie, werden nicht mehr verwendet. Historische globale Versuche können keinem Besitzer zuverlässig zugeordnet werden; alle persönlichen Kontingente beginnen bei Veröffentlichung bei zwei. Dadurch gibt es am Migrationstag einmalig zusätzliche persönliche Versuche. Keine alten Rezept-/Fotodaten werden verändert. Quota-Owner-IDs sind pseudonyme Nutzerdaten und bleiben in der zugriffsgeschützten Datenbank, nicht in Logs.

95 Tests, TypeScript und Worker-Build bestanden: getrennte Besitzer, UTC-Reset inklusive Jahreswechsel, Status ohne Verbrauch, Fehler ohne Refund, überlappende Reservierungen und sechs echte parallele SQLite-Verbindungen mit gemeinsamem Datenbankfile. Letztere akzeptieren insgesamt genau vier Reservierungen für zwei Besitzer.

DE/EN-Bildflow ist bestanden; physisches Smartphone und zwei echte Live-Konten bleiben offen. Provider-Verbrauch und Reserve: siehe `alpha-ai-usage.md`. Keine vollständige Alpha-ready-Meldung durch diesen Change.

Persönliche Quota privat live veröffentlicht; Live-Anzeige 2/2 → 1/2 nach erfolgreichem synthetischem Textimport bestätigt. Zweiter Bildversuch gestartet, anschließend Browser-Sicherheitsprüfung nicht verfügbar. Tatsächliche Dashboard-Neuronreserve und persönlicher 0/2-Fallback bleiben praktisch offen; siehe Verbrauchsprotokoll. GitHub CI für veröffentlichten Code bestanden. Keine Alpha-ready-Freigabe.

## Nutzerbericht: echtes Smartphone am 3. Oktober 2026

Vom Nutzer praktisch bestätigt, ohne KI: Login, mobile Navigation, bestehende Rezepte öffnen, Suche, Bearbeiten und Speichern, Reload, Bildschirmtastatur/Scrolling sowie allgemeine mobile UI. Persönliches KI-Tageskontingent war bereits erreicht; der vollständige KI-Bildimport wurde dadurch blockiert und wird nach dem nächsten UTC-Reset separat getestet. Dies ist ein Quotenhindernis, kein belegter Erkennungsfehler oder fehlender Produktbedarf.

Smartphone-Kernflow bis auf KI-Bildimport vom Nutzer als bestanden gemeldet. Geräte-/Browserdetails wurden nicht angegeben. Foto-Backupdownload und Restore sind in diesem Bericht nicht gesondert bestätigt; der bisherige Nachweis dafür bleibt lokal. Keine vollständige Alpha-ready-Freigabe: Smartphone-KI-Bildimport, zwei echte Live-Konten und aktualisierte tatsächliche Cloudflare-Neuronreserve bleiben offen.

## Text-KI-Fehler vom 5. Oktober 2026

Live reproduziert: Gemma kann bei fehlender Portionsangabe yield:null liefern; der strenge Parser lehnte dann den gesamten Entwurf ab. Minimalfix lässt diesen unbekannten optionalen Wert weg. Sichere Fehlerkategorien trennen Timeout, Provider-Antwort, generiertes JSON und Schema; keine Rezeptinhalte/Secrets in Logs. 102 Tests, TypeScript, Build und direkte Live-Verarbeitung erfolgreich; privat veröffentlicht. Die konkrete alte Nutzerreferenz ist nicht rückwirkend zugeordnet. iPhone-End-to-End-Wiederholung mit verfügbarem Kontingent bleibt offen. Details: ai-text-diagnosis-2026-10-05.md.

## Live-Text-only-Abnahme: 19. Oktober 2026

Nach Nutzeranmeldung vollständiger produktiver Textimport im In-app-Browser bestanden: ausschließlich englischer Text, Cloudflare-AI-Entwurf auf Deutsch, ausdrücklich übernehmen/reviewen, Titel/Notiz ändern, bewusst speichern, Reload, Suche, Öffnen. Fünf Zutaten, drei Schritte, 8–10 Blätter und 2–3 Zweige sowie Herkunfts-/Prüfmarkierungen erhalten. Genau ein Versuch verbraucht (2/2 → 1/2). Synthetisches Rezept `Alpha Text-AI Live 2026-10-19` zur Sichtprüfung gespeichert. Der frühere Login-Blocker für diesen Nachweis ist aufgehoben; physischer iPhone/Safari-Texttest wird nicht zusätzlich behauptet. Details in ai-text-image-comparison-2026-10-19.md. Keine neue Laufzeitänderung.


## Founder-Freeze-Ausnahme: Owner-KI-Nutzung, 19.10.2026

Owner-Konfiguration serverseitig: 20 Versuche je UTC-Tag, andere Nutzer weiterhin 2. Atomare Nutzer-/Tageszähler und bisher verbrauchte Versuche bleiben erhalten. Cloudflare Free im Dashboard erneut bestätigt; tatsächlicher Tagesstand vor neuer Abnahme 80,75/10.000 Neurons (Reserve 9.919,25). Keine kostenpflichtige Aktivierung. [Vergleich, Tests, Live-Abnahme und Rollback](ai-usage-freeze-exception.md) sind der aktuelle Nachweis für diese begrenzte Ausnahme. P01 hat noch nicht begonnen; neuer Freeze erst nach erfolgreicher Text- und Bild-Liveabnahme. Frühere offene Live-Zwei-Konten-/Security-Grenzen bleiben bestehen.

Erneute Abnahme der Owner-Ausnahme bestanden: Text-only und Bild-only jeweils KI-Entwurf → ausdrücklich übernehmen/reviewen → speichern → Reload → Suche/Öffnen. Owner-Kontingent korrekt 19/20 → 18/20 → 17/20. 105 Tests, TypeScript, Worker-Build und CI bestanden. Neuer Freeze `alpha-freeze-2026-10-20-owner-ai` am reviewten Endstand; ursprünglicher Tag unverändert. Keine neue physische iPhone-Abnahme oder Live-Zwei-Konten-Abnahme behauptet.
