import { create } from 'zustand';
import { Room, Participant } from '@/types';

interface RoomState {
  currentRoom: Room | null;
  participants: Participant[];
  rooms: Room[];
  setCurrentRoom: (room: Room | null) => void;
  setParticipants: (participants: Participant[]) => void;
  addParticipant: (p: Participant) => void;
  removeParticipant: (userId: string) => void;
  setRooms: (rooms: Room[]) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  currentRoom: null,
  participants: [],
  rooms: [],
  setCurrentRoom: (room) => set({ currentRoom: room }),
  setParticipants: (participants) => set({ participants }),
  addParticipant: (p) => set((s) => ({ participants: [...s.participants.filter(x => x.userId !== p.userId), p] })),
  removeParticipant: (userId) => set((s) => ({ participants: s.participants.filter((p) => p.userId !== userId) })),
  setRooms: (rooms) => set({ rooms }),
}));
