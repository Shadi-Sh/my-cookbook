# Alpha-KI-Verbrauch – 3. Oktober 2026

Free-Tarif erneut im Dashboard bestätigt, kein Upgrade oder Gateway. Ausgangswert in Workers AI: **23,43 / 10.000 Neurons heute**. Zwei ausdrücklich autorisierte synthetische REST-Messaufrufe mit identischem Produktionsmodell, Prompt und Limit (3.000 Ausgabetokens, Thinking aus), keine echten privaten Rezepte. Sie laufen außerhalb des App-Zählers als begrenzte technische Messung; keine Umgehung von Endnutzerquoten angeboten.

| Fall | Tatsächlich zurückgegebene Eingabetokens | Ausgabetokens | HTTP / Schema |
|---|---:|---:|---|
| Deutscher Rezepttext mit fünf Zutaten und drei Schritten | 823 | 743 | 200 / gültiger Rezeptentwurf |
| Zwei EN-Rezeptseiten, gemeinsam als JPEG, Ausgabe DE | 981 | 623 | 200 / gültiger Rezeptentwurf |

Es werden nur numerische Usage-Werte, Zeitpunkte, HTTP-Status und Schemaerfolg gespeichert. Keine Tokens/Secrets, Bilder oder Rezeptantworten in der Messdatei.

[Offizielle Modellpreise](https://developers.cloudflare.com/workers-ai/platform/pricing/) nennen für Gemma 4: 9.091 Neurons/Million Eingabetokens und 27.273/Million Ausgabetokens. Daraus **berechnet**, nicht separat vom Dashboard je Anfrage gemessen: Text 27,75 Neurons; Bild 25,91 Neurons; zusammen 53,65. Bei 16 vergleichbaren Anfragen täglich mit dem größeren dieser Werte: ca. 444 Neurons, somit ca. 9.556 Neurons (95,6 %) Reserve vor sonstiger Kontonutzung. Das ist eine Hochrechnung aus einer kleinen Stichprobe, keine Worst-Case-Garantie für maximale Texte oder vier sehr lange Bilder.

Die unmittelbar nach den Messaufrufen gelesene Dashboardanzeige stand noch bei 23,43. Ein aktualisierter Gesamtwert muss nach Statistikverzögerung nachgewiesen werden; eine rechnerisch erwartete Anzeige von ca. 77,08 darf nicht als abgelesene tatsächliche Neuron-Messung ausgegeben werden. Haupttest-Freigabe verlangt diesen Abgleich. Bei Knappheit oder anderen Verbrauchern erneut Founder-Entscheidung, niemals eigenständiges Paid-Upgrade. Persönliche App-Kontingente isolieren Nutzer, die kostenlose Providergrenze bleibt kontoweit.
