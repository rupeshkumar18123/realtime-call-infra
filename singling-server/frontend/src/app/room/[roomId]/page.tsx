'use client';
import { useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useRoomStore } from '@/store/roomStore';
import { useCallStore } from '@/store/callStore';
import { useMediaStore } from '@/store/mediaStore';
import { useSocket } from '@/hooks/useSocket';
import { useMedia } from '@/hooks/useMedia';
import { useWebRTC } from '@/hooks/useWebRTC';
import { getActiveSocket } from '@/lib/socket';
import { SOCKET_EVENTS } from '@/types/events';
import { VideoTile } from '@/components/video/VideoTile';
import { Controls } from '@/components/video/Controls';
import { Badge } from '@/components/ui/Badge';
import { Users, ArrowLeft, Wifi, WifiOff } from 'lucide-react';
import Link from 'next/link';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const user = useAuthStore((s) => s.user);
  const participants = useRoomStore((s) => s.participants);
  const { status, remoteStream, remotePeerId } = useCallStore();
  const { localStream, audioEnabled, videoEnabled, toggleAudio, toggleVideo } = useMediaStore();

  const { connect, disconnect } = useSocket();
  const { startMedia, stopAll } = useMedia();
  const { initiateCall, hangUp } = useWebRTC(roomId, user?.userId ?? '');

  const joinRoom = useCallback(() => {
    const socket = getActiveSocket();
    if (!socket || !user) return;
    socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId, userId: user.userId, username: user.username });
  }, [roomId, user]);

  useEffect(() => {
    if (!user) { router.replace('/'); return; }

    (async () => {
      await startMedia();
      connect();
      // Wait for socket to connect then join room
      const socket = getActiveSocket();
      if (socket) {
        if (socket.connected) {
          joinRoom();
        } else {
          socket.once('connect', joinRoom);
        }
      }
    })();

    return () => {
      const socket = getActiveSocket();
      socket?.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomId });
      stopAll();
      disconnect();
    };
  }, []); // eslint-disable-line

  const handleHangUp = () => {
    hangUp();
  };

  const callPeer = (targetUserId: string) => {
    initiateCall(targetUserId);
  };

  const statusBadge = {
    idle: <Badge variant="success">Connected</Badge>,
    connecting: <Badge variant="warning">Calling...</Badge>,
    connected: <Badge variant="success">In Call</Badge>,
    disconnected: <Badge variant="danger">Disconnected</Badge>,
    error: <Badge variant="danger">Error</Badge>,
  }[status];

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <span className="text-white font-medium text-sm truncate max-w-[160px]">{roomId}</span>
          {statusBadge}
        </div>
        <div className="flex items-center gap-2 text-zinc-400 text-sm">
          <Users size={14} />
          <span>{participants.length + 1}</span>
          {status === 'connected' ? <Wifi size={14} className="text-green-400" /> : <WifiOff size={14} className="text-zinc-500" />}
        </div>
      </header>

      {/* Video grid */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <VideoTile
          stream={localStream}
          label={`You (${user?.username})`}
          muted
          audioEnabled={audioEnabled}
          videoEnabled={videoEnabled}
          className="aspect-video"
        />
        <VideoTile
          stream={remoteStream}
          label={remotePeerId ?? 'Remote'}
          audioEnabled
          videoEnabled
          className="aspect-video"
        />
      </div>

      {/* Participants sidebar (mobile: below, desktop: right) */}
      {participants.length > 0 && (
        <div className="px-4 pb-2">
          <p className="text-zinc-500 text-xs mb-2">Participants in room</p>
          <div className="flex flex-wrap gap-2">
            {participants.map((p) => (
              <button
                key={p.userId}
                onClick={() => callPeer(p.userId)}
                disabled={status === 'connecting' || status === 'connected'}
                className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs px-3 py-1.5 rounded-full transition-colors"
              >
                📞 Call {p.username}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <Controls
        audioEnabled={audioEnabled}
        videoEnabled={videoEnabled}
        callActive={status === 'connected' || status === 'connecting'}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onHangUp={handleHangUp}
      />
    </main>
  );
}
