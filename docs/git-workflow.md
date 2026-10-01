# Git und GitHub für My Cookbook

Die bestehende Git-Historie bleibt erhalten. GitHub wird als privates Repository eingerichtet; die Veröffentlichung der Website erfolgt weiterhin über Sites.

## Ablauf für weitere Änderungen

1. Aktuellen Stand und lokale Änderungen prüfen.
2. Für zusammengehörige Änderungen einen eigenen Branch verwenden.
3. Änderungen mit aussagekräftigen Commit-Nachrichten speichern.
4. Passende Tests und Typprüfung ausführen; bei Änderungen an der Website zusätzlich den Build prüfen.
5. Branch nach GitHub übertragen und Änderungen über einen Pull Request nachvollziehbar machen.
6. Nach Abschluss die freigegebene Version übernehmen und die Website über Sites veröffentlichen.

## Zugangsdaten und gespeicherte Daten

`.env` bleibt ausgeschlossen. Cloudflare-Zugangsdaten werden als Sites-Geheimnisse verwaltet. Rezeptdaten und private Rezeptfotos liegen in D1 beziehungsweise R2 und werden nicht in das Quellcode-Repository kopiert. Lokale Laufzeitdateien, Abhängigkeiten und erzeugte OCR-Dateien bleiben ebenfalls ausgeschlossen.

Die GitHub-Verbindung verwendet den Remote-Namen `github`, damit die Sites-Veröffentlichung unabhängig davon erhalten bleibt.
