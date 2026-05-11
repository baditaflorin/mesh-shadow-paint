# Privacy threat model — mesh-shadow-paint

## What other peers in the same room can see

- Your role (`camera` or `lamp`) and a `Date.now()` timestamp for freshness.
- The current `rotationCounter` (an integer; bumped by any peer pressing
  reshuffle).
- Your **peerId** — a UUID generated and persisted in your `localStorage`.
  This is stable across sessions on the same browser. It is used as the seed
  for the deterministic palette index.

That is the entire payload. No photos. No camera frames. No microphone. No
location. No name.

## What stays local

- Your room ID and role choice are in `localStorage` and never leave your
  device.
- Your peerId is in `localStorage`. Anyone in the same room who logs the
  Yjs traffic can correlate your peerId with your IP for the duration of
  a session. If you don't want that, clear `localStorage` between sessions —
  you'll get a fresh peerId and a different palette slot.

## What the signaling server can see

`signaling-server` sees the **room name** (`mesh-shadow-paint:<roomId>`),
encrypted SDP blobs, and your IP. It does **not** see your role or palette
choice — those flow peer-to-peer over WebRTC DataChannel.

## What the TURN server can see

`coturn-hetzner` relays encrypted WebRTC traffic when peers cannot connect
directly. It sees IPs and encrypted bytes; it cannot decrypt them.

## Permissions asked

None. The browser does not request camera, mic, or motion permission — the
photo is taken with your native camera app pointed at the screens.

## What's NOT in the threat model

- Stable identity across browsers. peerId is per-browser, per-`localStorage`.
- Network observers. Hostile Wi-Fi sees the WebSocket and a TURN relay flow
  if needed; they cannot decrypt the contents.
