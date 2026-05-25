# Frontend Integration Guide

## Backend Contract

Frontend expects backend endpoints:

- `POST /api/v1/auth/token`
- `GET /api/v1/rooms`
- `POST /api/v1/rooms`

And Socket.IO signaling events:

- `join-room`, `leave-room`
- `offer`, `answer`, `ice-candidate`
- `call-ended`, `room-joined`, `user-connected`, `user-disconnected`

## Setup

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

## Connection Sequence

1. User logs in and gets JWT.
2. `useSocket.connect()` creates/opens socket using token.
3. Room page waits for socket connection and emits `join-room`.
4. `useWebRTC` binds signaling listeners and keeps them bound reliably.

## Call Sequence

1. Caller creates peer connection and offer.
2. Callee receives offer, sets remote SDP, creates answer.
3. Caller receives answer and sets remote SDP.
4. Both exchange ICE.
5. Media flows P2P after connectivity checks complete.

## Troubleshooting

- Stuck at `Calling...`: verify both peers receive `offer` and `answer` logs.
- No remote media: check that ICE candidates are exchanged after SDP.
- Immediate disconnect: verify `user-disconnected` and room membership events.
- Socket auth error: refresh token by logging in again.

## Production Notes

- Use HTTPS/WSS.
- Use TURN credentials (not only public STUN).
- Replace demo auth token flow with real auth.
