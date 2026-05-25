# Socket Events Reference

All payloads are JSON. Invalid payloads return `room-error` or `signal-error`.

## Client to Server

### `join-room`

```ts
{ roomId: string; userId: string; username: string }
```

### `leave-room`

```ts
{ roomId: string }
```

### `offer`

```ts
{ roomId: string; targetUserId: string; sdp: RTCSessionDescriptionInit }
```

### `answer`

```ts
{ roomId: string; targetUserId: string; sdp: RTCSessionDescriptionInit }
```

### `ice-candidate`

```ts
{ roomId: string; targetUserId: string; candidate: RTCIceCandidateInit }
```

### `call-ended`

```ts
{ roomId: string }
```

Note: this event ends call signaling only. It does not remove sender from room.

## Server to Client

- `room-joined`
- `room-left`
- `user-connected`
- `user-disconnected`
- `offer`
- `answer`
- `ice-candidate`
- `call-ended`
- `room-error`
- `signal-error`

## Error Codes

- `JOIN_FAILED`
- `LEAVE_FAILED`
- `TARGET_NOT_FOUND`
- `OFFER_FAILED`
- `ANSWER_FAILED`
- `ICE_FAILED`
