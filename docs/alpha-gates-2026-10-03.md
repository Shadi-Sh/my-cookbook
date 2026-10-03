# Alpha-Abnahme – 3. Oktober 2026

Geprüfter Live-Stand: PR #4, Commit `0bcdeb7196a6204d00902376c60a264d62be6f0e`, Sites Version 9. GitHub CI bestanden. Keine Featureänderung, keine neue Infrastruktur, keine Änderungen an Freigaben oder Secrets.

## Gate 1: DE/EN-Bildimport

Praktisch live in 390 × 844 Browseransicht geprüft:

- EN-Bild → OCR → strukturierter Entwurf mit 200 g Pasta, 8–10 Blätter Basilikum und 2–3 Zweige Thymian, zwei Schritten, 5 min Vorbereitung und 15 min Garen. Titel/Notiz bearbeitet, ausdrücklich gespeichert, neu geladen, gesucht und geöffnet: `Alpha Gate EN 2026-10-03`.
- DE-Bild → OCR → dieselben korrekten Mengenbereiche und Einheiten, zwei deutsche Schritte. Titel/Notiz bearbeitet und zusätzlich synthetisches Rezeptfoto hochgeladen. Gespeichert, neu geladen, gesucht und geöffnet: `Alpha Gate DE 2026-10-03`. Foto sichtbar erhalten.
- Zweitseitiges EN-Rezept → ein Cloudflare-KI-Aufruf → DE-Ausgabe mit Zutaten von Seite 1 und drei Schritten von Seite 2. Vor Übernahme bleiben Editorfelder leer; keine automatische Speicherung. Vorschläge ausdrücklich übernommen, Herkunft/Prüfstatus sichtbar, Titel verändert und fünf Felder als geprüft markiert. Unbekannte Gesamtzeit bewusst bestätigt. Gespeichert, neu geladen, gesucht und geöffnet: `Alpha Gate Mehrseitig 2026-10-03`. Alle Markierungen erhalten.
- Niedrige Bildqualität (sehr kleine, kontrastarme Schrift): klare Meldung „Kein Text erkannt. Bitte ein schärferes Rezeptfoto verwenden.“ Leerer Entwurf blieb bearbeitbar und wurde abgebrochen. Kein neuer Datensatz.
- Quota-/AI-Suite erneut: 9/9 Tests bestanden. Ausschöpfung, atomare Grenze von fünf Versuchen, Status ohne Verbrauch, Tageswechsel und erhaltene Review-Marks automatisiert geprüft. Das Live-Kontingent wurde nicht absichtlich ausgeschöpft: Anzeige ging von 5/5 auf 4/5. Ein praktischer Lauf der Live-UI bei 0/5 bleibt unbewiesen.

Der erste EN-Auswahl-/OCR-Toolaufruf dauerte ca. 12 Minuten; Tool-Latenz und OCR-Dauer sind nicht getrennt messbar. Keine Behauptung eines 12-minütigen OCR-Prozesses. DE-Wiederholung endete nach etwa 9 Sekunden. Einmal verschwand der DE-Dialog nach Feldübernahme; kontrollierte Wiederholung gelang. Ursache nicht belegt und kein entsprechender Codefix vorgenommen. Auf echtem Gerät gezielt Wiederholbarkeit prüfen.

Die drei synthetischen Rezepte bleiben zur Sichtprüfung im Owner-Kochbuch. Bestehende Rezepte wurden nicht bearbeitet oder gelöscht. Keine echten privaten Rezeptdaten an KI übertragen.

**Status:** DE/EN- und Mehrseiten-Kernflow praktisch bestanden. Gesamte Geräteabnahme und praktischer 0/5-UI-Lauf noch offen; keine vollständige Alpha-Freigabe behauptet.

## Gate 2: echtes Smartphone – noch offen

Benötigt: physisches Gerät und Browser. Gerätemodell, Betriebssystem und Browserversion notieren. Kein Desktop-Viewport als Ersatz akzeptieren.

