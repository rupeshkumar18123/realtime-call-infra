# Frontend Integration Guide

## How the Frontend Connects to the Backend

```
Frontend (Next.js)                    Backend (Express + Socket.IO)
─────────────────                     ──────────────────────────────
POST /api/v1/auth/token          →    Issues JWT
GET  /api/v1/rooms               →    Returns active room list
POST /api/v1/rooms               →    Creates room (JWT required)
GET  /health                     →    Health check

Socket.IO connect (auth: token)  →    Verifies JWT in socket middleware
emit join-room                   →    Adds participant to room
emit offer / answer / ice        →    Relays to target peer
emit leave-room / call-ended     →    Removes participant, notifies room
```

---

## Setup

```bash
# 1. Copy env file
cp .env.local.example .env.local

# 2. Edit .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000

# 3. Install and run
npm install
npm run dev
# → http://localhost:3001
```

---

## Running Both Services Together

```bash
# Terminal 1 — backend
cd ../backend
npm run dev        # http://localhost:3000

# Terminal 2 — frontend
npm run dev        # http://localhost:3001
```

---

## Authentication Flow

```
1. User enters userId + username on home page
2. Frontend calls POST /api/v1/auth/token
3. Backend returns { accessToken, expiresIn }
4. Token stored in sessionStorage + authStore
5. Axios interceptor attaches token to all API requests
6. Socket.IO connects with auth: { token }
7. Backend socket middleware verifies token on connect
```

> In production, replace the demo token endpoint with real user authentication (database lookup + password hash).

---

## Socket Connection Lifecycle

```
getSocket(token)          — creates singleton Socket.IO instance
socket.connect()          — initiates WebSocket connection
socket.on('connect')      — socket ready, emit join-room
socket.on('disconnect')   — update UI status
socket.on('connect_error')— show error state

disconnectSocket()        — removes all listeners, disconnects, nulls singleton
```

The socket is a **singleton** — calling `getSocket()` multiple times returns the same instance. It is recreated only if the previous instance was disconnected.

---

## WebRTC Call Flow (Step by Step)

### Caller side
```
1. User clicks "Call [username]"
2. useWebRTC.initiateCall(targetUserId)
3. Creates RTCPeerConnection
4. Adds local MediaStream tracks to PC
5. pc.createOffer() → setLocalDescription(offer)
6. emit 'offer' { roomId, targetUserId, sdp: offer }
7. Server relays offer to target
8. Receives 'answer' → setRemoteDescription(answer)
9. ICE candidates exchanged via 'ice-candidate' events
10. P2P connection established → remote video appears
```

### Callee side
```
1. Receives 'offer' event
2. Creates RTCPeerConnection
3. Adds local MediaStream tracks to PC
4. setRemoteDescription(offer)
5. pc.createAnswer() → setLocalDescription(answer)
6. emit 'answer' { roomId, targetUserId: fromUserId, sdp: answer }
7. ICE candidates exchanged
8. P2P connection established → remote video appears
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend HTTP base URL |
| `NEXT_PUBLIC_SOCKET_URL` | Yes | Socket.IO server URL (usually same as API URL) |

Both must be set before `npm run dev` or `npm run build`.

---

## CORS Configuration

The backend must allow the frontend origin. In `backend/.env`:

```env
# Development
CORS_ORIGINS=http://localhost:3001

# Production
CORS_ORIGINS=https://your-app.vercel.app
```

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `401 Unauthorized` on socket connect | JWT missing or expired | Re-login to get a fresh token |
| `CORS error` on API calls | Frontend origin not in backend `CORS_ORIGINS` | Add frontend URL to `CORS_ORIGINS` in backend `.env` |
| Camera/mic not working | Browser permissions denied | Click the camera icon in browser address bar and allow |
| No remote video after call | ICE negotiation failed | Both peers must be on HTTPS in production (WebRTC requires secure context) |
| Socket connects but no `room-joined` | `join-room` emitted before socket ready | The room page waits for `connect` event before emitting `join-room` |
| Remote video freezes | Network congestion or ICE failure | Add TURN server credentials to `RTCPeerConnection` config |
| `sessionStorage` token lost on refresh | Expected — demo auth only | Re-login after page refresh |

---

## Adding TURN Server Support

When deploying to production, peers behind strict NATs need a TURN server. Add a backend endpoint that returns time-limited credentials, then update `src/lib/webrtc.ts`:

```ts
// src/lib/webrtc.ts
const iceServers = await fetch('/api/v1/ice-servers').then(r => r.json());
const pc = new RTCPeerConnection({ iceServers });
```
