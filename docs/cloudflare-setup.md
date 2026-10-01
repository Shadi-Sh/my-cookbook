# Cloudflare kostenlos verbinden

Die App ist technisch vorbereitet, aber ohne Zugang ausgeschaltet. Der erste Modellaufruf wurde mit HTTP 401 abgelehnt: lokal stand die Account-ID auch im Token-Feld. Rezept- und Bildqualität sind deshalb noch nicht live bestätigt.

1. Kostenloses Cloudflare-Konto erstellen: https://dash.cloudflare.com/sign-up . Keine kostenpflichtige Workers-Erweiterung aktivieren.
2. Im Dashboard Workers AI öffnen und „Use REST API“ wählen. Für das eigene Konto einen Workers-AI-Token mit Workers AI Read und Edit erstellen; keinen globalen API-Schlüssel verwenden. Account-ID notieren.
3. Modell: `@cf/google/gemma-4-26b-a4b-it`, bei Cloudflare gehostet, Apache-2.0-Lizenz. Kein Aufruf zur Zustimmung zu einer Meta-Lizenz.
4. Zugang über die sichere Sites-Konfiguration hinterlegen, nicht im Chat: `CF_AI_ACCOUNT_ID` und `CF_AI_TOKEN` (Token als Geheimnis). Nach Prüfung des kostenlosen Tarifs `CF_AI_FREE_ONLY_CONFIRMED=true`. Eine gespeicherte Site-Version erneut deployen, um die Werte anzuwenden. Lokale Entwicklung verwendet entsprechend benannte Variablen in einer ignorierten `.env`.
5. Danach mit einem öffentlichen Beispielrezept testen, Mengen/Schritte gegen die Quelle vergleichen, Zeit-Schätzungen prüfen und Prüfstatus nach Speichern/Neuladen/Backup kontrollieren. Erst dann private Rezeptbilder ausprobieren.

Die App begrenzt alle Modellanfragen zusammen auf fünf täglich (UTC), zählt fehlgeschlagene Aufrufe mit, begrenzt Bilder und Ausgabe und wiederholt Anfragen nicht automatisch. Cloudflare selbst stellt im Free-Tarif nach Ausschöpfung des kostenlosen Kontingents Anfragen ein. Das Tageslimit der App ist keine Zusicherung, dass das Cloudflare-Kontingent immer ausreicht, insbesondere wenn andere Apps dasselbe Konto nutzen. Keine kostenpflichtige Alternative aktiviert. Bei späterer Tarifänderung Verbindung vor weiterer Nutzung neu prüfen.

Bis zu vier Bilder werden auf dem Gerät in gewählter Reihenfolge zu einem Bild kombiniert. Sehr lange Bilder müssen enger zugeschnitten werden; die tatsächliche Modellqualität für mehrseitige Rezepte ist noch unbestätigt. Fehlende Zutatenmengen werden nicht geschätzt. Automatisch erzeugte Zeiten und Portionszahlen werden konservativ immer als Schätzung gekennzeichnet, auch wenn das Modell eine Quellenangabe behauptet. Zutaten/Schritte erhalten zunächst eine gemeinsame Kennzeichnung pro Feldgruppe.

Quellen: https://developers.cloudflare.com/workers-ai/get-started/rest-api/ ; https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/ ; https://developers.cloudflare.com/workers-ai/platform/pricing/
