export interface User {
  userId: string;
  username: string;
  token: string;
}

export interface Room {
  id: string;
  name: string;
  hostId: string;
  status: 'waiting' | 'active' | 'ended';
  maxParticipants: number;
  participantCount: number;
  createdAt: string;
}

export interface Participant {
  userId: string;
  username: string;
  socketId: string;
}

export type CallStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
