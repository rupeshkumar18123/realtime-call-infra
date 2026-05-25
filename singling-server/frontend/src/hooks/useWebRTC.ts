'use client';
import { useRef, useCallback, useEffect } from 'react';
import { WebRTCService } from '@/lib/webrtc';
import { getActiveSocket } from '@/lib/socket';
import { useCallStore } from '@/store/callStore';
import { useMediaStore } from '@/store/mediaStore';
import { SOCKET_EVENTS } from '@/types/events';

export function useWebRTC(roomId: string, localUserId: string) {
  const serviceRef = useRef<WebRTCService | null>(null);
  const { setRemoteStream, setStatus, setRemotePeerId, reset } = useCallStore();
  const localStream = useMediaStore((s) => s.localStream);

  const getService = useCallback(() => {
    if (!serviceRef.current) {
      serviceRef.current = new WebRTCService();
    }
    return serviceRef.current;
  }, []);

  const createPC = useCallback((targetUserId: string) => {
    const socket = getActiveSocket();
    const svc = getService();

    const pc = svc.create(
      (candidate) => {
        socket?.emit(SOCKET_EVENTS.ICE_CANDIDATE, { roomId, targetUserId, candidate });
      },
      (event) => {
        if (event.streams[0]) setRemoteStream(event.streams[0]);
      },
      (state) => {
        if (state === 'connected') setStatus('connected');
        if (state === 'disconnected' || state === 'failed') setStatus('disconnected');
      },
    );

    if (localStream) svc.addStream(localStream);
    return pc;
  }, [roomId, localStream, getService, setRemoteStream, setStatus]);

  const initiateCall = useCallback(async (targetUserId: string) => {
    const socket = getActiveSocket();
    if (!socket) return;
    setStatus('connecting');
    setRemotePeerId(targetUserId);
    createPC(targetUserId);
    const offer = await getService().createOffer();
    socket.emit(SOCKET_EVENTS.OFFER, { roomId, targetUserId, sdp: offer });
  }, [roomId, createPC, getService, setStatus, setRemotePeerId]);

  // Register socket listeners for incoming signaling
  useEffect(() => {
    const socket = getActiveSocket();
    if (!socket) return;

    const onOffer = async ({ sdp, fromUserId }: { sdp: RTCSessionDescriptionInit; fromUserId: string }) => {
      setStatus('connecting');
      setRemotePeerId(fromUserId);
      createPC(fromUserId);
      await getService().setRemoteDescription(sdp);
      const answer = await getService().createAnswer();
      socket.emit(SOCKET_EVENTS.ANSWER, { roomId, targetUserId: fromUserId, sdp: answer });
    };

    const onAnswer = async ({ sdp }: { sdp: RTCSessionDescriptionInit }) => {
      await getService().setRemoteDescription(sdp);
    };

    const onIce = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      await getService().addIceCandidate(candidate);
    };

    const onCallEnded = () => {
      serviceRef.current?.close();
      serviceRef.current = null;
      reset();
    };

    socket.on(SOCKET_EVENTS.OFFER, onOffer);
    socket.on(SOCKET_EVENTS.ANSWER, onAnswer);
    socket.on(SOCKET_EVENTS.ICE_CANDIDATE, onIce);
    socket.on(SOCKET_EVENTS.CALL_ENDED, onCallEnded);
    socket.on(SOCKET_EVENTS.USER_DISCONNECTED, onCallEnded);

    return () => {
      socket.off(SOCKET_EVENTS.OFFER, onOffer);
      socket.off(SOCKET_EVENTS.ANSWER, onAnswer);
      socket.off(SOCKET_EVENTS.ICE_CANDIDATE, onIce);
      socket.off(SOCKET_EVENTS.CALL_ENDED, onCallEnded);
      socket.off(SOCKET_EVENTS.USER_DISCONNECTED, onCallEnded);
    };
  }, [roomId, createPC, getService, reset, setStatus, setRemotePeerId]);

  const hangUp = useCallback(() => {
    const socket = getActiveSocket();
    socket?.emit(SOCKET_EVENTS.CALL_ENDED, { roomId });
    serviceRef.current?.close();
    serviceRef.current = null;
    reset();
  }, [roomId, reset]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      serviceRef.current?.close();
      serviceRef.current = null;
    };
  }, []);

  return { initiateCall, hangUp };
}
