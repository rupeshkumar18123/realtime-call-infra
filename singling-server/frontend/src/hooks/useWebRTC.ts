'use client';

import { useEffect, useRef, useCallback } from 'react';
import { WebRTCService } from '@/lib/webrtc';
import { getActiveSocket } from '@/lib/socket';
import { useCallStore } from '@/store/callStore';
import { useMediaStore } from '@/store/mediaStore';
import { SOCKET_EVENTS } from '@/types/events';

export function useWebRTC(
  roomId: string,
  localUserId: string,
) {
  const serviceRef = useRef<WebRTCService | null>(null);

  const remoteStreamRef = useRef<MediaStream>(
    new MediaStream(),
  );

  const pendingCandidatesRef = useRef<
    RTCIceCandidateInit[]
  >([]);

  const remoteDescSetRef = useRef(false);

  const localStream = useMediaStore(
    (state: any) => state.localStream,
  );

  const setLocalStream = useMediaStore(
    (state: any) => state.setLocalStream,
  );

  const {
    setRemoteStream,
    setStatus,
    setRemotePeerId,
    reset,
  } = useCallStore();

  const getService = useCallback(() => {
    if (!serviceRef.current) {
      serviceRef.current = new WebRTCService();
    }

    return serviceRef.current;
  }, []);

  const ensureLocalStream = useCallback(async () => {
    let stream = localStream as MediaStream | null;

    if (!stream) {
      stream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

      setLocalStream(stream);
    }

    console.log(
      'Local tracks:',
      stream
        .getTracks()
        .map((t: MediaStreamTrack) => t.kind),
    );

    return stream;
  }, [localStream, setLocalStream]);

  const flushPendingCandidates = useCallback(async () => {
    const service = getService();

    for (const candidate of pendingCandidatesRef.current) {
      try {
        await service.addIceCandidate(candidate);
      } catch (error) {
        console.error(error);
      }
    }

    pendingCandidatesRef.current = [];
  }, [getService]);

  const createPeerConnection = useCallback(
    async (targetUserId: string) => {
      const socket = getActiveSocket();

      const service = getService();

      remoteStreamRef.current = new MediaStream();

      service.create(
        (candidate) => {
          socket?.emit(SOCKET_EVENTS.ICE_CANDIDATE, {
            roomId,
            targetUserId,
            candidate,
          });
        },

        (event) => {
          console.log(
            'Track received:',
            event.track.kind,
          );

          remoteStreamRef.current.addTrack(
            event.track,
          );

          setRemoteStream(remoteStreamRef.current);
        },

        (state) => {
          console.log('Connection state:', state);

          if (state === 'connected') {
            setStatus('connected');
          }

          if (
            state === 'disconnected' ||
            state === 'failed' ||
            state === 'closed'
          ) {
            setStatus('disconnected');
          }
        },
      );

      // IMPORTANT FIX
      const stream = await ensureLocalStream();

      stream.getTracks().forEach((track) => {
        service.addTrack(track, stream);
      });

      return service;
    },
    [
      roomId,
      getService,
      ensureLocalStream,
      setRemoteStream,
      setStatus,
    ],
  );

  const initiateCall = useCallback(
    async (targetUserId: string) => {
      try {
        const socket = getActiveSocket();

        if (!socket) return;

        setStatus('connecting');

        setRemotePeerId(targetUserId);

        await createPeerConnection(targetUserId);

        const offer =
          await getService().createOffer();

        socket.emit(SOCKET_EVENTS.OFFER, {
          roomId,
          targetUserId,
          sdp: offer,
        });
      } catch (error) {
        console.error(error);
      }
    },
    [
      roomId,
      createPeerConnection,
      getService,
      setStatus,
      setRemotePeerId,
    ],
  );

  useEffect(() => {
    const socket = getActiveSocket();

    if (!socket) return;

    const onOffer = async ({
      sdp,
      fromUserId,
    }: any) => {
      try {
        console.log('Offer received');

        setStatus('connecting');

        setRemotePeerId(fromUserId);

        await createPeerConnection(fromUserId);

        await getService().setRemoteDescription(
          sdp,
        );

        remoteDescSetRef.current = true;

        await flushPendingCandidates();

        const answer =
          await getService().createAnswer();

        socket.emit(SOCKET_EVENTS.ANSWER, {
          roomId,
          targetUserId: fromUserId,
          sdp: answer,
        });
      } catch (error) {
        console.error(error);
      }
    };

    const onAnswer = async ({ sdp }: any) => {
      try {
        console.log('Answer received');

        await getService().setRemoteDescription(
          sdp,
        );

        remoteDescSetRef.current = true;

        await flushPendingCandidates();
      } catch (error) {
        console.error(error);
      }
    };

    const onIceCandidate = async ({
      candidate,
    }: any) => {
      try {
        if (remoteDescSetRef.current) {
          await getService().addIceCandidate(
            candidate,
          );
        } else {
          pendingCandidatesRef.current.push(
            candidate,
          );
        }
      } catch (error) {
        console.error(error);
      }
    };

    const onCallEnded = () => {
      serviceRef.current?.close();

      serviceRef.current = null;

      remoteStreamRef.current = new MediaStream();

      pendingCandidatesRef.current = [];

      remoteDescSetRef.current = false;

      setRemoteStream(null);

      reset();
    };

    socket.on(SOCKET_EVENTS.OFFER, onOffer);

    socket.on(SOCKET_EVENTS.ANSWER, onAnswer);

    socket.on(
      SOCKET_EVENTS.ICE_CANDIDATE,
      onIceCandidate,
    );

    socket.on(
      SOCKET_EVENTS.CALL_ENDED,
      onCallEnded,
    );

    socket.on(
      SOCKET_EVENTS.USER_DISCONNECTED,
      onCallEnded,
    );

    return () => {
      socket.off(SOCKET_EVENTS.OFFER, onOffer);

      socket.off(SOCKET_EVENTS.ANSWER, onAnswer);

      socket.off(
        SOCKET_EVENTS.ICE_CANDIDATE,
        onIceCandidate,
      );

      socket.off(
        SOCKET_EVENTS.CALL_ENDED,
        onCallEnded,
      );

      socket.off(
        SOCKET_EVENTS.USER_DISCONNECTED,
        onCallEnded,
      );
    };
  }, [
    roomId,
    createPeerConnection,
    flushPendingCandidates,
    getService,
    reset,
    setRemotePeerId,
    setRemoteStream,
    setStatus,
  ]);

  const hangUp = useCallback(() => {
    const socket = getActiveSocket();

    socket?.emit(SOCKET_EVENTS.CALL_ENDED, {
      roomId,
    });

    serviceRef.current?.close();

    serviceRef.current = null;

    pendingCandidatesRef.current = [];

    remoteDescSetRef.current = false;

    remoteStreamRef.current = new MediaStream();

    setRemoteStream(null);

    reset();
  }, [roomId, reset, setRemoteStream]);

  useEffect(() => {
    return () => {
      serviceRef.current?.close();
    };
  }, []);

  return {
    initiateCall,
    hangUp,
  };
}

