import { AuthenticatedSocket, SOCKET_EVENTS } from '@types/socket.types';
import {
  JoinRoomPayload,
  LeaveRoomPayload,
  OfferPayload,
  AnswerPayload,
  IceCandidatePayload,
  CallEndedPayload,
} from '@types/signaling.types';
import { roomService } from '@modules/rooms/room.service';
import { logger } from '@logger/index';
import {
  joinRoomSocketSchema,
  signalingSchema,
  iceCandidateSchema,
} from '@modules/rooms/room.schema';

export class SignalingHandler {
  handleJoinRoom(socket: AuthenticatedSocket, payload: JoinRoomPayload): void {
    try {
      const data = joinRoomSocketSchema.parse(payload);
      const { roomId, userId, username } = data;

      const room = roomService.joinRoom(roomId, {
        userId,
        socketId: socket.id,
        username,
        joinedAt: new Date(),
      });

      socket.join(roomId);
      socket.data.roomId = roomId;

      // Notify the joining user of current participants
      const participants = Array.from(room.participants.values())
        .filter((p) => p.userId !== userId)
        .map(({ userId, username, socketId }) => ({ userId, username, socketId }));

      socket.emit(SOCKET_EVENTS.ROOM_JOINED, { roomId, participants });

      // Notify others in the room
      socket.to(roomId).emit(SOCKET_EVENTS.USER_CONNECTED, {
        userId,
        username,
        socketId: socket.id,
      });

      logger.info('Socket joined room', { socketId: socket.id, roomId, userId });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join room';
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { code: 'JOIN_FAILED', message });
    }
  }

  handleLeaveRoom(socket: AuthenticatedSocket, payload: LeaveRoomPayload): void {
    const { roomId } = payload;
    this._leaveRoom(socket, roomId);
  }

  handleOffer(socket: AuthenticatedSocket, payload: OfferPayload): void {
    try {
      const data = signalingSchema.parse(payload);
      const targetSocketId = roomService.findSocketInRoom(data.roomId, data.targetUserId);
      if (!targetSocketId) {
        socket.emit(SOCKET_EVENTS.SIGNAL_ERROR, { code: 'TARGET_NOT_FOUND', message: 'Target user not in room' });
        return;
      }
      socket.to(targetSocketId).emit(SOCKET_EVENTS.OFFER, {
        sdp: data.sdp,
        fromUserId: socket.data.user.sub,
        roomId: data.roomId,
      });
    } catch (err) {
      socket.emit(SOCKET_EVENTS.SIGNAL_ERROR, { code: 'OFFER_FAILED', message: 'Invalid offer payload' });
    }
  }

  handleAnswer(socket: AuthenticatedSocket, payload: AnswerPayload): void {
    try {
      const data = signalingSchema.parse(payload);
      const targetSocketId = roomService.findSocketInRoom(data.roomId, data.targetUserId);
      if (!targetSocketId) {
        socket.emit(SOCKET_EVENTS.SIGNAL_ERROR, { code: 'TARGET_NOT_FOUND', message: 'Target user not in room' });
        return;
      }
      socket.to(targetSocketId).emit(SOCKET_EVENTS.ANSWER, {
        sdp: data.sdp,
        fromUserId: socket.data.user.sub,
        roomId: data.roomId,
      });
    } catch {
      socket.emit(SOCKET_EVENTS.SIGNAL_ERROR, { code: 'ANSWER_FAILED', message: 'Invalid answer payload' });
    }
  }

  handleIceCandidate(socket: AuthenticatedSocket, payload: IceCandidatePayload): void {
    try {
      const data = iceCandidateSchema.parse(payload);
      const targetSocketId = roomService.findSocketInRoom(data.roomId, data.targetUserId);
      if (targetSocketId) {
        socket.to(targetSocketId).emit(SOCKET_EVENTS.ICE_CANDIDATE, {
          candidate: data.candidate,
          fromUserId: socket.data.user.sub,
          roomId: data.roomId,
        });
      }
    } catch {
      socket.emit(SOCKET_EVENTS.SIGNAL_ERROR, { code: 'ICE_FAILED', message: 'Invalid ICE candidate' });
    }
  }

  handleCallEnded(socket: AuthenticatedSocket, payload: CallEndedPayload): void {
    const { roomId } = payload;
    socket.to(roomId).emit(SOCKET_EVENTS.CALL_ENDED, { roomId });
  }

  handleDisconnect(socket: AuthenticatedSocket): void {
    const roomId = socket.data.roomId;
    if (roomId) this._leaveRoom(socket, roomId);
    logger.info('Socket disconnected', { socketId: socket.id });
  }

  private _leaveRoom(socket: AuthenticatedSocket, roomId: string): void {
    try {
      roomService.leaveRoom(roomId, socket.data.user.sub);
      socket.leave(roomId);
      socket.data.roomId = undefined;
      socket.to(roomId).emit(SOCKET_EVENTS.USER_DISCONNECTED, {
        userId: socket.data.user.sub,
        socketId: socket.id,
      });
      socket.emit(SOCKET_EVENTS.ROOM_LEFT, { roomId });
      logger.info('Socket left room', { socketId: socket.id, roomId });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to leave room';
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { code: 'LEAVE_FAILED', message });
    }
  }
}

export const signalingHandler = new SignalingHandler();
