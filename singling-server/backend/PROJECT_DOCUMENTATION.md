# Project Documentation

## Architecture

Layers:

- Express app and middleware
- Socket.IO manager and event routing
- Modules: auth, rooms, signaling, health
- Infrastructure: Redis clients (optional in dev, required in prod)

## Main Runtime Flow

1. HTTP server boots Express app.
2. Socket manager initializes Socket.IO.
3. Socket auth middleware validates JWT on connection.
4. Event registry forwards events to signaling handler.
5. Signaling handler validates payloads and relays to target socket.

## Room Lifecycle

- Room created by REST endpoint.
- Users join through `join-room` socket event.
- Users leave through `leave-room` or disconnect.
- Empty room is marked ended.

## Signaling Lifecycle

- Caller emits `offer` with `targetUserId`.
- Callee emits `answer` to caller.
- Both peers exchange `ice-candidate` events.
- Either side may emit `call-ended` to notify peer.

Important: `call-ended` does not remove participants from room.

## Security

- JWT required for socket connection.
- JWT required for room creation/deletion REST endpoints.
- Zod validation for socket payloads.
- Helmet, CORS, rate limiting enabled.

## Scaling Notes

- Redis adapter propagates Socket.IO events across instances.
- In-memory room map is suitable for single instance and development.
- For full multi-instance room consistency, move room state to Redis/database.
