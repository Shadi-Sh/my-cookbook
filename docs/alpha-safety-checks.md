# MVP Alpha: Import → Review → Save → Find again

Prüfstand: 2026-10-02 (Europe/Berlin). Fokus dieses Changes: Datenintegrität und sichere private Alpha-Nutzung. Kein neuer KI-Anbieter, keine zusätzliche Infrastruktur, keine Änderung der Sites-Freigabe. Parallele Product-Metriken werden separat vorbereitet und sind nicht Teil dieses Changes.

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
| DE-Bild-OCR | Synthetisches deutsches Rezeptfoto ausgewählt, OCR gestartet | Abschluss nicht verifiziert: Browserrichtlinien-Prüfung danach nicht verfügbar |
| EN-Bild-OCR / KI-Bildreview | Noch kein neuer vollständiger mobiler Lauf | Offen |
| Cloudflare-Tarif / Konfiguration | Aktueller Workers-Plan Free in Dashboard; konfiguriertes Konto passt; Token aktiv, Modell im Katalog verfügbar | Lesend bestätigt; keine Modellaufrufe verbraucht |
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

Cloudflare wurde nur lesend geprüft; kein Upgrade, AI Gateway oder bezahlter Fallback eingerichtet. Bestätigt im Dashboard: Workers **Free**, zum geprüften konfigurierten Konto. Tokenprüfung: aktiv; vorhandenes Gemma-Modell im Konto-Katalog sichtbar. Produktions-Secrets werden von Sites maskiert und bleiben unverändert; ihre Werte werden nicht veröffentlicht.

[Offizielle Workers-AI-Preise](https://developers.cloudflare.com/workers-ai/platform/pricing/): 10.000 Neurons pro UTC-Tag kostenlos, kontoweit. Weitere Nutzung erfordert Paid; im Free-Plan werden überschrittene Grenzen abgewiesen. Das ausgewählte Modell kostet außerhalb des Freikontingents derzeit 0,10 USD je Million Eingabetokens und 0,30 USD je Million Ausgabetokens. Kein Upgrade vornehmen. Die Anwendung nutzt direkte REST-Inferenz, keinen Gateway mit Credits. Ihr atomarer Zähler begrenzt auf fünf Versuche täglich, einschließlich Fehlern; 3.000 maximale Ausgabetokens, 45 Sekunden Timeout, keine automatischen Wiederholungen. Diese Begrenzungen sind zusätzliche Schutzmaßnahmen, kein Ersatz für den Free-Tarif. Ein späterer manueller Tarifwechsel im Dashboard verändert die Kostensituation und verlangt vorherige erneute Prüfung; dann KI zunächst mit `CF_AI_FREE_ONLY_CONFIRMED=false` deaktivieren. Manuelle Library und andere Imports bleiben unabhängig nutzbar.

[Cloudflare-Datenverwendung](https://developers.cloudflare.com/workers-ai/platform/data-usage/): Cloudflare erklärt, Kundeneingaben/-ausgaben ohne ausdrückliche Zustimmung nicht zum Training oder zur Verbesserung ihrer bzw. fremder Dienste zu nutzen. Das ist kein Beleg für Ende-zu-Ende-Verschlüsselung oder ausschließliche EU-Verarbeitung. KI bleibt zustimmungspflichtig, Quellen können private Angaben enthalten. In diesen Prüfungen wurden keine echten Rezepte übertragen.

Sites-eigene Hostingressourcen sind getrennt vom persönlichen Cloudflare-AI-Konto. Die Free-Tarifprüfung ist keine Aussage über beliebige zukünftige Sites-/Speicherkosten.

## Offene Abnahmeschritte vor mehreren Alpha-Nutzern

- Mit explizit freigegebenen zwei Testkonten: A speichert synthetisches Rezept/Fotodaten, B sieht und verändert weder A-Notizbuch noch A-Foto; anonym und Cross-Origin weiter abgewiesen. Private Freigabe nicht für diese Prüfung pauschal öffnen.
- DE/EN-Bilder vollständig mobil importieren, Entwurf prüfen/ändern, bewusst speichern und nach Reload über Suche öffnen. Mehrseitige Bilder, unscharfes Bild und ausgeschöpftes KI-Kontingent abdecken. FA-Text mit klaren Überschriften prüfen; FA-Bilder sind kein Gate.
- Auf echtem Telefon prüfen: Dateiauswahl, OCR-Wartezustand, Tastatur/Mengenbereiche, Editorbuttons, Foto-Backupdownload und Dateiauswahl für Restore.
- Produktions-Restore nur mit separatem synthetischem Testkonto nach Freigabe, nie durch Überschreiben des persönlichen Kochbuchs.

Keine Alpha-Freigabe für acht Nutzer wird durch diesen Change behauptet. Die fehlenden praktischen Bild- und Zweikontoprüfungen sind explizite Abnahmegrenzen.

## Migration und Betrieb

`0002_wide_sumo.sql` ergänzt `attachments.deleted` und `attachments.created_at` mit kompatiblen Defaults. Bestehende Fotos bleiben aktiv; vorhandene unreferenzierte Metadaten mit Zeitpunkt 0 können bei ausdrücklicher Bereinigung entfernt werden. Die neue Migration wurde lokal angewendet, der Sites-Publish wendet sie vor Workerwechsel an. Keine Bestandsdatenlöschung durch die Migration selbst.

Bei R2-Ausfall Bereinigung später erneut ausführen. Nach dem Change bevorzugt vorwärts korrigieren; ein Rollback auf Code vor Einführung des Löschstatus benötigt Prüfung, weil alter Code Löschmarkierungen nicht berücksichtigt. Änderungen an Datenbankschema nicht blind zurückrollen.
