# Frontend Documentation

## Architecture

The frontend is split into:

- Pages: orchestration only
- Hooks: side effects and lifecycle
- Stores: shared state via Zustand
- Lib services: socket/api/webrtc abstractions
- Components: rendering only

## Core Files

- `src/hooks/useWebRTC.ts`: peer connection lifecycle, signaling events, ICE queueing
- `src/hooks/useSocket.ts`: socket connection and room presence listeners
- `src/lib/webrtc.ts`: `WebRTCService` wrapper for `RTCPeerConnection`
- `src/store/*`: auth, room, media, call state

## State Model

- `authStore`: user and token
- `roomStore`: participants and room list
- `mediaStore`: local stream and mute/camera toggles
- `callStore`: call status, remote stream, remote peer id

## Updated WebRTC Lifecycle

1. Ensure local media exists.
2. Create fresh peer connection for a call leg.
3. Add local tracks before creating offer/answer.
4. Emit `offer` or `answer` through Socket.IO.
5. Queue incoming ICE until remote SDP is applied.
6. Flush queued ICE after `setRemoteDescription`.
7. Set remote stream from `event.streams[0]` with track fallback.
8. Teardown call cleanly on `call-ended`, peer disconnect, or unmount.

## Signaling Events Used

- `offer`
- `answer`
- `ice-candidate`
- `call-ended`
- `user-disconnected`

## Stability Fixes Included

- Listener binding race fixed (listeners attach even if socket appears after hook mount).
- ICE remote-description race fixed with pending candidate queue.
- Socket connect no longer forces call status to `idle`.
- Backend call end no longer removes user from room.

## Rendering Logic

`VideoTile` receives a `MediaStream | null` and assigns it to `<video>.srcObject` in `useEffect`.

## Current Scope

The app supports 1:1 calls with one active peer connection at a time.
