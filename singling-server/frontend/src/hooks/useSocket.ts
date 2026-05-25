'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRoomStore } from '@/store/roomStore';
import { useCallStore } from '@/store/callStore';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { SOCKET_EVENTS } from '@/types/events';
import { Participant } from '@/types';

export function useSocket() {
  const user = useAuthStore((s) => s.user);
  const {
    addParticipant,
    removeParticipant,
    setParticipants,
  } = useRoomStore();
  const { setStatus } = useCallStore();
  const bound = useRef(false);

  const connect = useCallback(() => {
    if (!user || bound.current) return;
    const socket = getSocket(user.token);
    bound.current = true;

    // Socket transport up does not mean media call established.
    socket.on('connect', () => undefined);
    socket.on('disconnect', () =>
      setStatus('disconnected'),
    );
    socket.on('connect_error', () =>
      setStatus('error'),
    );

    socket.on(
      SOCKET_EVENTS.ROOM_JOINED,
      ({
        participants,
      }: {
        participants: Participant[];
      }) => {
        setParticipants(participants);
      },
    );
    socket.on(
      SOCKET_EVENTS.USER_CONNECTED,
      (p: Participant) => addParticipant(p),
    );
    socket.on(
      SOCKET_EVENTS.USER_DISCONNECTED,
      ({ userId }: { userId: string }) =>
        removeParticipant(userId),
    );

    socket.connect();
  }, [
    user,
    setStatus,
    setParticipants,
    addParticipant,
    removeParticipant,
  ]);

  const disconnect = useCallback(() => {
    disconnectSocket();
    bound.current = false;
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { connect, disconnect };
}
