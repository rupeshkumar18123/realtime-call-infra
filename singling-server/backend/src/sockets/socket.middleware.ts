import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '@config/index';
import { JwtPayload } from '@types/auth.types';
import { AuthenticatedSocket } from '@types/socket.types';
import { logger } from '@logger/index';

export function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void): void {
  const token =
    (socket.handshake.auth?.token as string) ||
    (socket.handshake.headers?.authorization as string)?.replace('Bearer ', '');

  if (!token) {
    logger.warn('Socket auth failed: no token', { socketId: socket.id });
    return next(new Error('Authentication required'));
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    (socket as AuthenticatedSocket).data.user = payload;
    next();
  } catch {
    logger.warn('Socket auth failed: invalid token', { socketId: socket.id });
    next(new Error('Invalid or expired token'));
  }
}
