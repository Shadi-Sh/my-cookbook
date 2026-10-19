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

## Vollständiger Live-Seitentest: bestanden am 19. Oktober 2026

Nach eigener Anmeldung des Nutzers wurde der komplette Text-only-Flow über die authentifizierte produktive Site geprüft, nicht nur per direktem Provideraufruf:

1. Neues Rezept, ausschließlich synthetischen englischen Rezepttext in „Rezepttext für KI“ eingegeben, kein Bild ausgewählt. Consent gesetzt. Persönliches Kontingent vor Aufruf 2/2.
2. „KI-Entwurf erstellen“ erfolgreich: Vorschläge für fünf Zutaten, drei Schritte und markierte Zeitschätzungen. Kontingent danach 1/2. Sammlung zu diesem Zeitpunkt unverändert bei acht Rezepten; Editorfelder blieben bis zur ausdrücklichen Übernahme leer.
3. „In den Entwurf übernehmen und prüfen“: 200 g Pasta, 100 ml Sahne, 2 Zehen Knoblauch, 8–10 Blätter Basilikum und 2–3 Zweige Thymian oder Oregano gegen die Quelle geprüft. Drei Schritte stimmen mit der Quelle überein.
4. Titel auf `Alpha Text-AI Live 2026-10-19` geändert, synthetische Prüfnotiz ergänzt. Zutaten und Schritte als geprüft markiert; Zeiten als ungeprüfte KI-Schätzungen bewusst „So übernommen“. Vorgabe von zwei Testportionen manuell belassen; keine aus der Quelle belegte Portionszahl behauptet.
5. „Rezept speichern“ ausdrücklich geklickt. Nach erfolgreicher Detailansicht Seite neu geladen, Rezept über den vollständigen Testtitel gesucht und geöffnet.
6. Titel, Notiz, fünf Zutaten, drei Schritte, Mengenbereiche und alle sechs Herkunfts-/Prüfmarkierungen nach Reload vorhanden. Der synthetische Datensatz bleibt zur Sichtprüfung gespeichert; keine bestehenden Nutzerrezepte geändert oder gelöscht.

Screenshot lokal unter `alpha-gate-evidence/text-ai-live-2026-10-19.png` im Projekt-Arbeitsbereich gesichert. Nachweis gilt für den angemeldeten In-app-Browser; kein neuer physischer iPhone/Safari-Test behauptet. Mobiler AI-Bildpfad bleibt durch Nutzerbericht live bestätigt. Die ursprünglichen fehlgeschlagenen Textrequests sind mangels identischer Quelle/zugehöriger Diagnostik weiterhin nicht einzeln retrospektiv zugeordnet; ein genereller Defekt des aktuellen Text-only-Pfads ist nicht reproduziert.

Bestehende 102 automatisierte Tests am 19.10. erneut bestanden. Kein produktiver Code geändert und kein erneutes Website-Deployment für diese Dokumentationskorrektur erforderlich. Keine neuen Features, Formatumstellung, Quota-Rücksetzung oder zusätzlichen externen Dienste.
