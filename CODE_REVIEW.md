# Code Review – Befunde

Review-Level: high · Datum: 2026-09-03 · Scope: `index.html`, `server.php`, `src/PingPong.php`, `composer.json`

## Bestätigte Findings (nach Verifikation)

### 1. Verworfene Updates führen zu dauerhaftem Desync
- **Datei:** `index.html:330`
- `sendData()` überspringt den WebSocket-Send stillschweigend, wenn der Socket gerade nicht `OPEN` ist. Es existiert keine `ws.onclose`/Reconnect-Logik im gesamten File.
- **Szenario:** Ein kurzer Netzwerkaussetzer (Mobilfunk-/WLAN-Wechsel, Tab im Hintergrund) lässt den Socket kurz abreißen. Ein in diesem Moment gescorter Punkt wird lokal übernommen (Score, Sätze, `matchFinished`), aber nie an den Gegner gesendet – und bleibt es auch für den Rest der Session, da nie neu verbunden wird.

### 2. Sync-Nachrichten überschreiben den eigenen Score des Gegners
- **Datei:** `index.html:147`
- Im `onmessage`-Handler werden `scoreA`/`scoreB`/`setsA`/`setsB` bedingungslos komplett vom empfangenen Wert überschrieben statt nur das Feld zu übernehmen, für das der Absender zuständig ist.
- **Szenario:** Beide Spieler drücken fast gleichzeitig "+ Punkt". Die Nachricht des einen (mit dem veralteten Stand des anderen) überschreibt dessen gerade erst lokal erhöhten Punkt – ein Punkt geht kommentarlos verloren.

### 3. Seiten-Reload wird fälschlich als "Gegner verlassen" interpretiert
- **Datei:** `src/PingPong.php:50`, `index.html:139`, `index.html:214`
- Ein Reload sieht serverseitig identisch aus wie ein Verbindungsabbruch: `onClose` sendet `opponent_left`, das andere Gerät zeigt einen Alert und resettet per `returnToSetup()` den kompletten Matchstand.
- **Szenario:** Ein Mobilbrowser lädt einen im Hintergrund liegenden Tab automatisch neu (oder versehentliches Pull-to-Refresh). Der Gegner bekommt einen Alarm und das Match wird auf 0:0 zurückgesetzt, obwohl das reloadende Gerät über `?g=` weiterhin im selben Raum ist und gar nicht aussteigen wollte.

### 4. Dritter Beitretender landet auf totem Spielbildschirm
- **Datei:** `index.html:147` (Aufruf), `index.html:229` (Definition), Ablehnung in `index.html:131`
- `startGame()` wird synchron direkt nach `ws.send(sync)` aufgerufen – bevor die asynchrone Serverantwort (`spiel_laeuft`, falls Raum voll) überhaupt eintreffen kann.
- **Szenario:** Ein Raum hat bereits 2 Spieler; ein drittes Gerät scannt den QR-Code. Es wechselt sofort auf den (veralteten Default-)Spielbildschirm, bevor die Ablehnung ankommt – die Fehlermeldung landet dann in einem bereits verstecktem `#statusText` und der Nutzer bleibt auf einem toten Screen hängen.

### 5. Fehlgeschlagene WebSocket-Verbindung bleibt für den Nutzer unsichtbar
- **Datei:** `index.html:124` (kein `onerror`/`onclose`), `index.html:108` (hartcodierte IP)
- **Szenario:** Handy ist nicht im selben LAN wie die hartcodierte IP, oder der Server läuft nicht. Der Host klickt "Spiel starten" und sieht nie einen QR-Code oder Fehler; der Gast bleibt für immer bei "Start in 5 Sekunden..." hängen – es gibt keinen Codepfad, der das meldet.

### 6. History-Puffer wird nie abgebaut – Zurück-Button bleibt blockiert
- **Datei:** `index.html:234` (Push-Loop), `index.html:214` (`returnToSetup` baut nichts ab)
- **Szenario:** Nach Matchende (Gegner verlässt, oder Match beendet + Reset) landet man wieder auf dem Start-Screen, aber ein Zurück-Tap "poppt" jetzt bis zu 20+ wirkungslose History-Einträge (keine sichtbare Änderung) durch, bevor die eigentliche vorherige Seite erreicht wird – bei mehreren Matches in einer Session summiert sich das.

### 7. Zu weit gefasster leerer `catch`-Block verschluckt Folgefehler
- **Datei:** `index.html:128`–`162`
- Der `try/catch` in `ws.onmessage` umschließt nicht nur `JSON.parse`, sondern auch alle State-Mutationen und DOM-Updates (`startGame`/`sendData`/`updateDisplay`), mit leerem `catch(e){}` ohne Logging.
- **Szenario:** Eine künftige Änderung entfernt/benennt eine von `updateDisplay()` genutzte DOM-ID um; die Exception wird lautlos verschluckt, nachdem State bereits mutiert wurde – beide Geräte zeigen inkonsistenten Stand, ohne jede Fehlerspur.

### 8. Keine Eindeutigkeitsprüfung für Raumcodes
- **Datei:** `index.html:168`, `src/PingPong.php:26`
- Raumcodes sind rein clientseitig generierte 6-stellige Zufallszahlen; der Server prüft nur die 2er-Kapazität, nicht die Zugehörigkeit.
- **Szenario:** Auf einem Server mit mehreren gleichzeitigen Matches (z.B. Turnier) generieren zwei unabhängige Paare zufällig denselben Code – der echte Partner wird dann fälschlich mit "Spiel bereits gestartet" abgewiesen.

## Cleanup-Findings

### 9. Nachrichten-Payload an 3 Stellen dupliziert
- **Datei:** `index.html:175` (u.a., analog in `sendData()` und der Sync-Nachricht)
- Das Objekt `{type, room, sender, nameA, nameB, scoreA, scoreB, setsA, setsB, matchFinished}` wird 3× identisch von Hand gebaut statt über eine gemeinsame Builder-Funktion.
- **Konsequenz:** Ein neues State-Feld muss an 3 Stellen von Hand ergänzt werden; wird eine vergessen, desynchronisiert genau dieser Nachrichtenpfad.

### 10. `opponent_left`-Alert ist noch blockierend
- **Datei:** `index.html:140` vs. `index.html:271`–`282`
- Inkonsistent zur bewusst nicht-blockierenden Banner-Lösung, die später im selben File für die Zurück-Navigations-Warnung eingeführt wurde.
- **Konsequenz:** Ein Spieler mitten im Ballwechsel bekommt beim Verbindungsabbruch des Gegners einen modalen Dialog, der die Seite bis zum manuellen Wegklicken einfriert – genau das UX-Problem, das die Banner-Umstellung eigentlich vermeiden sollte.

## Widerlegte Kandidaten (zur Referenz)

- **Server vertraut Raum-ID aus Nachricht statt gespeicherter Verbindung** (`src/PingPong.php:17,40`): Führt bei fehlendem Schlüssel nur zu einer harmlosen PHP-Warnung (`foreach` über `null`), kein Fatal Error – und mit dem echten Client praktisch nicht erreichbar.
- **Reentranz-Crash in `onClose()`**: Durch das serverseitige 2-Spieler-Limit pro Raum kann die für den Crash nötige Vorbedingung (Raum wird während der äußeren Schleife bereits geleert) nicht eintreten.
