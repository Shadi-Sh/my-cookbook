# Alpha-KI-Verbrauch – 3. Oktober 2026

Free-Tarif erneut im Dashboard bestätigt, kein Upgrade oder Gateway. Ausgangswert in Workers AI: **23,43 / 10.000 Neurons heute**. Zwei ausdrücklich autorisierte synthetische REST-Messaufrufe mit identischem Produktionsmodell, Prompt und Limit (3.000 Ausgabetokens, Thinking aus), keine echten privaten Rezepte. Sie laufen außerhalb des App-Zählers als begrenzte technische Messung; keine Umgehung von Endnutzerquoten angeboten.

| Fall | Tatsächlich zurückgegebene Eingabetokens | Ausgabetokens | HTTP / Schema |
|---|---:|---:|---|
| Deutscher Rezepttext mit fünf Zutaten und drei Schritten | 823 | 743 | 200 / gültiger Rezeptentwurf |
| Zwei EN-Rezeptseiten, gemeinsam als JPEG, Ausgabe DE | 981 | 623 | 200 / gültiger Rezeptentwurf |

Es werden nur numerische Usage-Werte, Zeitpunkte, HTTP-Status und Schemaerfolg gespeichert. Keine Tokens/Secrets, Bilder oder Rezeptantworten in der Messdatei.

[Offizielle Modellpreise](https://developers.cloudflare.com/workers-ai/platform/pricing/) nennen für Gemma 4: 9.091 Neurons/Million Eingabetokens und 27.273/Million Ausgabetokens. Daraus **berechnet**, nicht separat vom Dashboard je Anfrage gemessen: Text 27,75 Neurons; Bild 25,91 Neurons; zusammen 53,65. Bei 16 vergleichbaren Anfragen täglich mit dem größeren dieser Werte: ca. 444 Neurons, somit ca. 9.556 Neurons (95,6 %) Reserve vor sonstiger Kontonutzung. Das ist eine Hochrechnung aus einer kleinen Stichprobe, keine Worst-Case-Garantie für maximale Texte oder vier sehr lange Bilder.

Die unmittelbar nach den Messaufrufen gelesene Dashboardanzeige stand noch bei 23,43. Ein aktualisierter Gesamtwert muss nach Statistikverzögerung nachgewiesen werden; eine rechnerisch erwartete Anzeige von ca. 77,09 darf nicht als abgelesene tatsächliche Neuron-Messung ausgegeben werden. Haupttest-Freigabe verlangt diesen Abgleich. Bei Knappheit oder anderen Verbrauchern erneut Founder-Entscheidung, niemals eigenständiges Paid-Upgrade. Persönliche App-Kontingente isolieren Nutzer, die kostenlose Providergrenze bleibt kontoweit.

## Live-Quota-Abnahme nach Veröffentlichung

Private Veröffentlichung erfolgreich am 03.10.2026, Commit `a7bc4cb9a513d005035a02dda19c7550f7f2e424`, unveränderte Secrets/Freigaben. Live-Anzeige zuerst **2/2**, nach erfolgreicher synthetischer Textanfrage **1/2**, Vorschläge ausdrücklich noch nicht übernommen. Eine zweite Anfrage mit dem zweiseitigen Test-JPEG wurde gestartet. Danach blockierte die administrative Browser-Sicherheitsprüfung sowohl Cloudflare als auch My Cookbook. Keine Umgehung; Abschluss/0/2-UI und Library-Bearbeitung bei ausgeschöpfter persönlicher Quota werden deshalb nicht als bestanden behauptet. Zwei zusätzliche Live-App-Testanfragen sind getrennt von den zwei REST-Messaufrufen zu berücksichtigen; der erwartete reine REST-Deltawert kann nicht mehr allein dem kontoweiten Tagesgesamtwert zugeordnet werden.

Vor Haupttest aktualisierte Dashboard-Tageszahl manuell bestätigen und `Reserve = 10.000 - Tageszahl` dokumentieren. Bei starken Abweichungen von der Stichprobe oder verbleibender Knappheit Founder-Entscheidung einholen. Die gemessenen Tokenzahlen lassen bislang keine knappe Reserve bei vergleichbaren Alpha-Rezepten erkennen, sind aber kein Ersatz für die offene tatsächliche Dashboard-Ablesung.

Nutzerbericht vom 03.10.: Persönliches Tageskontingent erreicht; Login, Navigation, Suche, Rezeptöffnung, Bearbeiten, Speichern und Reload funktionieren auf echtem Smartphone trotzdem. Damit ist die Nutzbarkeit der Library bei ausgeschöpfter KI-Quota praktisch bestätigt. Exakter 0/2-Anzeigetext und Reset selbst wurden nicht separat bestätigt. KI-Bildimport am Smartphone bleibt bis zum separaten Versuch nach Reset offen.
