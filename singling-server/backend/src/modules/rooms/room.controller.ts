import { Request, Response } from 'express';
import { roomService } from './room.service';
import { CreateRoomDto } from '@types/room.types';

const serializeRoom = (room: ReturnType<typeof roomService.getRoom>) => ({
  id: room.id,
  name: room.name,
  hostId: room.hostId,
  status: room.status,
  maxParticipants: room.maxParticipants,
  participantCount: room.participants.size,
  createdAt: room.createdAt,
});

export class RoomController {
  list(_req: Request, res: Response): void {
    const rooms = roomService.listRooms().map(serializeRoom);
    res.json({ success: true, data: rooms });
  }

  get(req: Request, res: Response): void {
    const room = roomService.getRoom(req.params.roomId);
    res.json({ success: true, data: serializeRoom(room) });
  }

  create(req: Request, res: Response): void {
    const hostId = req.user?.sub ?? 'anonymous';
    const room = roomService.createRoom(req.body as CreateRoomDto, hostId);
    res.status(201).json({ success: true, data: serializeRoom(room) });
  }

  end(req: Request, res: Response): void {
    roomService.endRoom(req.params.roomId);
    res.json({ success: true, message: 'Room ended' });
  }
}

export const roomController = new RoomController();
