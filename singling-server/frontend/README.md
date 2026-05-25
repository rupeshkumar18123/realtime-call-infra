# WebRTC Frontend

Production-ready WebRTC calling frontend built with Next.js, TypeScript, Zustand, and Socket.IO.

## Features

- Demo JWT login flow
- Room creation and join
- 1:1 WebRTC audio/video calls
- Stable offer/answer and ICE handling
- Reliable remote stream rendering
- Local media controls (mute/camera)

## Quick Start

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

App runs on `http://localhost:3001`.

## Environment

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

## Run With Backend

```bash
# terminal 1
cd ../backend
npm run dev

# terminal 2
cd frontend
npm run dev
```

## Call Test

1. Open the app in two separate browser sessions.
2. Login with different users.
3. Create a room and join from both users.
4. Click `Call <username>`.
5. Allow camera and microphone access.

## Important Behavior

- `useWebRTC` now binds signaling listeners even if socket is created slightly later.
- ICE candidates are queued until remote description is set.
- `call-ended` now ends only the call, not room membership.

## Scripts

- `npm run dev`
- `npm run build`
- `npm start`
- `npm run lint`

## Docs

- `FRONTEND_DOCUMENTATION.md`
- `FRONTEND_INTEGRATION_GUIDE.md`
- `FRONTEND_DEPLOYMENT_GUIDE.md`
- `CONTRIBUTING.md`
