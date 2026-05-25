import { io, Socket } from 'socket.io-client';
import { config } from '@/config';

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (!socket || !socket.connected) {
    socket?.removeAllListeners();
    socket?.disconnect();
    socket = io(config.socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
}

export function getActiveSocket(): Socket | null {
  return socket;
}
