# Socket Events Reference

All events use JSON payloads. The server validates every incoming payload with Zod — invalid payloads receive an error event instead of crashing.

---

## Connection

Connect with a JWT in the `auth` object:

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: 'Bearer eyJ...' },
  transports: ['websocket'],
});
```

On auth failure the connection is rejected with `Error: Authentication required` or `Error: Invalid or expired token`.

---

## Client → Server Events

### `join-room`

Join a signaling room. Must be called before sending offers/answers.

**Payload:**
```ts
{
  roomId: string;    // existing room ID
  userId: string;    // your user ID
  username: string;  // display name (max 50 chars)
}
```

**Success response** — server emits `room-joined` back to caller:
```ts
{
  roomId: string;
  participants: Array<{ userId: string; username: string; socketId: string }>;
}
```

**Error response** — server emits `room-error`:
```ts
{ code: 'JOIN_FAILED'; message: string }
```

---

### `leave-room`

Leave the current room.

**Payload:**
```ts
{ roomId: string }
```

**Success** — server emits `room-left` to caller, `user-disconnected` to room.

---

### `offer`

Send a WebRTC SDP offer to a specific peer.

**Payload:**
```ts
{
  roomId: string;
  targetUserId: string;
  sdp: RTCSessionDescriptionInit;  // { type: 'offer', sdp: '...' }
}
```

**Forwarded to target as** `offer`:
```ts
{
  sdp: RTCSessionDescriptionInit;
  fromUserId: string;
  roomId: string;
}
```

**Error** — `signal-error` with `code: 'TARGET_NOT_FOUND'` if target is not in room.

---

### `answer`

Send a WebRTC SDP answer to a specific peer.

**Payload:**
```ts
{
  roomId: string;
  targetUserId: string;
  sdp: RTCSessionDescriptionInit;  // { type: 'answer', sdp: '...' }
}
```

**Forwarded to target as** `answer` (same shape as offer forward).

---

### `ice-candidate`

Relay an ICE candidate to a specific peer.

**Payload:**
```ts
{
  roomId: string;
  targetUserId: string;
  candidate: RTCIceCandidateInit;
}
```

**Forwarded to target as** `ice-candidate`:
```ts
{
  candidate: RTCIceCandidateInit;
  fromUserId: string;
  roomId: string;
}
```

---

### `call-ended`

Signal that the call has ended. Notifies all room participants and removes the sender from the room.

**Payload:**
```ts
{ roomId: string }
```

**Broadcast to room as** `call-ended`:
```ts
{ roomId: string }
```

---

## Server → Client Events

### `room-joined`
Emitted to the joining socket after successful `join-room`.
```ts
{ roomId: string; participants: Array<{ userId, username, socketId }> }
```

### `room-left`
Emitted to the leaving socket after `leave-room` or `call-ended`.
```ts
{ roomId: string }
```

### `user-connected`
Broadcast to all existing room members when a new peer joins.
```ts
{ userId: string; username: string; socketId: string }
```

### `user-disconnected`
Broadcast to room when a peer leaves or disconnects.
```ts
{ userId: string; socketId: string }
```

### `room-error`
Emitted to the caller when a room operation fails.
```ts
{ code: string; message: string }
```

### `signal-error`
Emitted to the caller when a signaling operation fails.
```ts
{ code: string; message: string }
```

---

## Error Codes

| Code | Trigger |
|------|---------|
| `JOIN_FAILED` | Room not found, full, or ended |
| `LEAVE_FAILED` | Room not found |
| `TARGET_NOT_FOUND` | Target user not in room |
| `OFFER_FAILED` | Invalid offer payload |
| `ANSWER_FAILED` | Invalid answer payload |
| `ICE_FAILED` | Invalid ICE candidate payload |
