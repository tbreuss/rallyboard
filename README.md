# 🏓 Ping Pong Pro Zähler

Ein Punktezähler für Tischtennis auf **einem** geteilten Bildschirm – kein Netzwerk, keine zweite Verbindung, kein Server. Zwei Spieler stehen/sitzen sich an einem Gerät gegenüber, jede Bildschirmhälfte gehört einem Spieler.

## Funktionsweise

`index.html` ist eine einzelne, statische Seite (kein Build, kein Backend) mit:

- geteiltem Bildschirm, je eine Hälfte pro Spieler: im Hochformat oben/unten, im Querformat links/rechts,
- Punktezählung nach Tischtennis-Regeln (11 oder 21 Punkte pro Satz, 2 Punkte Vorsprung nötig; Aufschlagwechsel alle 2 bzw. 5 Punkte, im Einstand nach jedem Punkt),
- einstellbarem Match-Modus (Best of 3 / 5 / 7),
- automatischem Seitenwechsel nach jedem Satz (ITTF-Regel 2.11),
- deutscher Sprachansage (`SpeechSynthesis`),
- Sieger-Overlay mit Endstand und **Neues Spiel**-Button; Zählen, Seiten tauschen und Aufschlag wechseln sind dann gesperrt.

Einstellungen (Punkte pro Satz, Anzahl der Sätze) bleiben im `localStorage` erhalten. Die App hat ein Web-App-Manifest und lässt sich auf dem Home-Bildschirm starten (`orientation: any`).

## Bedienung

**Touch (Smartphone/Tablet):**
- Kurzes Antippen der eigenen Bildschirmhälfte = **+1 Punkt**
- Nach unten wischen = **-1 Punkt** (Korrektur)

**Tastatur (Desktop):**
- **A** / **←** = linke Hälfte (im Hochformat: obere), **B** / **→** = rechte Hälfte (im Hochformat: untere)
- Kurz drücken = **+1 Punkt**, gedrückt halten (>500ms) und loslassen = **-1 Punkt**

Tastatur und Touch folgen der **aktuell angezeigten** Hälfte. Nach einem Seitenwechsel steuert z.B. **A** / **←** weiterhin den Spieler, dessen Box gerade links bzw. oben liegt.

**Menü** (im Querformat oben an der Trennlinie, im Hochformat in der Mitte):
- **Einstellungen** – Punkte pro Satz (11 / 21) und Sätze (Best of 3 / 5 / 7); Übernehmen startet das Match neu
- **Match zurücksetzen** – setzt das laufende Match sofort zurück (Ansage: „Neues Spiel“)
- **Seiten tauschen** – wechselt manuell, welche Hälfte wo angezeigt wird (Ansage: „Seiten gewechselt“)
- **Aufschlag wechseln** – korrigiert, wer aufschlägt (Ansage: „Aufschlag links“ oder „Aufschlag rechts“ – linke/obere bzw. rechte/untere Hälfte)
- **Hilfe** – Kurzanleitung in der App

## Sprache

| Ereignis | Ansage |
|---|---|
| Punkt | Stand in Anzeige-Reihenfolge, z.B. „3 zu 2“ |
| Satzgewinn | „Satzgewinn Links/Rechts. Seiten wechseln.“ |
| Match-Ende | „Match vorbei! Sieg für Links/Rechts“ |
| Match zurücksetzen / Neues Spiel | „Neues Spiel“ |
| Seiten tauschen (Menü) | „Seiten gewechselt“ |
| Aufschlag wechseln (Menü) | „Aufschlag links“ / „Aufschlag rechts“ |

„Links“/„Rechts“ bei Satzgewinn und Sieg bezeichnen die beiden Spieler (die ursprünglich linke bzw. rechte Seite), unabhängig vom letzten Tausch. Die Aufschlag-Ansage folgt der **sichtbaren** Hälfte.

Der automatische Aufschlagwechsel nach Punkten wird nicht extra angesagt – nur der neue Stand.

## Setup

Kein Build, keine Abhängigkeiten – `index.html` ist die ganze App. Lokal reicht ein beliebiger statischer Server, z.B.:

```bash
python3 -m http.server 8000
```

dann die Seite auf dem Gerät öffnen, das zwischen den Spielern liegt.

## Tests

QUnit-Tests liegen unter `tests/index.html` (gleiche Origin wie die App, Settings in `localStorage` werden von den Tests gesichert und wiederhergestellt).

## Bekannte Einschränkung

Die Sprachausgabe (`SpeechSynthesis`) funktioniert nachweislich **nicht in Brave** (Browser-spezifischer Bug in Braves Speech-Engine, kein Fehler in dieser App) – getestet und bestätigt in Chrome und Safari. Für die Sprachansage bitte einen anderen Browser als Brave verwenden.
