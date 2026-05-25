# Frontend Documentation

## Architecture Overview

The frontend follows a strict separation of concerns:

```
Pages (thin orchestrators)
  └── Hooks (all side-effect logic)
        ├── Stores (shared state via Zustand)
        └── Lib (socket, webrtc, api — framework-agnostic services)
```

Components are purely presentational — they receive props and emit callbacks. No component contains business logic.

---

## Folder Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout — fonts, metadata, dark mode
│   ├── globals.css             # Tailwind base import
│   ├── page.tsx                # Home page: login + room list + create room
│   └── room/
│       └── [roomId]/
│           └── page.tsx        # Video call room page
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx          # Reusable button with loading state
│   │   ├── Input.tsx           # Labeled input with error display
│   │   └── Badge.tsx           # Status badge (default/success/warning/danger)
│   ├── video/
│   │   ├── VideoTile.tsx       # Renders a MediaStream in a <video> element
│   │   └── Controls.tsx        # Mute / camera / hang-up / call buttons
│   └── room/
│       └── RoomCard.tsx        # Room list item with join link
│
├── hooks/
│   ├── useSocket.ts            # Socket.IO connection + room-level event listeners
│   ├── useMedia.ts             # getUserMedia wrapper
│   └── useWebRTC.ts            # RTCPeerConnection lifecycle + signaling relay
│
├── lib/
│   ├── api.ts                  # Axios client + typed authApi / roomApi methods
│   ├── socket.ts               # Socket.IO singleton factory (one socket per session)
│   ├── webrtc.ts               # WebRTCService class (peer connection abstraction)
│   └── utils.ts                # cn() — Tailwind class merging helper
│
├── store/
│   ├── authStore.ts            # User identity + JWT token
│   ├── roomStore.ts            # Current room + participant list + room list
│   ├── callStore.ts            # Call status + remote MediaStream + remote peer ID
│   └── mediaStore.ts           # Local MediaStream + audio/video enabled flags
│
├── types/
│   ├── index.ts                # User, Room, Participant, CallStatus interfaces
│   └── events.ts               # SOCKET_EVENTS constants (mirrors backend)
│
└── config/
    └── index.ts                # Typed NEXT_PUBLIC_* env vars
```

---

## State Management

All state lives in Zustand stores. No React Context is used.

| Store | State | Actions |
|-------|-------|---------|
| `authStore` | `user` (userId, username, token) | `setUser`, `clearUser` |
| `roomStore` | `currentRoom`, `participants[]`, `rooms[]` | `setCurrentRoom`, `addParticipant`, `removeParticipant`, `setRooms` |
| `callStore` | `status`, `remoteStream`, `remotePeerId` | `setStatus`, `setRemoteStream`, `setRemotePeerId`, `reset` |
| `mediaStore` | `localStream`, `audioEnabled`, `videoEnabled` | `setLocalStream`, `toggleAudio`, `toggleVideo`, `stopAll` |

Components subscribe to only the slice they need:
```ts
const user = useAuthStore((s) => s.user);           // re-renders only when user changes
const status = useCallStore((s) => s.status);       // re-renders only when status changes
```

---

## WebRTC Signaling Flow

```
User A (caller)              Server              User B (callee)
     │                          │                      │
     │── join-room ────────────►│                      │
     │◄─ room-joined ───────────│  (participants list)  │
     │                          │◄─── join-room ───────│
     │◄─ user-connected ────────│                      │
     │                          │──── user-connected ─►│
     │                          │                      │
     │  [User A clicks Call]    │                      │
     │  createOffer()           │                      │
     │── offer ────────────────►│──── offer ──────────►│
     │                          │  setRemoteDescription │
     │                          │  createAnswer()       │
     │                          │◄─── answer ──────────│
     │◄─ answer ────────────────│                      │
     │  setRemoteDescription()  │                      │
     │                          │                      │
     │── ice-candidate ────────►│──── ice-candidate ──►│
     │◄─ ice-candidate ─────────│◄─── ice-candidate ───│
     │                          │                      │
     │  [ICE negotiation done]  │                      │
     │◄══════════ P2P media (audio + video) ═══════════│
```

---

## Socket Lifecycle

```
useSocket.connect()
  └── getSocket(token)          creates Socket.IO instance (singleton)
  └── socket.connect()          initiates connection
  └── socket.on('connect')      → callStore.setStatus('connected')
  └── socket.on('room-joined')  → roomStore.setParticipants(...)
  └── socket.on('user-connected') → roomStore.addParticipant(...)
  └── socket.on('user-disconnected') → roomStore.removeParticipant(...)

useSocket cleanup (on unmount)
  └── disconnectSocket()        removes all listeners + disconnects
```

---

## WebRTC Hook Architecture

`useWebRTC` uses `useRef` to hold the `WebRTCService` instance — this prevents the peer connection from being recreated on re-renders.

```
useWebRTC(roomId, localUserId)
  ├── serviceRef (useRef<WebRTCService>)   — stable across renders
  ├── createPC(targetUserId)               — creates RTCPeerConnection, adds local stream
  ├── initiateCall(targetUserId)           — createOffer → emit 'offer'
  ├── onOffer handler                      — setRemoteDescription → createAnswer → emit 'answer'
  ├── onAnswer handler                     — setRemoteDescription
  ├── onIceCandidate handler               — addIceCandidate
  ├── onCallEnded handler                  — close PC, reset callStore
  └── hangUp()                             — emit 'call-ended', close PC, reset callStore
```

---

## Media Flow

```
useMedia.startMedia(video, audio)
  └── navigator.mediaDevices.getUserMedia({ video, audio })
  └── mediaStore.setLocalStream(stream)

VideoTile receives stream prop
  └── videoRef.current.srcObject = stream   (via useEffect)

mediaStore.toggleAudio()
  └── stream.getAudioTracks().forEach(t => t.enabled = !enabled)
  └── updates audioEnabled flag

mediaStore.stopAll()
  └── stream.getTracks().forEach(t => t.stop())
  └── clears localStream
```

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| Camera/mic denied | `useMedia` logs error, `localStream` stays null, VideoTile shows "Camera off" |
| Socket auth failure | Socket.IO emits `connect_error`, `callStore.status` → `'error'` |
| Room not found | Backend emits `room-error`, displayed via socket error handler |
| Peer disconnects | `user-disconnected` event → peer connection closed, `callStore.reset()` |
| Network drop | Socket.IO auto-reconnects (5 attempts), re-joins room on `connect` event |

---

## Production Considerations

- Replace `sessionStorage` token storage with `httpOnly` cookies for production auth
- Add TURN server credentials from `/api/v1/ice-servers` endpoint (future backend feature)
- Use `next/dynamic` with `ssr: false` for any component that accesses `navigator` or `window`
- The `useWebRTC` hook only supports 1-to-1 calls — for group calls, maintain a `Map<userId, WebRTCService>` and create one peer connection per participant
