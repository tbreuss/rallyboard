# 🏓 Ping Pong Pro Zähler

Ein Punktezähler für Tischtennis auf **einem** geteilten Bildschirm – kein Netzwerk, keine zweite Verbindung, kein Server. Zwei Spieler stehen/sitzen sich an einem Gerät gegenüber, jede Bildschirmhälfte gehört einem Spieler.

## Funktionsweise

`index.html` ist eine einzelne, statische Seite (kein Build, kein Backend) mit:

- geteiltem Bildschirm (links/rechts), je eine Hälfte pro Spieler,
- Punktezählung nach Tischtennis-Regeln (11 Punkte pro Satz, 2 Punkte Vorsprung nötig; Aufschlagwechsel alle 2 Punkte, ab 10:10 nach jedem Punkt),
- automatischem Seitenwechsel nach jedem Satz (ITTF-Regel 2.11),
- deutscher Sprachansage des Punktestands nach jedem Punkt (`SpeechSynthesis`),
- Sieger-Overlay nach 3 gewonnenen Sätzen mit Endstand und "Neues Spiel"-Button; alle anderen Eingaben sind dann gesperrt.

## Bedienung

**Touch (Smartphone/Tablet):**
- Kurzes Antippen der eigenen Bildschirmhälfte = **+1 Punkt**
- Nach unten wischen = **-1 Punkt** (Korrektur)

**Tastatur (Desktop):**
- **A** / **←** = linke Bildschirmhälfte, **B** / **→** = rechte Bildschirmhälfte
- Kurz drücken = **+1 Punkt**, gedrückt halten (>500ms) und loslassen = **-1 Punkt**

Die Tasten-/Touch-Zuordnung folgt immer der **aktuell angezeigten** Seite – nach einem automatischen Seitenwechsel steuert z.B. die linke Pfeiltaste weiterhin den Spieler, dessen Box gerade links zu sehen ist.

**Menü (oben):**
- **Reset** – setzt das laufende Match sofort zurück
- **Tauschen** – wechselt die Seiten manuell

## Setup

Kein Build, keine Abhängigkeiten – `index.html` ist die ganze App. Lokal reicht ein beliebiger statischer Server, z.B.:

```bash
python3 -m http.server 8000
```

dann die Seite auf dem Gerät öffnen, das zwischen den Spielern liegt.

## Bekannte Einschränkung

Die Sprachausgabe (`SpeechSynthesis`) funktioniert nachweislich **nicht in Brave** (Browser-spezifischer Bug in Braves Speech-Engine, kein Fehler in dieser App) – getestet und bestätigt in Chrome und Safari. Für die Sprachansage bitte einen anderen Browser als Brave verwenden.