// 'use client';
// import { useRef, useCallback, useEffect } from 'react';
// import { WebRTCService } from '@/lib/webrtc';
// import { getActiveSocket } from '@/lib/socket';
// import { useCallStore } from '@/store/callStore';
// import { useMediaStore } from '@/store/mediaStore';
// import { SOCKET_EVENTS } from '@/types/events';

// export function useWebRTC(roomId: string, localUserId: string) {
//   const serviceRef = useRef<WebRTCService | null>(null);
//   const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
//   const remoteDescSetRef = useRef(false);
//   const { setRemoteStream, setStatus, setRemotePeerId, reset } = useCallStore();
//   const localStream = useMediaStore((s:any) => s.localStream);
//   // Keep a ref so callbacks always see the latest stream
//   const localStreamRef = useRef(localStream);
//   useEffect(() => { localStreamRef.current = localStream; }, [localStream]);

//   const getService = useCallback(() => {
//     if (!serviceRef.current) serviceRef.current = new WebRTCService();
//     return serviceRef.current;
//   }, []);

//   const flushCandidates = useCallback(async () => {
//     const svc = getService();
//     for (const c of pendingCandidatesRef.current) {
//       await svc.addIceCandidate(c);
//     }
//     pendingCandidatesRef.current = [];
//   }, [getService]);

