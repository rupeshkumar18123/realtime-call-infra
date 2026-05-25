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
  const pcRef = useRef<WebRTCService | null>(null);
  const activePeerIdRef = useRef<string | null>(null);
  const remoteDescSetRef = useRef(false);
  const pendingIceCandidatesRef = useRef<
    RTCIceCandidateInit[]
  >([]);
  const remoteStreamRef = useRef<MediaStream>(
    new MediaStream(),
  );

  const localStream = useMediaStore(
    (s: any) => s.localStream,
  );

  const setLocalStream = useMediaStore(
    (s: any) => s.setLocalStream,
  );

  const {
    setRemoteStream,
    setStatus,
    setRemotePeerId,
    reset,
  } = useCallStore();

  const teardownCall = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    activePeerIdRef.current = null;
    remoteDescSetRef.current = false;
    pendingIceCandidatesRef.current = [];
    remoteStreamRef.current = new MediaStream();
    setRemoteStream(null);
    reset();
  }, [reset, setRemoteStream]);

  const getOrCreateLocalStream =
    useCallback(async () => {
      let stream = localStream;

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
          .map(
            (t: MediaStreamTrack) => t.kind,
          ),
      );

      return stream;
    }, [localStream, setLocalStream]);

  const flushPendingIceCandidates =
    useCallback(async () => {
      if (
        !pcRef.current ||
        !remoteDescSetRef.current ||
        pendingIceCandidatesRef.current.length === 0
      ) {
        return;
      }

      const queued = [
        ...pendingIceCandidatesRef.current,
      ];
      pendingIceCandidatesRef.current = [];

      for (const candidate of queued) {
        await pcRef.current.addIceCandidate(
          candidate,
        );
      }
    }, []);

  const createPeerConnection = useCallback(
    async (
      targetUserId: string,
      forceRecreate = false,
    ) => {
      if (
        pcRef.current &&
        !forceRecreate &&
        activePeerIdRef.current === targetUserId
      ) {
        return pcRef.current;
      }

      pcRef.current?.close();
      const socket = getActiveSocket();
      const service = new WebRTCService();

      pcRef.current = service;
      activePeerIdRef.current = targetUserId;
      remoteDescSetRef.current = false;
      pendingIceCandidatesRef.current = [];
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
            'Remote track:',
            event.track.kind,
          );
          const incomingStream =
            event.streams?.[0];
          if (incomingStream) {
            setRemoteStream(incomingStream);
            return;
          }
          remoteStreamRef.current.addTrack(event.track);
          setRemoteStream(
            remoteStreamRef.current,
          );
        },

        (state) => {
          console.log('PC State:', state);
          if (state === 'connected') {
            setStatus('connected');
          }
          if (
            state === 'failed' ||
            state === 'disconnected'
          ) {
            setStatus('disconnected');
          }
          if (state === 'closed') {
            teardownCall();
          }
        },
      );

      // ADD TRACKS BEFORE OFFER
      const stream =
        await getOrCreateLocalStream();

      stream
        .getTracks()
        .forEach(
          (track: MediaStreamTrack) => {
            service.addTrack(track, stream);
          },
        );

      return service;
    },
    [
      roomId,
      setRemoteStream,
      setStatus,
      getOrCreateLocalStream,
      teardownCall,
    ],
  );

  const applyRemoteDescription =
    useCallback(
      async (
        sdp: RTCSessionDescriptionInit,
      ) => {
        if (!pcRef.current) return;
        await pcRef.current.setRemoteDescription(sdp);
        remoteDescSetRef.current = true;
        await flushPendingIceCandidates();
      },
      [flushPendingIceCandidates],
    );

  const initiateCall = useCallback(
    async (targetUserId: string) => {
      try {
        const socket = getActiveSocket();

        if (!socket) return;

        // FIXED
        setStatus('connecting');

        setRemotePeerId(targetUserId);

        const pc =
          await createPeerConnection(
            targetUserId,
            true,
          );

        const offer = await pc.createOffer();

        socket.emit(SOCKET_EVENTS.OFFER, {
          roomId,
          targetUserId,
          sdp: offer,
        });

        console.log('Offer sent');
      } catch (error) {
        console.error(error);
      }
    },
    [
      roomId,
      createPeerConnection,
      setStatus,
      setRemotePeerId,
    ],
  );

  useEffect(() => {
    const socket = getActiveSocket();

    if (!socket) return;

    socket.on(
      SOCKET_EVENTS.OFFER,
      async ({ sdp, fromUserId }: any) => {
        try {
          console.log('Offer received');
          setStatus('connecting');
          setRemotePeerId(fromUserId);
          const pc =
            await createPeerConnection(
              fromUserId,
              true,
            );

          await applyRemoteDescription(sdp);

          const answer =
            await pc.createAnswer();

          socket.emit(SOCKET_EVENTS.ANSWER, {
            roomId,
            targetUserId: fromUserId,
            sdp: answer,
          });

          console.log('Answer sent');
        } catch (error) {
          console.error(error);
        }
      },
    );

    socket.on(
      SOCKET_EVENTS.ANSWER,
      async ({ sdp }: any) => {
        try {
          console.log('Answer received');

          if (!pcRef.current) return;
          await applyRemoteDescription(sdp);

          console.log(
            'Remote answer applied',
          );
        } catch (error) {
          console.error(error);
        }
      },
    );

    socket.on(
      SOCKET_EVENTS.ICE_CANDIDATE,
      async ({ candidate }: any) => {
        try {
          if (!pcRef.current) return;
          if (!remoteDescSetRef.current) {
            pendingIceCandidatesRef.current.push(
              candidate,
            );
            return;
          }
          await pcRef.current.addIceCandidate(candidate);
        } catch (error) {
          console.error(error);
        }
      },
    );

    socket.on(
      SOCKET_EVENTS.CALL_ENDED,
      teardownCall,
    );

    socket.on(
      SOCKET_EVENTS.USER_DISCONNECTED,
      ({ userId }: { userId: string }) => {
        if (
          activePeerIdRef.current &&
          userId === activePeerIdRef.current
        ) {
          teardownCall();
        }
      },
    );

    return () => {
      socket.off(SOCKET_EVENTS.OFFER);

      socket.off(SOCKET_EVENTS.ANSWER);

      socket.off(
        SOCKET_EVENTS.ICE_CANDIDATE,
      );

      socket.off(
        SOCKET_EVENTS.CALL_ENDED,
        teardownCall,
      );

      socket.off(
        SOCKET_EVENTS.USER_DISCONNECTED,
      );
    };
  }, [
    roomId,
    createPeerConnection,
    reset,
    setRemotePeerId,
    setStatus,
    applyRemoteDescription,
    teardownCall,
  ]);

  const hangUp = useCallback(() => {
    const socket = getActiveSocket();

    socket?.emit(SOCKET_EVENTS.CALL_ENDED, {
      roomId,
    });
    teardownCall();
  }, [roomId, teardownCall]);

  useEffect(() => {
    return () => {
      teardownCall();
    };
  }, [teardownCall]);

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
