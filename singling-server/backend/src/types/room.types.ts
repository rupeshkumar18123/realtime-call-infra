export type RoomStatus = 'waiting' | 'active' | 'ended';

export interface Room {
  id: string;
  name: string;
  hostId: string;
  participants: Map<string, Participant>;
  maxParticipants: number;
  status: RoomStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Participant {
  userId: string;
  socketId: string;
  username: string;
  joinedAt: Date;
}

export interface CreateRoomDto {
  name: string;
  maxParticipants?: number;
}

export interface JoinRoomDto {
  roomId: string;
}
