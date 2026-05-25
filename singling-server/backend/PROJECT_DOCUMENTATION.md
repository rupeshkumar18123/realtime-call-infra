# Project Documentation

## Architecture Overview

This server follows **Clean Architecture** with a feature-based modular structure. Each concern is isolated into its own layer, making the codebase testable, scalable, and easy to extend.

```
┌─────────────────────────────────────────────────────┐
│                    Clients                          │
│  Next.js │ React Native │ Android │ Electron        │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP + WebSocket
┌──────────────────────▼──────────────────────────────┐
│              Express + Socket.IO Server             │
│  ┌─────────────┐  ┌──────────────────────────────┐  │
│  │  REST API   │  │      Socket.IO Layer          │  │
│  │  /health    │  │  Auth Middleware              │  │
│  │  /auth      │  │  Event Handlers               │  │
│  │  /rooms     │  │  Room + Signaling Logic       │  │
│  └─────────────┘  └──────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │              Module Layer                    │   │
│  │  auth │ rooms │ signaling │ health           │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │           Infrastructure Layer               │   │
│  │  Redis (pub/sub + Socket.IO adapter)         │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Folder Structure

```
src/
├── app/              # Express app factory
├── config/           # Env validation + typed config
├── core/             # Shared error classes
├── infrastructure/   # Redis client factory
├── logger/           # Winston logger
├── middleware/       # Express middleware (auth, validate, errors)
├── modules/
│   ├── auth/         # JWT issuance + verification
│   ├── health/       # Health check endpoint
│   ├── rooms/        # Room CRUD + in-memory store
│   └── signaling/    # WebRTC event handler
├── sockets/          # Socket.IO manager, middleware, event registry
├── types/            # Shared TypeScript interfaces
└── server.ts         # Entry point
```

---

## Module Explanations

### `config/`
Validates all environment variables at startup using Zod. If any required variable is missing or invalid, the process exits immediately with a clear error. Exports a typed `config` object used throughout the app.

### `infrastructure/redis.ts`
Creates ioredis clients with retry logic. Exports `pubClient` and `subClient` used by the Socket.IO Redis adapter for cross-instance event broadcasting.

### `modules/auth/`
Issues JWTs for a given `userId`/`username` pair. This is intentionally simple — replace `AuthService.issueToken` with a real user lookup + bcrypt password check in production.

### `modules/rooms/`
In-memory room store backed by a `Map`. Each room tracks participants by `userId`. The `RoomService` is the single source of truth for room state. For multi-instance deployments, replace the `Map` with a Redis hash store.

### `modules/signaling/`
`SignalingHandler` handles all WebRTC signaling events. It validates payloads with Zod, looks up target socket IDs via `RoomService`, and relays SDP/ICE data directly to the target peer's socket.

### `sockets/`
- `socket.middleware.ts` — verifies JWT on every new connection
- `socket.manager.ts` — creates the Socket.IO server, attaches the Redis adapter, and registers middleware
- `socket.events.ts` — maps socket event names to handler methods

---

## WebRTC Signaling Flow

```
Peer A                    Server                    Peer B
  │                          │                          │
  │── join-room ────────────►│                          │
  │◄─ room-joined ───────────│                          │
  │                          │◄──── join-room ──────────│
  │◄─ user-connected ────────│                          │
  │                          │──── user-connected ─────►│
  │                          │                          │
  │── offer ────────────────►│──── offer ──────────────►│
  │                          │◄─── answer ──────────────│
  │◄─ answer ────────────────│                          │
  │                          │                          │
  │── ice-candidate ────────►│──── ice-candidate ──────►│
  │◄─ ice-candidate ─────────│◄─── ice-candidate ───────│
  │                          │                          │
  │── call-ended ───────────►│──── call-ended ─────────►│
```

---

## Redis Architecture

The Socket.IO Redis adapter uses Redis pub/sub to broadcast events across multiple server instances. When a socket on Instance A emits to a room, the adapter publishes the event to Redis, and all other instances subscribed to that channel deliver it to their local sockets.

```
Instance A ──► Redis pub/sub ──► Instance B
                    │
                    └──────────► Instance C
```

In **development**, if Redis is unreachable the server starts in single-instance mode — the Redis adapter is skipped and all signaling works normally for a single process. The health endpoint reports `redis: skipped` instead of `error`.

In **production** (`NODE_ENV=production`), Redis is required. The server will not finish initializing until the adapter is attached.

For room state in multi-instance mode, replace the in-memory `Map` in `RoomService` with Redis hashes:
- `room:{roomId}` — room metadata
- `room:{roomId}:participants` — hash of userId → participant JSON

---

## Security Architecture

| Layer | Mechanism |
|-------|-----------|
| HTTP | Helmet headers, CORS allowlist, rate limiting |
| REST auth | Bearer JWT middleware |
| Socket auth | JWT verified in Socket.IO middleware before connection |
| Payload | Zod schema validation on all inputs |
| Errors | Production-safe responses (no stack traces in prod) |

---

## Scaling Architecture

### Horizontal Scaling

1. Deploy N instances behind a load balancer with **sticky sessions** (or use `polling` transport only with any load balancer)
2. All instances share the same Redis — the adapter handles cross-instance event delivery
3. Room state must be moved to Redis for true stateless instances

### Future SFU Integration (mediasoup)

Replace the peer-to-peer relay model:
1. Add a `sfu/` module with a mediasoup `Worker` and `Router` per room
2. On `join-room`, create a mediasoup `Transport` for the peer
3. Replace `offer`/`answer` relay with mediasoup `produce`/`consume` signaling
4. The signaling server becomes the control plane; media flows through the SFU

### TURN/STUN Integration

Add a `/api/v1/ice-servers` endpoint that returns time-limited TURN credentials:
```json
{
  "iceServers": [
    { "urls": "stun:stun.example.com" },
    { "urls": "turn:turn.example.com", "username": "...", "credential": "..." }
  ]
}
```
Clients fetch this before creating `RTCPeerConnection`.

---

## Production Best Practices

- Set `JWT_SECRET` to a cryptographically random 64-byte string
- Enable Redis AUTH (`REDIS_PASSWORD`) and TLS (`REDIS_TLS=true`) in production
- Run behind a reverse proxy (nginx/Caddy) that handles TLS termination
- Use `NODE_ENV=production` to suppress stack traces in error responses
- Monitor with structured logs — ship to Datadog, Loki, or CloudWatch
- Set resource limits in Docker/Kubernetes to prevent memory exhaustion
