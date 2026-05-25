'use client';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { VideoOff, MicOff } from 'lucide-react';

interface VideoTileProps {
  stream: MediaStream | null;
  label?: string;
  muted?: boolean;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
  className?: string;
}

export function VideoTile({ stream, label, muted = false, audioEnabled = true, videoEnabled = true, className }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={cn('relative bg-zinc-900 rounded-xl overflow-hidden flex items-center justify-center', className)}>
      {stream && videoEnabled ? (
        <video ref={videoRef} autoPlay playsInline muted={muted} className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-2 text-zinc-500">
          <VideoOff size={40} />
          <span className="text-sm">Camera off</span>
        </div>
      )}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
        {label && (
          <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">{label}</span>
        )}
        {!audioEnabled && <MicOff size={14} className="text-red-400" />}
      </div>
    </div>
  );
}
