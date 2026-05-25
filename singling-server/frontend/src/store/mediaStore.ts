import { create } from 'zustand';

interface MediaState {
  localStream: MediaStream | null;
  audioEnabled: boolean;
  videoEnabled: boolean;
  setLocalStream: (stream: MediaStream | null) => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  stopAll: () => void;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  localStream: null,
  audioEnabled: true,
  videoEnabled: true,
  setLocalStream: (localStream) => set({ localStream }),
  toggleAudio: () => {
    const { localStream, audioEnabled } = get();
    localStream?.getAudioTracks().forEach((t) => (t.enabled = !audioEnabled));
    set({ audioEnabled: !audioEnabled });
  },
  toggleVideo: () => {
    const { localStream, videoEnabled } = get();
    localStream?.getVideoTracks().forEach((t) => (t.enabled = !videoEnabled));
    set({ videoEnabled: !videoEnabled });
  },
  stopAll: () => {
    get().localStream?.getTracks().forEach((t) => t.stop());
    set({ localStream: null, audioEnabled: true, videoEnabled: true });
  },
}));
