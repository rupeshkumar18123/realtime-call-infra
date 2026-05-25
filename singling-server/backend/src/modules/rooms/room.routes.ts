import { Router } from 'express';
import { roomController } from './room.controller';
import { validate } from '@middleware/validate';
import { authenticate, optionalAuth } from '@middleware/authenticate';
import { createRoomSchema, roomIdParamSchema } from './room.schema';

export const roomRouter = Router();

roomRouter.get('/', roomController.list.bind(roomController));
roomRouter.get('/:roomId', validate(roomIdParamSchema), roomController.get.bind(roomController));
roomRouter.post('/', authenticate, validate(createRoomSchema), roomController.create.bind(roomController));
roomRouter.delete('/:roomId', authenticate, validate(roomIdParamSchema), roomController.end.bind(roomController));
