import { create } from 'zustand';
import { CallStatus } from '@/types';

interface CallState {
  status: CallStatus;
  remoteStream: MediaStream | null;
  remotePeerId: string | null;
  setStatus: (status: CallStatus) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  setRemotePeerId: (id: string | null) => void;
  reset: () => void;
}

export const useCallStore = create<CallState>((set) => ({
  status: 'idle',
  remoteStream: null,
  remotePeerId: null,
  setStatus: (status) => set({ status }),
  setRemoteStream: (remoteStream) => set({ remoteStream }),
  setRemotePeerId: (remotePeerId) => set({ remotePeerId }),
  reset: () => set({ status: 'idle', remoteStream: null, remotePeerId: null }),
}));
