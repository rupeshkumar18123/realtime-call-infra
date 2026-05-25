# WebRTC Signaling — Frontend

Production-grade WebRTC video calling frontend built with Next.js 16, TypeScript, Tailwind CSS, Socket.IO, and Zustand.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)](https://tailwindcss.com)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-black)](https://socket.io)

---

## Features

- JWT-based demo authentication
- Create and join signaling rooms
- 1-to-1 WebRTC video/audio calling
- Mute / camera toggle
- Real-time participant list
- Reconnect handling
- Responsive dark UI

---

## Quick Start

### Prerequisites

- Node.js 18+
- Backend signaling server running (see `../backend`)

### Setup

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Open `http://localhost:3001`.

### Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

---

## Running with Backend

```bash
# Terminal 1 — backend
cd ../backend
npm run dev        # http://localhost:3000

# Terminal 2 — frontend
cd frontend
npm run dev        # http://localhost:3001
```

---

## Testing a Video Call

1. Open `http://localhost:3001` in **two browser tabs**
2. Log in with different user IDs (e.g. `user-1` / `user-2`)
3. Create a room in tab 1
4. Join the same room in tab 2
5. Click **Call [username]** in either tab
6. Allow camera/microphone permissions
7. Peer-to-peer video call connects

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | ESLint check |

---

## Documentation

| File | Description |
|------|-------------|
| [FRONTEND_DOCUMENTATION.md](./FRONTEND_DOCUMENTATION.md) | Architecture, folder structure, state management, WebRTC flow |
| [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md) | How frontend connects to backend, troubleshooting |
| [FRONTEND_DEPLOYMENT_GUIDE.md](./FRONTEND_DEPLOYMENT_GUIDE.md) | Vercel deployment, production config |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Development workflow, code style |

---

## Project Structure

```
src/
├── app/                    # Pages (App Router)
│   ├── page.tsx            # Home: login + rooms
│   └── room/[roomId]/      # Video call room
├── components/
│   ├── ui/                 # Button, Input, Badge
│   ├── video/              # VideoTile, Controls
│   └── room/               # RoomCard
├── hooks/                  # useSocket, useMedia, useWebRTC
├── lib/                    # api, socket, webrtc, utils
├── store/                  # Zustand stores
├── types/                  # TypeScript interfaces + event constants
└── config/                 # Environment config
```

---

## License

MIT
