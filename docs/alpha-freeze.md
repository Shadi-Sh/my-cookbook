> Security release verified on 27 October 2026: Sites v13; renewed feature freeze `alpha-freeze-2026-10-27-security`. Both live AI flows passed after dependency patches. See [release evidence and remaining gates](security-release-2026-10-27.md). This supersedes the release status below; historical tags remain unchanged.

> Abgenommene Founder-Ausnahme: [Owner-KI-Nutzung](ai-usage-freeze-exception.md). Text- und Bild-Liveabnahme bestanden, 105 Tests/TypeScript/Build und CI erfolgreich. Neuer Freeze: `alpha-freeze-2026-10-20-owner-ai` am reviewten Endstand. P01 hat noch nicht begonnen; Start erst nach Setzen dieses Tags. Der unten genannte ursprüngliche Freeze-Tag bleibt unverändert.

# Alpha Feature Freeze – 19. Oktober 2026

## Verbindlicher Stand

- PR #5 in `fix/alpha-safety` gemerged, anschließend PR #4 einschließlich #5 nach `main`.
- Baseline: `b23fa8c6ae6ea964b5b0931b41b70bf7dbb00d01`.
- Git-Tag: `alpha-freeze-2026-10-19`.
- Gemeinsame PR-CI erfolgreich: https://github.com/Shadi-Sh/my-cookbook/actions/runs/39328903013
- 102 automatisierte Tests; TypeScript und Worker-Build bestanden.
- Produktiver Code entspricht dem bereits privat veröffentlichten Text-Diagnose-/Quota-Stand. Dieses Dokument verursacht kein neues Deployment.

Bis P01–P03 abgeschlossen und ausgewertet sind: keine neuen Features, kein Redesign, keine neuen Provider oder Plattformen. Zulässig bleiben kleine notwendige Bug-/Security-Fixes und Korrekturen der Testdokumentation; diese separat reviewen und Änderungen gegenüber dem Freeze-Tag benennen. Keine stillschweigenden Scope-Erweiterungen.

Dies ist ein **Feature-Freeze**, keine Behauptung „Alpha-ready“, Sicherheitszertifizierung oder Public-Release-Freigabe. Der Tag wird nicht nachträglich verschoben.

## P01

Owner ist als P01 bestätigt. P01 hat noch nicht begonnen; erste echte moderierte Importsession steht noch aus. Anleitung: [P01](pilot-p01.md). Tatsächliche Beobachtungen bleiben im privaten lokalen Projektverzeichnis `pilot-data/P01`, außerhalb dieses Git-Checkouts. Keine neuen Analytics; der separate Metrikpatch ist nicht integriert und wird nicht als aktiv bezeichnet.

Die 5–7-tägige Beobachtungsphase beginnt mit der ersten echten Session. Synthetische Entwickler- und Abnahmetests zählen nicht als freiwillige Nutzung oder Nachfrage. KI-Session mit mindestens zwei verfügbaren persönlichen Versuchen starten. Nach erneuter Abnahme: 17/20 beim konfigurierten Owner, andere Nutzer weiterhin 2/Tag. Reset täglich 00:00 UTC.

## Offene Freigabegrenzen

- Zwei echte Live-Konten: Owner-Isolation noch nicht praktisch abgeschlossen; vor weiteren Personen gezielt prüfen.
- Aktualisierter Dashboard-Abgleich am 19.10. vor Owner-Ausnahme: tatsächlich 80,75/10.000 Neurons, 9.919,25 Reserve. Messungen nach der erneuten Abnahme im Ausnahmeprotokoll.
- Abhängigkeitsaudit vom 19.10.: 3 high, 4 moderate, 1 low, 0 critical. Technische Erreichbarkeit/Patches vor weiteren Pilotkonten bzw. öffentlicher Freigabe prüfen. Details: [Readiness](public-cv-readiness.md). Keine automatische Risikoakzeptanz durch diesen Freeze.
- Smartphone: Nutzer bestätigt mobile Bedienung und englischen AI-Bildpfad. Text-AI-Liveflow im angemeldeten In-app-Browser bestanden; kein zusätzlicher physischer iPhone-Textnachweis behauptet.

Repository und Site bleiben privat. P01-Start erteilt keine Freigabe für P02/P03 oder den Acht-Personen-Haupttest.