1. Live-Seite öffnen, normal anmelden. Testbilder DE und EN aus `fixtures/` aufs Telefon übertragen.
2. Neues Rezept → Rezeptfoto lesen → Datei auswählen. Wartezustand sichtbar; keine Bedienblockade nach Abschluss. Je Sprache Felder mit Quelle vergleichen.
3. Titel eindeutig mit `Alpha Telefon DE/EN` benennen. Mengenbereich per Bildschirmtastatur von 8–10 auf 9–11 ändern; einmal Einheit und Schritt ändern. Editorbuttons müssen mit geöffneter/geschlossener Tastatur erreichbar sein.
4. Bewusst speichern, Browserseite neu laden, Rezept über Suche wieder öffnen. Änderung und Originaltext müssen erhalten sein.
5. Foto im Testrezept hinzufügen. In „Daten & Sicherung“ Backup herunterladen. Datei muss in der Dateien-App sichtbar und auswählbar sein.
6. Restore ausschließlich auf einem isolierten synthetischen Testkonto mit leerem/Test-Kochbuch: dieselbe Datei auswählen, Bestätigung prüfen, wiederherstellen, Foto und Änderungen nach Reload kontrollieren. Das persönliche Owner-Kochbuch dafür nicht überschreiben.
7. Falls das echte tägliche KI-Limit 0/5 erreicht ist: KI-Aktion muss deaktiviert sein; bestehende Library, OCR, manuelle Bearbeitung und Speicherung bleiben nutzbar. Limit nicht durch unnötige kostenrelevante Anfragen verbrauchen.

Ergebnisformat: Gerät/OS/Browser; DE, EN, Tastatur, Speichern/Reload/Suche, Backupdownload, Restore+Foto jeweils bestanden/Fehler und konkrete Fehlermeldung. Bei Fehler Screenshot ohne private Inhalte.

## Gate 3: zwei echte Live-Konten – noch offen

Sites bleibt Owner-privat mit genau einem zugelassenen Konto. Ein zweites Konto ist nicht durch erfundene Identitätsheader, lokale Testidentitäten oder einen zweiten Tab derselben Anmeldung ersetzbar.

Benötigt: zweites echtes ChatGPT-Konto und gezielte Viewer-Freigabe für genau dieses Konto. Vor Freigabe Empfänger bestätigen. Keine öffentliche Freigabe und kein Editorzugriff erforderlich. Zwei getrennte Browseranmeldungen verwenden.

1. A ist Owner mit den obigen synthetischen Testrezepten und dem DE-Testfoto.
2. B meldet sich separat an: kein Rezept `Alpha Gate DE/EN/Mehrseitig 2026-10-03` von A sichtbar. B darf keine Owner-Inhalte automatisch übernehmen.
3. B speichert eigenes eindeutig benanntes synthetisches Rezept mit eigenem Foto. A sieht es nach Reload/Suche nicht. A und B sehen nach erneutem Login jeweils ihre eigenen Daten.
4. Direkte Bild-URL des synthetischen A-Testfotos unter B aufrufen: keine Bilddaten, API 404. Anonym: 401/Sign-in. Keine privaten Bestandsfotos für die Probe verwenden.
5. Fremde Fotozuweisung und Löschung mit authentifiziertem B gegen synthetische IDs testen: Save mit A-Fotoreferenz abgewiesen, A-Foto bleibt für A verfügbar; Löschung fremder Referenz abgewiesen. Same-Origin/Origin-Test muss weiterhin abweisen.
6. Zugriff des Testkontos nach Abschluss entsprechend vereinbartem Alpha-Zugang beibehalten oder entfernen. Keine Freigabeänderung ohne konkretes Konto.

Zweibesitzer-SQL-Tests aus PR #4 bleiben ergänzende Evidenz. Sie schließen den fehlenden Live-Zweikontotest nicht.

## Nutzerbericht: echtes Smartphone am 3. Oktober 2026

Vom Nutzer praktisch bestätigt, ohne KI: Login, mobile Navigation, bestehende Rezepte öffnen, Suche, Bearbeiten und Speichern, Reload, Bildschirmtastatur/Scrolling sowie allgemeine mobile UI. Persönliches KI-Tageskontingent war bereits erreicht; der vollständige KI-Bildimport wurde dadurch blockiert und wird nach dem nächsten UTC-Reset separat getestet. Dies ist ein Quotenhindernis, kein belegter Erkennungsfehler oder fehlender Produktbedarf.

Smartphone-Kernflow bis auf KI-Bildimport vom Nutzer als bestanden gemeldet. Geräte-/Browserdetails wurden nicht angegeben. Foto-Backupdownload und Restore sind in diesem Bericht nicht gesondert bestätigt; der bisherige Nachweis dafür bleibt lokal. Keine vollständige Alpha-ready-Freigabe: Smartphone-KI-Bildimport, zwei echte Live-Konten und aktualisierte tatsächliche Cloudflare-Neuronreserve bleiben offen.
