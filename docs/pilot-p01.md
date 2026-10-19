# P01 – Owner-Pilot

Status am 19.10.2026: Teilnehmer bestätigt; **noch nicht begonnen**. Erneute Text-/Bild-Liveabnahme bestanden; Start nach neuem Freeze `alpha-freeze-2026-10-20-owner-ai`. Keine Testergebnisse vorwegnehmen. P01 ist der Projekt-Owner und damit für die Produktvalidierung nicht unabhängig; P02/P03 müssen diese Verzerrung später berücksichtigen.

## Erste Session, ungefähr 20–30 Minuten

1. In der Library den Startbestand als Zahl notieren. Demo- und synthetische `Alpha …`-Testrezepte ausnehmen. Vorhandene echte Rezepte zählen nicht als neue Pilotimporte.
2. Persönliches KI-Kontingent prüfen: mindestens **zwei verfügbare Versuche**; konfigurierte Owner-Ausnahme 20/Tag, andere Konten 2/Tag. Tests durch Entwickler während der Session unterlassen.
3. Ein **eigenes echtes Rezept, das du behalten möchtest**, als Text importieren. Startzeit, Ende der Extraktion und Speicherzeit notieren. Keine Inhalte ins Protokoll übernehmen.
4. Ergebnis mit der Quelle vergleichen, Mengen/Einheiten/Schritte prüfen, notwendige Änderungen durchführen und bewusst speichern. Korrekturschwere und Hilfe festhalten. KI-Herkunft bleibt sichtbar; „So übernommen“ ist ungeprüft.
5. Ein weiteres eigenes Rezeptbild mit KI importieren und ebenso reviewen/speichern. Falls ein Versuch scheitert: Kategorie/Referenz notieren; Fehler zählt mit. Keine Quota zurücksetzen; weitere Owner-Versuche innerhalb des 20/Tag-Kontingents sind erlaubt, jeden Versuch getrennt protokollieren.
6. Seite neu laden und ein gerade gespeichertes Rezept über Suche wiederfinden und öffnen. Erfolg und benötigte Zeit notieren.
7. Wenn das persönliche Kontingent erschöpft ist: verständliche persönliche Limitmeldung/Reset prüfen. Library, Suche, Öffnen, manuelle Bearbeitung und Speichern sollen weiter funktionieren. Nicht zusätzliche Provideraufrufe erzwingen.

## 5–7 Tage nach der ersten Session

Ohne tägliche Importaufforderung normal verwenden. Freiwillige Rückkehr und weitere echte Imports getrennt von moderierten Aufgaben notieren. Quota, Technikprobleme, fehlende Zeit und fehlender Bedarf getrennt behandeln. Fehlende Messdaten sind „unbekannt“, nicht „kein Bedarf“.

Abschlussfragen: Welche Arbeit hat der Import erspart? Was musste korrigiert werden? Wurde etwas nicht gefunden? Wurde ein weiteres echtes Rezept freiwillig importiert? Soll die Sammlung weiter genutzt werden, und warum?

## Minimales manuelles Protokoll

Private Datei: Projekt-Arbeitsbereich `pilot-data/P01/observations.csv`, außerhalb dieses Repositories. Je Import eine Zeile: Pseudonym, Datum, Importtyp, moderiert/freiwillig, Erfolg, Review-/Gesamtdauer, Korrekturschwere, geänderte Feldgruppen, Save, Wiederfinden, Hilfe, Restkontingent, feste Fehlerkategorie/zufällige Referenz. Keine Rezepttexte, Zutaten, Bilder, Namen, Account-IDs oder URLs.

Schwere: none / minor (Darstellung) / meaningful (relevante Zutat, Menge, Einheit oder Schritt) / critical (wesentlich falsch/erfunden, ohne Quellenvergleich nicht verlässlich kochbar) / not_assessed. Bei mehreren Fehlern höchste Schwere. Kein Fehler darf als fehlender Produktbedarf gezählt werden.

Vor der Session kurzer datensparsamer Zahleneintrag zum Startbestand; nach Abschluss nur aggregierte Ergebnisse für Produktentscheidungen verwenden. Beobachtungsdaten nach Auswertung, spätestens 30 Tage nach Testende, aus dem privaten Pilotprotokoll entfernen. Keine automatische Erfassung oder neue Datenbankmigration wird hierfür aktiviert.