//   const createPC = useCallback((targetUserId: string) => {
//     const socket = getActiveSocket();
//     const svc = getService();
//     remoteDescSetRef.current = false;
//     pendingCandidatesRef.current = [];

//     const pc = svc.create(
//       (candidate:any) => {
//         socket?.emit(SOCKET_EVENTS.ICE_CANDIDATE, { roomId, targetUserId, candidate });
//       },
//       (event:any) => {
//         if (event.streams[0]) setRemoteStream(event.streams[0]);
//       },
//       (state:any) => {
//         if (state === 'connected') setStatus('connected');
//         if (state === 'disconnected' || state === 'failed') setStatus('disconnected');
//       },
//     );

//     // Use ref so we always get the current stream even if called before state updates
//     if (localStreamRef.current) svc.addStream(localStreamRef.current);
//     return pc;
//   }, [roomId, getService, setRemoteStream, setStatus]);

//   const setRemoteDesc = useCallback(async (sdp: RTCSessionDescriptionInit) => {
//     await getService().setRemoteDescription(sdp);
//     remoteDescSetRef.current = true;
//     await flushCandidates();
//   }, [getService, flushCandidates]);

//   const initiateCall = useCallback(async (targetUserId: string) => {
//     const socket = getActiveSocket();
//     if (!socket) return;
//     setStatus('connecting');
//     setRemotePeerId(targetUserId);
//     createPC(targetUserId);
//     const offer = await getService().createOffer();
//     socket.emit(SOCKET_EVENTS.OFFER, { roomId, targetUserId, sdp: offer });
//   }, [roomId, createPC, getService, setStatus, setRemotePeerId]);

//   useEffect(() => {
//     const socket = getActiveSocket();
//     if (!socket) return;

//     const onOffer = async ({ sdp, fromUserId }: { sdp: RTCSessionDescriptionInit; fromUserId: string }) => {
//       setStatus('connecting');
//       setRemotePeerId(fromUserId);
//       createPC(fromUserId);
//       await setRemoteDesc(sdp);
//       const answer = await getService().createAnswer();
//       socket.emit(SOCKET_EVENTS.ANSWER, { roomId, targetUserId: fromUserId, sdp: answer });
//     };

//     const onAnswer = async ({ sdp }: { sdp: RTCSessionDescriptionInit }) => {
//       await setRemoteDesc(sdp);
//     };

//     const onIce = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
//       if (remoteDescSetRef.current) {
//         await getService().addIceCandidate(candidate);
//       } else {
//         pendingCandidatesRef.current.push(candidate);
//       }
//     };

//     const onCallEnded = () => {
//       serviceRef.current?.close();
//       serviceRef.current = null;
//       remoteDescSetRef.current = false;
//       pendingCandidatesRef.current = [];
//       reset();
//     };

//     socket.on(SOCKET_EVENTS.OFFER, onOffer);
//     socket.on(SOCKET_EVENTS.ANSWER, onAnswer);
//     socket.on(SOCKET_EVENTS.ICE_CANDIDATE, onIce);
//     socket.on(SOCKET_EVENTS.CALL_ENDED, onCallEnded);
//     socket.on(SOCKET_EVENTS.USER_DISCONNECTED, onCallEnded);

//     return () => {
//       socket.off(SOCKET_EVENTS.OFFER, onOffer);
//       socket.off(SOCKET_EVENTS.ANSWER, onAnswer);
//       socket.off(SOCKET_EVENTS.ICE_CANDIDATE, onIce);
//       socket.off(SOCKET_EVENTS.CALL_ENDED, onCallEnded);
//       socket.off(SOCKET_EVENTS.USER_DISCONNECTED, onCallEnded);
//     };
//   }, [roomId, createPC, getService, setRemoteDesc, reset, setStatus, setRemotePeerId]);

//   const hangUp = useCallback(() => {
//     const socket = getActiveSocket();
//     socket?.emit(SOCKET_EVENTS.CALL_ENDED, { roomId });
//     serviceRef.current?.close();
//     serviceRef.current = null;
//     remoteDescSetRef.current = false;
//     pendingCandidatesRef.current = [];
//     reset();
//   }, [roomId, reset]);

//   useEffect(() => {
//     return () => {
//       serviceRef.current?.close();
//       serviceRef.current = null;
//     };
//   }, []);

//   return { initiateCall, hangUp };
// }
