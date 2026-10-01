# Mengen und Einheiten

Einzelmengen und Mengenbereiche werden getrennt gespeichert. Ein Bereich wie 8–10 verwendet `quantity: null` und `quantityRange: {min: 8, max: 10}`. Beide Grenzen skalieren mit den Portionen und werden in Einkaufslisten addiert. Alte Backups ohne Bereichsfeld bleiben gültig. Klar erkennbare alte Bereiche in Zutatenname oder Notiz werden beim Lesen strukturiert übernommen; vorhandene Rezepttexte bleiben als Quelle erhalten.

Der gemeinsame Katalog in `lib/units.ts` umfasst Gewichte, Volumina, Löffel, Zähleinheiten, Gebinde und grobe Küchenmaße, einschließlich deutscher und englischer Singular-/Pluralformen und Abkürzungen. Zusätzliche Einheiten können weiterhin manuell eingetragen werden. Unbekannte Mengen bleiben unbekannt. Die KI verwendet denselben Katalog; ihre Felder bleiben markiert.

Text-, Foto-OCR-, Webseiten- und KI-Imports verwenden die gemeinsame Mengenstruktur. Der Editor erlaubt beispielsweise `8–10`, `1 ½`, `1/2` und `1,25`; Einheiten haben Eingabevorschläge. Bereits gespeicherte Rezepte werden beim Neuladen normalisiert.

Eindeutige metrische Umrechnungen für Einkaufslisten: kg → g sowie l/cl/dl → ml. Keine automatische Umrechnung von Tassen, EL, TL, Prisen, Packungen, Volumen in Masse oder Pfund in pound/lb. Packungsgrößen bleiben in der Notiz, etwa `1 (400 g) can tomatoes` als eine Dose mit 400 g je Behälter. Ungefähre Angaben und gehäufte/gestrichene Löffel bleiben sichtbar.

Tests: Alle Katalogschreibweisen werden einzeln geprüft; zusätzlich beide gemeldeten Kräuterzeilen, Brüche/Dezimalzahlen, Bindestrich/en dash/bis/to, OCR-Ziffern, JSON-LD, alte Imports, KI-Ausgaben, Skalierung, Einkaufsliste und Backup. Der Browser-Eingabeablauf wurde in dieser Umgebung nicht automatisiert getestet.
