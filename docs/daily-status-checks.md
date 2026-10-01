# Tageslimit und Prüfung ohne KI-Anfragen

Im Rezepteditor zeigt „Mit KI ausfüllen“ verbleibende Aufrufe und den nächsten Reset an. Die Zeit wird in der Zeitzone des Geräts dargestellt. Grundlage ist derselbe D1-Zähler wie bei Modellaufrufen. Der Reset erfolgt täglich um 00:00 UTC; fehlgeschlagene Aufrufe zählen mit. Statusabfragen verbrauchen keine KI-Anfrage.

Die Anzeige wird beim Öffnen, bei Rückkehr zum Fenster, einmal pro Minute bei sichtbarer Seite und nach einer Auswertung aktualisiert. Bei ausgeschöpftem Tageslimit sind KI-Auswertungen deaktiviert. Manuelles Bearbeiten, Text- und Webseitenimport bleiben nutzbar. Der Server erzwingt das Limit weiterhin atomar; die Anzeige ersetzt diese Prüfung nicht.

Ohne Modellaufrufe geprüft: Rezept anlegen, in einer lokalen SQL-Testdatenbank speichern, erneut laden, bearbeiten, Änderungshistorie erhalten, erneutes Speichern, veraltetes Überschreiben ablehnen, KI-Prüfstatus erhalten, Mengenbereich für andere Portionen skalieren, Einkaufslisten-Häkchen erhalten und Backup wieder einlesen. Es wurden keine echten gespeicherten Nutzerrezepte verändert. Zusätzlich bestehen die Import- und Einheitenprüfungen.

Die lokale Datenbankprüfung bestätigt die Serverlogik; sie ist kein vollständiger Browser- oder Produktionstest. In dieser Umgebung ist die Browserprüfung weiterhin nicht verfügbar.
