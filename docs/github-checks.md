# Automatische GitHub-Prüfungen

Jeder Pull Request und jede Änderung auf `main` führt Tests, Typprüfung und Website-Build aus. Ein Lauf kann außerdem manuell gestartet werden, sobald die Workflow-Datei auf dem Standardbranch liegt.

Die Umgebung nutzt Node.js 24 und die pnpm-Version aus `package.json`. Abhängigkeiten werden mit dem vorhandenen Installationsskript und unveränderter Sperrdatei installiert. Die verwendeten GitHub-Aktionen sind auf feste Commit-Versionen festgelegt.

Die Prüfung benötigt weder Cloudflare-Zugangsdaten noch KI-Aufrufe. Sie veröffentlicht keine Website. Der Zugriff auf das Repository ist auf Lesen begrenzt. Ein Prüflauf endet spätestens nach 15 Minuten; ein neuer Stand desselben Pull Requests beendet dessen vorherigen Lauf. Branch-Push und Pull Request lösen nicht mehr zwei parallele Prüfungen derselben Änderung aus.

Die Ergebnisse stehen im Pull Request unter „Checks“. Ein grünes Ergebnis bestätigt Tests, Typprüfung und Build; es ersetzt keine Bedienprüfung im Browser. Pflichtprüfungen vor dem Zusammenführen sind noch nicht als Branch-Schutz eingerichtet.
