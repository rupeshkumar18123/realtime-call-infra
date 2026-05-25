# 🔌 Signaling Server

Production-grade WebRTC signaling server built with Node.js, TypeScript, Express, Socket.IO, and Redis.

[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue)](https://typescriptlang.org)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7+-black)](https://socket.io)
[![Redis](https://img.shields.io/badge/Redis-7+-red)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-ready-blue)](https://docker.com)
[![Railway](https://img.shields.io/badge/Railway-ready-purple)](https://railway.app)

---

## Features

- WebRTC offer/answer/ICE-candidate relay
- Room management with capacity control
- JWT authentication (HTTP + Socket.IO)
- Redis adapter for horizontal scaling
- Structured Winston logging
- Zod request validation
- Helmet + CORS + rate limiting
- Docker & Railway deployment ready
- Health check endpoint

---

## Quick Start

### Prerequisites

- Node.js 18+
- Redis 7+
- npm

### Local Development

```bash
# 1. Clone and install
git clone <repo-url>
cd signaling-server
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set JWT_SECRET at minimum

# 3. Start Redis (Docker)
docker run -d -p 6379:6379 redis:7-alpine

# 4. Start dev server (hot reload)
npm run dev
```

Server starts at `http://localhost:3000`.

### Docker Compose (recommended)

```bash
cp .env.example .env
docker-compose up --build
```

---

## Windows / WSL Note

On Windows with Docker Desktop + WSL2, the WSL relay intercepts loopback ports and prevents ioredis from connecting to a Dockerized Redis. The server handles this gracefully — it starts in **single-instance mode** without the Redis adapter, which is fine for local development.

To run Redis locally on Windows, install it inside WSL:

```bash
wsl sudo apt-get install -y redis-server
wsl sudo service redis-server start
wsl redis-cli ping   # PONG
```

Then update `.env`:
```
REDIS_HOST=<output of: wsl hostname -I>
REDIS_PORT=6379
```

In production (Railway, Linux Docker), Redis works normally.

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check |
| POST | `/api/v1/auth/token` | No | Issue JWT |
| GET | `/api/v1/rooms` | No | List active rooms |
| GET | `/api/v1/rooms/:roomId` | No | Get room details |
| POST | `/api/v1/rooms` | JWT | Create room |
| DELETE | `/api/v1/rooms/:roomId` | JWT | End room |

### Issue a token

```bash
curl -X POST http://localhost:3000/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-123", "username": "alice"}'
```

Response:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "expiresIn": "7d"
  }
}
```

---

## Socket.IO Events

Connect with your JWT:

```js
const socket = io('http://localhost:3000', {
  auth: { token: 'your-jwt-token' }
});
```

See [SOCKET_EVENTS_REFERENCE.md](./SOCKET_EVENTS_REFERENCE.md) for full event documentation.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Hot-reload dev server |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled server |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | ESLint auto-fix |
| `npm run format` | Prettier format |
| `npm run type-check` | TypeScript check |

---

## Documentation

- [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) — Architecture deep-dive
- [SOCKET_EVENTS_REFERENCE.md](./SOCKET_EVENTS_REFERENCE.md) — All socket events
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) — Client integration (Next.js, React Native, Android, Electron)
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) — Railway, Docker, VPS deployment
- [CONTRIBUTING.md](./CONTRIBUTING.md) — Contributing guidelines

---

## License

MIT
