# Integration Guide

## Authentication

1. Call `POST /api/v1/auth/token` with `userId` and `username`.
2. Use returned JWT for REST and socket connection.

## Socket Connect

```ts
const socket = io('http://localhost:3000', {
  auth: { token },
  transports: ['websocket', 'polling'],
});
```

## Required Event Sequence

1. `join-room`
2. `offer` / `answer`
3. `ice-candidate`
4. `call-ended` (optional)
5. `leave-room` when leaving the room

## Client Guidance

- Treat room lifecycle separate from call lifecycle.
- Keep one active peer connection per 1:1 call.
- Queue ICE until remote SDP is applied.
- Re-join room after reconnect.
