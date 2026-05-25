import { v4 as uuidv4 } from 'uuid';
import { Room, Participant, CreateRoomDto } from '@types/room.types';
import { config } from '@config/index';
import { ConflictError, NotFoundError, ForbiddenError } from '@core/errors';
import { logger } from '@logger/index';

/**
 * In-memory room store.
 * For multi-instance deployments, replace with a Redis-backed repository.
 */
export class RoomService {
  private rooms = new Map<string, Room>();

  createRoom(dto: CreateRoomDto, hostId: string): Room {
    const room: Room = {
      id: uuidv4(),
      name: dto.name,
      hostId,
      participants: new Map(),
      maxParticipants: dto.maxParticipants ?? config.room.maxParticipants,
      status: 'waiting',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.rooms.set(room.id, room);
    logger.info('Room created', { roomId: room.id, hostId });
    return room;
  }

  getRoom(roomId: string): Room {
    const room = this.rooms.get(roomId);
    if (!room) throw new NotFoundError('Room');
    return room;
  }

  listRooms(): Room[] {
    return Array.from(this.rooms.values()).filter((r) => r.status !== 'ended');
  }

  joinRoom(roomId: string, participant: Participant): Room {
    const room = this.getRoom(roomId);
    if (room.status === 'ended') throw new ForbiddenError('Room has ended');
    if (room.participants.size >= room.maxParticipants) {
      throw new ConflictError('Room is full');
    }
    room.participants.set(participant.userId, participant);
    room.status = 'active';
    room.updatedAt = new Date();
    logger.info('Participant joined room', { roomId, userId: participant.userId });
    return room;
  }

  leaveRoom(roomId: string, userId: string): Room {
    const room = this.getRoom(roomId);
    room.participants.delete(userId);
    room.updatedAt = new Date();
    if (room.participants.size === 0) {
      room.status = 'ended';
      logger.info('Room ended (empty)', { roomId });
    }
    return room;
  }

  endRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.status = 'ended';
      room.updatedAt = new Date();
    }
  }

  getRoomParticipants(roomId: string): Participant[] {
    return Array.from(this.getRoom(roomId).participants.values());
  }

  findSocketInRoom(roomId: string, userId: string): string | undefined {
    return this.rooms.get(roomId)?.participants.get(userId)?.socketId;
  }

  /** Cleanup idle/ended rooms periodically */
  purgeEndedRooms(): void {
    for (const [id, room] of this.rooms) {
      if (room.status === 'ended') this.rooms.delete(id);
    }
  }
}

export const roomService = new RoomService();
