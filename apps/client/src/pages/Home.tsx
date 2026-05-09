import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, Ghost, Brain, ListOrdered, MapPin, Loader2 } from 'lucide-react';
import { socket } from '../lib/socket';
import { usePlayerStore } from '../store/usePlayerStore';

export default function Home() {
  const { name, playerId, setName } = usePlayerStore();
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    if (!name.trim()) return setError('Enter a nickname first');
    if (!socket.connected) return setError('Connecting to server… try again in a second');
    
    setError('');
    setIsCreating(true);
    
    // Pass playerId to the server
    socket.emit('create_room', { playerName: name.trim(), playerId }, (res: any) => {
      setIsCreating(false);
      if (res?.success) {
        navigate(`/room/${res.roomId}`);
      } else {
        setError(res?.message || 'Failed to create room');
      }
    });
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Enter a nickname first');
    if (!roomCode.trim()) return setError('Enter a room code');
    if (!socket.connected) return setError('Connecting to server… try again in a second');
    
    setError('');
    setIsJoining(true);
    navigate(`/room/${roomCode.toUpperCase()}`);
  };

  return (
    <div className="animate-in fade-in duration-500 w-full max-w-4xl mx-auto">
      <div>
        <div className="mb-12">
          <h2 className="text-5xl md:text-6xl font-display font-black tracking-tight text-textMain leading-[1.05] mb-4">
            Multiplayer chaos.<br />No downloads.
          </h2>
          <p className="text-lg text-textMuted max-w-md leading-relaxed">
            Jump on a Discord call, share a room code, and ruin your friendships.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 mb-16 shadow-soft max-w-2xl">
          <div className="mb-6">
            <label className="block text-xs font-bold tracking-widest uppercase text-textMuted mb-2">
              Your Nickname
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="e.g. Maverick"
              maxLength={16}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-base text-textMain placeholder:text-zinc-400 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 mb-4 font-medium">{error}</p>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleCreateRoom}
              disabled={isCreating}
              className="flex-1 flex items-center justify-center gap-2 cursor-pointer bg-accent hover:bg-accentHover disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-150 active:scale-[0.98]"
            >
              {isCreating
                ? <Loader2 size={18} className="animate-spin" />
                : <Plus size={18} />
              }
              {isCreating ? 'Creating…' : 'Create Room'}
            </button>

            <div className="hidden sm:flex items-center text-border font-medium px-1 select-none">—</div>

            <form onSubmit={handleJoinRoom} className="flex-1 flex gap-2">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => { setRoomCode(e.target.value.toUpperCase()); setError(''); }}
                placeholder="ROOM CODE"
                maxLength={6}
                className="flex-1 min-w-0 bg-background border border-border rounded-xl px-4 py-3 text-sm font-bold tracking-widest uppercase text-textMain placeholder:tracking-normal placeholder:font-normal placeholder:text-zinc-400 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 transition-all"
              />
              <button
                type="submit"
                disabled={isJoining}
                className="bg-black  disabled:opacity-60 text-white cursor-pointer px-4 py-3 rounded-xl  active:scale-[0.98] flex items-center justify-center"
              >
                {isJoining
                  ? <Loader2 size={18} className="animate-spin" />
                  : <ArrowRight size={18} />
                }
              </button>
            </form>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-textMuted mb-5">
            Games Available
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <GameCard
              title="Almost Same"
              desc="Find the player with the slightly different word."
              icon={<Ghost size={20} />}
              tag="4–8 players"
              colorClass="group-hover:bg-accent/10 group-hover:text-accent"
            />
            <GameCard
              title="Clue Collision"
              desc="Give clues, but duplicates get wiped."
              icon={<Brain size={20} />}
              tag="3–8 players"
              colorClass="group-hover:bg-blue-100 group-hover:text-blue-600"
            />
            <GameCard
              title="Ranking Saboteur"
              desc="Sort the list correctly. Spot the liar."
              icon={<ListOrdered size={20} />}
              tag="4–10 players"
              colorClass="group-hover:bg-purple-100 group-hover:text-purple-600"
            />
            <GameCard
              title="Location Guesser"
              desc="Explore the street view and drop your pin."
              icon={<MapPin size={20} />}
              tag="2–10 players"
              colorClass="group-hover:bg-emerald-100 group-hover:text-emerald-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function GameCard({
  title, desc, icon, tag, locked = false, colorClass = "group-hover:bg-accent/10 group-hover:text-accent"
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  tag: string;
  locked?: boolean;
  colorClass?: string;
}) {
  return (
    <div className={`group bg-surface border border-border rounded-2xl p-5 transition-all duration-300 ${
      locked
        ? 'opacity-50 cursor-not-allowed'
        : 'cursor-default hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg'
    }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-textMuted transition-colors bg-zinc-100 ${
        !locked && colorClass
      }`}>
        {icon}
      </div>
      <div className="flex items-start justify-between mb-1 gap-2">
        <h4 className="font-bold text-textMain text-sm leading-tight">{title}</h4>
        {locked && (
          <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded-md shrink-0">
            Soon
          </span>
        )}
      </div>
      <p className="text-xs text-textMuted leading-snug mb-3">{desc}</p>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{tag}</p>
    </div>
  );
}