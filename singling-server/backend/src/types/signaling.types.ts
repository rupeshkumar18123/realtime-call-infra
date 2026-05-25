// WebRTC signaling event payloads

export interface JoinRoomPayload {
  roomId: string;
  userId: string;
  username: string;
}

export interface LeaveRoomPayload {
  roomId: string;
}

export interface OfferPayload {
  roomId: string;
  targetUserId: string;
  sdp: RTCSessionDescriptionInit;
}

export interface AnswerPayload {
  roomId: string;
  targetUserId: string;
  sdp: RTCSessionDescriptionInit;
}

export interface IceCandidatePayload {
  roomId: string;
  targetUserId: string;
  candidate: RTCIceCandidateInit;
}

export interface CallEndedPayload {
  roomId: string;
}

// Server → Client events
export interface UserConnectedPayload {
  userId: string;
  username: string;
  socketId: string;
}

export interface UserDisconnectedPayload {
  userId: string;
  socketId: string;
}

export interface RoomJoinedPayload {
  roomId: string;
  participants: Array<{ userId: string; username: string; socketId: string }>;
}

export interface ErrorPayload {
  code: string;
  message: string;
}
