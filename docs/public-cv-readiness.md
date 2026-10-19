# Public-Repo-/CV-Readiness – 19. Oktober 2026

**Ergebnis:** private technische Fallstudie ist vorbereitet; öffentliche Veröffentlichung noch nicht freigegeben. Repository bleibt PRIVATE. Keine Lizenz oder Sichtbarkeit wurde eigenständig geändert.

## Sicherheits- und Privacy-Check

Im vorgefundenen Stand 178 getrackte Dateien und 272 erreichbare Git-History-Blobs intern geprüft: kein Treffer für den aktuellen Cloudflare-Token, typische GitHub-/OpenAI-Schlüssel oder Private-Key-Marker. Kein getracktes .env, keine gefundenen persönlichen Maschinenpfade oder Owner-Mailadresse. Ausgaben enthielten nur Zählwerte/Dateinamen, keine Secrets. Dies ist ein begrenzter Muster-/Wertscan, kein Beweis, dass keine anderen Geheimnisse existieren. Vor tatsächlichem Public-Schalten erneuten unabhängigen Secret-/History-Review machen.

Aktuelle Produktions-Dependency-Prüfung mit `pnpm audit --prod --json`: **3 high, 4 moderate, 1 low, 0 critical**. Die alte Aussage „0 advisories“ war ein historischer Snapshot und ist heute nicht gültig.

| Hoher Befund | Gefundene Version | Laut Advisory gepatcht ab | Vorläufige Einordnung |
|---|---|---|---|
| source-map-js: DoS über manipulierte Source Maps | 1.2.1 | 1.2.2 | Transitiv über Next/PostCSS; kein App-Pfad für Nutzer-Source-Maps gefunden, Laufzeit-/Build-Erreichbarkeit noch zu prüfen |
| sharp / librsvg | 0.35.4 | 0.35.5 | Optional transitiv über Next; App-Fotos werden browserseitig verarbeitet, das allein beweist keine Unbetroffenheit |
| Next Image Optimization SSRF | 16.3.6 | 16.3.8 | Kein next/image-Import im App-Code gefunden; der Worker enthält aber `_next/image`/`_vinext/image`-Routenerkennung. Nicht als ausgeschlossen bewerten |

Quellen: [Source Maps](https://github.com/advisories/GHSA-68fv-2mgg-jv7q), [sharp](https://github.com/advisories/GHSA-wq5f-xc86-pv6w), [Image Optimization](https://github.com/advisories/GHSA-cjq9-62q9-8jv4). Weitere Next-Befunde betreffen Cache/Draft-Mode/Metadata/Devserver; genaue Anwendbarkeit nicht nachgewiesen. Der Audit-Eintrag ist kein bestätigter Exploit unserer App. Private Owner-Freigabe ersetzt trotzdem keine Behebung/Triage.

Keine Pakete automatisch aktualisiert und kein kostenpflichtiger Scanner eingeführt. Nächster Security-Schritt: kleine separate Patch-/Erreichbarkeitsprüfung, kompatible Versionen und Release-Age-Policy beachten, Tests/TypeScript/Build und privaten Runtime-Smoke-Test durchführen. Offene hohe Findings schließen eine uneingeschränkte Public-/Security-Ready-Aussage aus.

## Veröffentlichungsvoraussetzungen

- Root-Lizenz fehlt (`licenseInfo=null`); Founder muss eine Lizenzentscheidung treffen. Vorhandene Drittanbieter-Lizenzdateien beibehalten; vollständige transitive Lizenz-/Assetprüfung noch offen.
- Runtime- und Auth-Abhängigkeit von Sites offen erklären. Ein frischer öffentlicher Clone ist noch nicht als unabhängig startbares Produkt verifiziert; CI läuft auf Linux mit vorhandenen Hilfsskripten. Clean-clone-Setup und sichere Beispieldaten vor Public prüfen.
- Hostingmanifest/Projektkennungen, lokale Betriebsdokumente, Testprotokolle und Screenshots vor Veröffentlichung auf unbeabsichtigte Account-/Studieninformationen prüfen. Keine privaten Rezeptbackups oder echten Nutzerinhalte veröffentlichen.
- README und PROJECT_STATUS wurden auf den tatsächlichen Stand korrigiert. Keine automatische Rezeptübersetzung, semantische Suche, große Testgruppe oder Production-Skalierung behaupten.
- Repository-Sichtbarkeit erst nach explizitem Veröffentlichungsauftrag und Abnahme dieser Punkte ändern.

## Glaubwürdiger CV-Entwurf

„My Cookbook – privates Software-/AI-Projekt: mehrsprachige Rezeptverwaltung mit React/TypeScript, Worker-Backend und SQLite-/Objektspeicher. Strukturierter Text-/Bildimport mit optionaler Cloudflare-KI, explizitem Review und persistierten Herkunftsmarkierungen; persönliche atomare Tagesquoten, Owner-Isolation, validierte Foto-Backups und CI mit 102 Tests, Typprüfung und Build.“

Die Umsetzung erfolgte mit Codex-Unterstützung. Im Portfolio transparent nennen; persönliche Architekturentscheidungen, Review und Verständnis konkret erläutern. Keine nachgewiesene große Nutzerbasis oder vollständig abgeschlossene Security-Abnahme behaupten. P01 ist Owner-Pilot, nicht unabhängige Marktvalidierung.

Gesprächspunkte: Warum ein versioniertes JSON-Notebook für Alpha reicht; atomare SQL-Reservierung statt verteiltem Billing; Authentifizierung versus Daten-Ownerprüfung; KI-Output als untrusted input; Backup-Upload vor State-Swap; Unterschied zwischen automatisierten Tests, Live-Nachweisen und offenen Gates. Die bekannten Einschränkungen sind Teil der Fallstudie.
