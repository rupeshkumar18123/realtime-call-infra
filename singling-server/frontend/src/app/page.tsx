'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useRoomStore } from '@/store/roomStore';
import { authApi, roomApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RoomCard } from '@/components/room/RoomCard';
import { Badge } from '@/components/ui/Badge';
import { Video, Plus, RefreshCw } from 'lucide-react';

const loginSchema = z.object({
  userId: z.string().min(1, 'Required'),
  username: z.string().min(2, 'Min 2 chars'),
});

const createRoomSchema = z.object({
  name: z.string().min(1, 'Required'),
  maxParticipants: z.coerce.number().min(2).max(50).optional(),
});

type LoginForm = z.infer<typeof loginSchema>;
type CreateRoomForm = z.infer<typeof createRoomSchema>;

export default function HomePage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const { rooms, setRooms } = useRoomStore();
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const createForm = useForm<CreateRoomForm>({
    resolver: zodResolver(createRoomSchema) as import('react-hook-form').Resolver<CreateRoomForm>,
  });

  const onLogin = async (data: LoginForm) => {
    try {
      const res = await authApi.getToken(data.userId, data.username);
      setUser({ userId: data.userId, username: data.username, token: res.data.data.accessToken });
    } catch {
      loginForm.setError('root', { message: 'Failed to authenticate' });
    }
  };

  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const res = await roomApi.list();
      setRooms(res.data.data);
    } catch {
      // ignore
    } finally {
      setLoadingRooms(false);
    }
  };

  const onCreateRoom = async (data: CreateRoomForm) => {
    setCreatingRoom(true);
    try {
      const res = await roomApi.create(data.name, data.maxParticipants);
      router.push(`/room/${res.data.data.id}`);
    } catch {
      createForm.setError('root', { message: 'Failed to create room' });
    } finally {
      setCreatingRoom(false);
    }
  };

  useEffect(() => {
    if (user) fetchRooms();
  }, [user]); // eslint-disable-line

  if (!user) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <Video className="text-blue-500" size={24} />
            <h1 className="text-xl font-bold text-white">Signaling Server</h1>
          </div>
          <p className="text-zinc-400 text-sm mb-6">Enter any user ID and username to get started.</p>
          <form onSubmit={loginForm.handleSubmit(onLogin)} className="flex flex-col gap-4">
            <Input label="User ID" placeholder="user-123" {...loginForm.register('userId')} error={loginForm.formState.errors.userId?.message} />
            <Input label="Username" placeholder="alice" {...loginForm.register('username')} error={loginForm.formState.errors.username?.message} />
            {loginForm.formState.errors.root && (
              <p className="text-red-400 text-sm">{loginForm.formState.errors.root.message}</p>
            )}
            <Button type="submit" loading={loginForm.formState.isSubmitting}>Continue</Button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Video className="text-blue-500" size={24} />
            <h1 className="text-xl font-bold text-white">Signaling Server</h1>
          </div>
          <Badge variant="success">@{user.username}</Badge>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Rooms</h2>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={fetchRooms} loading={loadingRooms}>
              <RefreshCw size={14} />
            </Button>
            <Button onClick={() => setShowCreate(!showCreate)}>
              <Plus size={14} /> New Room
            </Button>
          </div>
        </div>

        {showCreate && (
          <form onSubmit={createForm.handleSubmit(onCreateRoom)} className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 mb-4 flex flex-col gap-3">
            <Input label="Room name" placeholder="My room" {...createForm.register('name')} error={createForm.formState.errors.name?.message} />
            <Input label="Max participants (optional)" type="number" placeholder="10" {...createForm.register('maxParticipants')} />
            {createForm.formState.errors.root && (
              <p className="text-red-400 text-sm">{createForm.formState.errors.root.message}</p>
            )}
            <Button type="submit" loading={creatingRoom}>Create & Join</Button>
          </form>
        )}

        <div className="flex flex-col gap-3">
          {rooms.length === 0 && !loadingRooms && (
            <p className="text-zinc-500 text-sm text-center py-8">No active rooms. Create one to get started.</p>
          )}
          {rooms.map((room) => <RoomCard key={room.id} room={room} />)}
        </div>
      </div>
    </main>
  );
}
