'use client';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ControlsProps {
  audioEnabled: boolean;
  videoEnabled: boolean;
  callActive: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onHangUp: () => void;
  onCall?: () => void;
  canCall?: boolean;
}

export function Controls({ audioEnabled, videoEnabled, callActive, onToggleAudio, onToggleVideo, onHangUp, onCall, canCall }: ControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4 p-4">
      <ControlBtn onClick={onToggleAudio} active={audioEnabled} label={audioEnabled ? 'Mute' : 'Unmute'}>
        {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
      </ControlBtn>
      <ControlBtn onClick={onToggleVideo} active={videoEnabled} label={videoEnabled ? 'Stop video' : 'Start video'}>
        {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
      </ControlBtn>
      {callActive ? (
        <ControlBtn onClick={onHangUp} variant="danger" label="Hang up">
          <PhoneOff size={20} />
        </ControlBtn>
      ) : (
        canCall && (
          <ControlBtn onClick={onCall!} variant="success" label="Call">
            <Phone size={20} />
          </ControlBtn>
        )
      )}
    </div>
  );
}

function ControlBtn({ children, onClick, active = true, variant, label }: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  variant?: 'danger' | 'success';
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
        variant === 'danger' && 'bg-red-600 hover:bg-red-700 text-white',
        variant === 'success' && 'bg-green-600 hover:bg-green-700 text-white',
        !variant && active && 'bg-zinc-700 hover:bg-zinc-600 text-white',
        !variant && !active && 'bg-red-600/20 hover:bg-red-600/30 text-red-400',
      )}
    >
      {children}
    </button>
  );
}
