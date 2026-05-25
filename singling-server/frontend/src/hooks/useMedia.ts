'use client';
import { useCallback } from 'react';
import { useMediaStore } from '@/store/mediaStore';

export function useMedia() {
  const { setLocalStream, stopAll } = useMediaStore();

  const startMedia = useCallback(async (video = true, audio = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Media access denied:', err);
      return null;
    }
  }, [setLocalStream]);

  return { startMedia, stopAll };
}
