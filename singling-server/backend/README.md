# WebRTC Signaling Backend

Production signaling backend using Express, Socket.IO, TypeScript, and optional Redis adapter.

## Features

- JWT auth for REST and sockets
- Room join/leave and participant tracking
- WebRTC offer/answer/ICE relay
- Input validation with Zod
- Structured logging
- Horizontal scale support via Redis adapter

## Quick Start

```bash
cp .env.example .env
npm install
npm run dev
```

Server runs on `http://localhost:3000`.

## Endpoints

- `GET /health`
- `POST /api/v1/auth/token`
- `GET /api/v1/rooms`
- `GET /api/v1/rooms/:roomId`
- `POST /api/v1/rooms` (auth)
- `DELETE /api/v1/rooms/:roomId` (auth)

## Signaling Behavior

- `offer`, `answer`, and `ice-candidate` are forwarded to `targetUserId` if present in room.
- `call-ended` broadcasts call termination only.
- Room membership is changed only by `join-room`, `leave-room`, or socket disconnect.

## Scripts

- `npm run dev`
- `npm run build`
- `npm start`
- `npm run lint`
- `npm run type-check`

## Docs

- `PROJECT_DOCUMENTATION.md`
- `SOCKET_EVENTS_REFERENCE.md`
- `INTEGRATION_GUIDE.md`
- `DEPLOYMENT_GUIDE.md`
- `CONTRIBUTING.md`
