export const SOCKET_EVENTS = {
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  OFFER: 'offer',
  ANSWER: 'answer',
  ICE_CANDIDATE: 'ice-candidate',
  CALL_ENDED: 'call-ended',
  USER_CONNECTED: 'user-connected',
  USER_DISCONNECTED: 'user-disconnected',
  ROOM_JOINED: 'room-joined',
  ROOM_LEFT: 'room-left',
  ROOM_ERROR: 'room-error',
  SIGNAL_ERROR: 'signal-error',
} as const;
