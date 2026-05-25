import { z } from 'zod';
import { config } from '@config/index';

export const createRoomSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    maxParticipants: z.number().int().min(2).max(50).optional(),
  }),
});

export const roomIdParamSchema = z.object({
  params: z.object({
    roomId: z.string().uuid(),
  }),
});

export const joinRoomSocketSchema = z.object({
  roomId: z.string().min(1),
  userId: z.string().min(1),
  username: z.string().min(1).max(50),
});

export const signalingSchema = z.object({
  roomId: z.string().min(1),
  targetUserId: z.string().min(1),
  sdp: z.record(z.unknown()),
});

export const iceCandidateSchema = z.object({
  roomId: z.string().min(1),
  targetUserId: z.string().min(1),
  candidate: z.record(z.unknown()),
});

export const MAX_PARTICIPANTS = config.room.maxParticipants;
