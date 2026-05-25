import { Server as SocketServer } from 'socket.io';
import { AuthenticatedSocket, SOCKET_EVENTS } from '@types/socket.types';
import { signalingHandler } from '@modules/signaling/signaling.handler';
import { logger } from '@logger/index';

export function registerSocketEvents(io: SocketServer): void {
  io.on('connection', (socket) => {
    const s = socket as AuthenticatedSocket;
    const { sub: userId, username } = s.data.user;

    logger.info('Socket connected', { socketId: s.id, userId, username });

    s.on(SOCKET_EVENTS.JOIN_ROOM, (payload) => signalingHandler.handleJoinRoom(s, payload));
    s.on(SOCKET_EVENTS.LEAVE_ROOM, (payload) => signalingHandler.handleLeaveRoom(s, payload));
    s.on(SOCKET_EVENTS.OFFER, (payload) => signalingHandler.handleOffer(s, payload));
    s.on(SOCKET_EVENTS.ANSWER, (payload) => signalingHandler.handleAnswer(s, payload));
    s.on(SOCKET_EVENTS.ICE_CANDIDATE, (payload) => signalingHandler.handleIceCandidate(s, payload));
    s.on(SOCKET_EVENTS.CALL_ENDED, (payload) => signalingHandler.handleCallEnded(s, payload));
    s.on('disconnect', () => signalingHandler.handleDisconnect(s));

    s.on('error', (err) => {
      logger.error('Socket error', { socketId: s.id, error: err.message });
    });
  });
}
