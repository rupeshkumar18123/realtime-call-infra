import { Socket } from 'socket.io';
import { JwtPayload } from './auth.types';

export interface AuthenticatedSocket extends Socket {
  data: {
    user: JwtPayload;
    roomId?: string;
  };
}

// Socket event names as constants to avoid magic strings
export const SOCKET_EVENTS = {
  // Client → Server
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  OFFER: 'offer',
  ANSWER: 'answer',
  ICE_CANDIDATE: 'ice-candidate',
  CALL_ENDED: 'call-ended',

  // Server → Client
  USER_CONNECTED: 'user-connected',
  USER_DISCONNECTED: 'user-disconnected',
  ROOM_JOINED: 'room-joined',
  ROOM_LEFT: 'room-left',
  ROOM_ERROR: 'room-error',
  SIGNAL_ERROR: 'signal-error',
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
