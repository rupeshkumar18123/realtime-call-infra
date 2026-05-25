# Integration Guide

How to integrate the signaling server into your client applications.

---

## Authentication Flow

All clients follow the same pattern:

1. Call `POST /api/v1/auth/token` with `{ userId, username }` to get a JWT
2. Store the JWT (memory or secure storage — never localStorage for sensitive apps)
3. Pass the JWT when connecting to Socket.IO

---

## Next.js / React

### Install

```bash
npm install socket.io-client
```

### `lib/socket.ts` — singleton socket

```ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SIGNALING_URL!, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: false,
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
```

### `hooks/useSignaling.ts`

```ts
import { useEffect, useRef, useCallback } from 'react';
import { getSocket } from '@/lib/socket';

export function useSignaling(token: string, roomId: string, userId: string, username: string) {
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        getSocket(token).emit('ice-candidate', {
          roomId,
          targetUserId: /* remote peer userId */ '',
          candidate,
        });
      }
    };

    return pc;
  }, [token, roomId]);

  useEffect(() => {
    const socket = getSocket(token);
    socket.connect();

    socket.on('connect', () => {
      socket.emit('join-room', { roomId, userId, username });
    });

    socket.on('room-joined', ({ participants }) => {
      // Initiate offer to each existing participant
      participants.forEach(async (peer: { userId: string }) => {
        const pc = createPeerConnection();
        pcRef.current = pc;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', { roomId, targetUserId: peer.userId, sdp: offer });
      });
    });

    socket.on('offer', async ({ sdp, fromUserId }) => {
      const pc = createPeerConnection();
      pcRef.current = pc;
      await pc.setRemoteDescription(sdp);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { roomId, targetUserId: fromUserId, sdp: answer });
    });

    socket.on('answer', async ({ sdp }) => {
      await pcRef.current?.setRemoteDescription(sdp);
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      await pcRef.current?.addIceCandidate(candidate);
    });

    socket.on('user-disconnected', () => {
      pcRef.current?.close();
      pcRef.current = null;
    });

    return () => {
      socket.emit('leave-room', { roomId });
      socket.disconnect();
      pcRef.current?.close();
    };
  }, [token, roomId, userId, username, createPeerConnection]);
}
```

### Environment variable

```env
# .env.local
NEXT_PUBLIC_SIGNALING_URL=http://localhost:3000
```

---

## React Native

### Install

```bash
npm install socket.io-client
```

React Native requires the `polling` transport as a fallback since some environments block WebSocket upgrades:

```ts
import { io } from 'socket.io-client';

const socket = io('http://YOUR_SERVER_IP:3000', {
  auth: { token },
  transports: ['websocket', 'polling'],
});
```

Use `react-native-webrtc` for `RTCPeerConnection`. The signaling logic is identical to the React example above.

```bash
npm install react-native-webrtc
```

```ts
import { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate } from 'react-native-webrtc';
// Use these instead of the browser globals
```

---

## Android (Kotlin)

### Dependency

```kotlin
// build.gradle
implementation("io.socket:socket.io-client:2.1.0")
implementation("org.webrtc:google-webrtc:1.0.32006")
```

### Connect

```kotlin
val opts = IO.Options().apply {
    auth = mapOf("token" to jwtToken)
    transports = arrayOf("websocket")
}
val socket = IO.socket("http://YOUR_SERVER:3000", opts)
socket.connect()

socket.on("room-joined") { args ->
    val data = args[0] as JSONObject
    // initiate offer to each participant
}

socket.on("offer") { args ->
    val payload = args[0] as JSONObject
    val sdp = payload.getString("sdp")
    // setRemoteDescription, createAnswer, emit answer
}

socket.on("ice-candidate") { args ->
    val payload = args[0] as JSONObject
    // addIceCandidate
}
```

---

## Electron

Electron runs a full Node.js + Chromium environment. Use the same approach as the React/Next.js guide. The browser `RTCPeerConnection` API is available natively in the renderer process.

```ts
// renderer process — identical to React hook above
import { io } from 'socket.io-client';
```

For the main process, use `socket.io-client` with Node.js WebSocket:

```ts
import { io } from 'socket.io-client';
const socket = io('http://localhost:3000', {
  auth: { token },
  transports: ['websocket'],
});
```

---

## Reconnect Handling

Socket.IO handles reconnection automatically. To re-join a room after reconnect:

```ts
socket.on('connect', () => {
  if (currentRoomId) {
    socket.emit('join-room', { roomId: currentRoomId, userId, username });
  }
});
```

---

## Architecture Recommendation

Keep signaling logic in a dedicated service/hook layer, separate from UI components. This makes it easy to swap the signaling server URL per environment and to unit-test the signaling logic independently.
