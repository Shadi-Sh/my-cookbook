# Text-/Bild-Requestvergleich – 19. Oktober 2026

## Korrigierter Nutzer-Nachweis

Der erfolgreiche englische Rezeptbildtest auf echtem Smartphone nutzte Cloudflare AI. Mobiler AI-Bildpfad live bestanden, nicht bloß lokale OCR. Zwei historische Text-only-Fehler bleiben ein eigener Befund. Ursprüngliche Einzelursache der alten Referenz wird nicht rückwirkend behauptet.

## Vergleich des tatsächlichen Codes

`providerRequest()` erstellt dieselbe user-Message und dieselben Einstellungen: Gemma 4, Thinking aus, temperature 0.1, kein Streaming, maximal 3.000 Ausgabetokens. Text-only setzt content als String. Mit Bild besteht content aus [{type:text,text:prompt},{type:image_url,image_url:{url:data:image/jpeg;base64,...}}]. Prompt und Quelle stehen in beiden Fällen im Textteil. Text und Bild passieren anschließend denselben Provider-Response-Decoder, providerText() und parseAIResult(). Der Unterschied sitzt vor dem gemeinsamen Rückweg.

Der Providertext wird aus success:true und result.choices[0].message.content gelesen. Bekannte abgeschnittene Ausgaben werden separat abgelehnt. Der bereits veröffentlichte Fix für unbekanntes yield:null gilt für beide Pfade. Es gibt keinen belegten Anlass, das bestätigte Antwortformat auf result.response umzustellen oder Validierung allgemein zu lockern.

## Kontrollierter Live-Vergleich

Identischer synthetischer englischer Rezepttext ohne Portionsangabe, DE-Ausgabe, identischer vollständiger Produktionsprompt und Modellkontrollen, ausschließlich content-Form variiert:

| Variante | HTTP | Dauer | finish_reason | Rezeptvalidierung |
|---|---:|---:|---|---|
| content als String (aktueller Textpfad) | 200 | 22,76 s | stop | gültig: 5 Zutaten, 3 Schritte |
| content als Liste mit einem Text-Part | 200 | 19,84 s | stop | gültig: 5 Zutaten, 3 Schritte |

Beide Antworten waren gültiges JSON und wurden durch die aktuelle strenge Rezeptvalidierung akzeptiert. Der Eingabetext blieb zwischen beiden Varianten identisch; keine Nutzerrezepte oder Providerantworten geloggt. Nur statische Variante, Status, Dauer, Endegrund und Anzahl der Strukturelemente dokumentiert. Zwei begrenzte direkte Provider-Diagnoseaufrufe außerhalb der App-Quota; kein Endnutzer-Bypass, keine Quota-Rücksetzung oder automatische Wiederholung eingeführt.

Ergebnis: Ein genereller Defekt des String-content-Formats ist durch diesen Vergleich nicht belegt. Eine zusätzliche Laufzeitänderung allein aufgrund der unterschiedlichen Darstellung wäre spekulativ. Der vorangegangene konkrete yield:null-Fehler bleibt reproduziert und behoben; siehe ai-text-diagnosis-2026-10-05.md.

## Vollständiger Live-Seitentest

Die unterstützte Browsersteuerung ist wieder erreichbar. Beim vorhandenen Cookbook-Tab war die Sitzung jedoch abgelaufen. „Continue with ChatGPT“ führt zur normalen Anmeldemaske; Nutzer wurde um eigene Anmeldung gebeten. Noch kein authentifizierter Textimport über POST /api/recipe-ai, Review oder Speichern in dieser Sitzung nachgewiesen. Direkte Live-Providererfolge dürfen nicht als iPhone-/Site-End-to-End-Nachweis ausgegeben werden.

Nach Anmeldung: synthetischen Text eingeben, Consent ausdrücklich setzen, einen persönlichen Versuch nutzen, gültige Vorschläge prüfen, Titel/Notiz bearbeiten, bewusst speichern und nach Reload wiederfinden. Bei Fehler feste Fehlerkategorie und Referenz erfassen; Inhalte/Secrets bleiben außerhalb von Logs. Kein neuer Funktionsumfang.

Bestehende 102 automatisierte Tests am 19.10. erneut bestanden. Kein produktiver Code geändert und kein erneutes Website-Deployment für diese Dokumentationskorrektur erforderlich.
