import { Room } from '@/types';
import { Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function RoomCard({ room }: { room: Room }) {
  const statusColor = { waiting: 'text-yellow-400', active: 'text-green-400', ended: 'text-zinc-500' }[room.status];

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 flex items-center justify-between hover:border-zinc-500 transition-colors">
      <div>
        <h3 className="font-medium text-white">{room.name}</h3>
        <div className="flex items-center gap-3 mt-1 text-sm text-zinc-400">
          <span className={statusColor}>{room.status}</span>
          <span className="flex items-center gap-1">
            <Users size={13} />
            {room.participantCount}/{room.maxParticipants}
          </span>
        </div>
      </div>
      {room.status !== 'ended' && (
        <Link
          href={`/room/${room.id}`}
          className="flex items-center gap-1 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          Join <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}
