# ppc — Ping Pong Counter 🏓

A live table tennis scoreboard for two players on two separate devices (e.g. two phones, or a phone and a laptop), synced in real time over a WebSocket.

## How it works

- **`server.php`** starts a WebSocket relay server (built on [Ratchet](https://github.com/ratchetphp/Ratchet)) that pairs up to two connected clients per "room" and forwards messages between them. It does not track scores itself — it's a pure message relay.
- **`index.html`** is a single-page app (vanilla JS, no build step) that:
  - lets the first player start a game and generates a room code plus a QR code / shareable link for the opponent to join,
  - lets the second player join by scanning the QR code or opening the link,
  - tracks score, sets, and serve order locally per device and broadcasts every change to the other device over the WebSocket connection,
  - shows a winner overlay 🏆 once a player wins 3 sets (11 points per set, win by 2),
  - keeps the screen awake during a match (Screen Wake Lock API) and makes a best-effort attempt to block accidental back-navigation during a game.

## Requirements

- PHP with [Composer](https://getcomposer.org/)
- Both devices on the same local network as the machine running `server.php`

## Setup

```bash
composer install
```

Edit the `WEBSOCKET_SERVER` constant near the top of the `<script>` tag in `index.html` to point at the local IP address of the machine that will run `server.php`:

```js
const WEBSOCKET_SERVER = "ws://<your-local-ip>:9999";
```

Start the WebSocket server:

```bash
php server.php
```

Serve `index.html` over HTTP so it's reachable from both devices (e.g. `php -S 0.0.0.0:8000`), then open it in a browser on each device.

## Usage

1. Player A opens the page, enters their name, and taps **Start Game**.
2. Player B scans the displayed QR code (or opens/enters the shared link) on their own device and enters their name.
3. Both devices now show the live scoreboard — each player taps **+ Point for me** / **- My error** on their own device to update the score, which is instantly mirrored on the other device.
4. The match ends automatically once one player wins 3 sets; **Reset Match** starts a fresh match in the same room.

## Notes

- The room-join protocol is a simple relay with no authentication — anyone with the room's join link/QR code on the same network can join as the second player.
- There is no reconnect logic: if a device's connection drops mid-match, the match cannot resync automatically (see `CODE_REVIEW.md` for known limitations of the current implementation).
