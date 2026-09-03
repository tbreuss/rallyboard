# 🏓 Ping Pong Live Scoreboard

A live table tennis scoreboard for two players on two separate devices (e.g. two phones, or a phone and a laptop), synced in real time peer-to-peer via WebRTC.

## How it works

`index.html` is a single, static, self-contained page (vanilla JS, no build step, no backend) that:

- lets the first player start a match, generating a QR code, a shareable link, and a 6-digit code for the opponent to join,
- lets the second player join by scanning the QR code, opening the link, or just typing in the 6-digit code — each connects directly to the first player's device over a [PeerJS](https://peerjs.com/) (WebRTC) data channel,
- tracks score, sets, and serve order locally per device and broadcasts every change to the other device directly over that peer-to-peer connection,
- shows a winner overlay 🏆 once a player wins 3 sets (11 points per set, win by 2),
- keeps the screen awake during a match (Screen Wake Lock API) and makes a best-effort attempt to block accidental back-navigation while a match is active.

There is no custom server to run: PeerJS's free public broker (`0.peerjs.com`) is used only briefly, to help the two devices find each other and establish the initial WebRTC connection. Once connected, all match data (scores, names, match state) flows directly between the two devices — the broker never sees it.

## Requirements

- Both devices need a working internet connection at the moment of pairing (to reach the public PeerJS broker), even if they're on the same local network.
- A way to serve `index.html` so both devices can open the exact same URL (any static file host works — e.g. GitHub Pages, Netlify, or a simple local static server).

## Setup

No installation or build step — `index.html` is the entire app. Just make it reachable at one URL both devices can open, for example:

```bash
python3 -m http.server 8000
```

then open that URL in a browser on each device.

## Usage

1. Player A opens the page, enters their name, and taps **Start Match**.
2. Player B opens the page, enters their name, taps **Join Match**, and either scans the displayed QR code / opens the shared link, or just types in the 6-digit code shown under it.
3. Both devices now show the live scoreboard — each player taps **+ Point for me** / **- My error** on their own device to update the score, which is instantly mirrored on the other device.
4. The match ends automatically once one player wins 3 sets; **Reset Match** starts a fresh match with the same opponent.

## Notes

- Pairing has no authentication — anyone with the join link/QR code can connect as the second player, as long as they reach it before someone else does.
- There is no reconnect logic: if the peer-to-peer connection drops mid-match, the match cannot resync automatically (see `CODE_REVIEW.md` for known limitations from an earlier version of this app; most still apply conceptually to the WebRTC version).
