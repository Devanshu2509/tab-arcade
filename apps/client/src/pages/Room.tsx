import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Copy, Check, Gamepad2, Ghost, Loader2, Brain, ArrowRight, ListOrdered, MapPin, LogOut, Grid3X3 } from 'lucide-react';
import { socket } from '../lib/socket';
import { AVAILABLE_GAMES } from '@tab-arcade/shared';
import type { RoomState } from '@tab-arcade/shared';
import { usePlayerStore } from '../store/usePlayerStore';
import { AlmostSame } from '../games/AlmostSame';
import { ClueCollision } from '../games/ClueCollision';
import { RankingSaboteur } from '../games/RankingSaboteur';
import { LocationGuesser } from '../games/LocationGuesser';
import { Bingo } from '../games/Bingo';
import { TicTacToe } from '../games/TicTacToe';

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  
  const { name, playerId, setName } = usePlayerStore();
  
  const [room, setRoom] = useState<RoomState | null>(null);
  const [copied, setCopied] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [tempName, setTempName] = useState('');

  // Use a ref to prevent double-firing join_room in React Strict Mode
  const joinAttempted = useRef(false);

  const joinRoom = useCallback(() => {
    if (!name.trim()) return; 
    
    if (joinAttempted.current) return;
    joinAttempted.current = true;
    
    setJoining(true);

    if (!socket.connected) {
      socket.once('connect', () => {
        joinAttempted.current = false; 
        joinRoom();
      });
      return;
    }
    
    socket.emit('join_room', { roomId, playerName: name, playerId }, (res: any) => {
      setJoining(false);
      
      if (!res?.success) {
        joinAttempted.current = false; 
      }
      
      if (res?.success) {
        setRoom(res.room);
      } else {
        setError(res?.message || 'Room not found');
      }
    });
  }, [roomId, name, playerId]);

  useEffect(() => {
    if (name.trim() && !joinAttempted.current) {
      joinRoom();
    }

    const handleRoomUpdated = (updatedRoom: RoomState) => {
      setRoom(updatedRoom);
    };

    socket.on('room_updated', handleRoomUpdated);

    return () => {
      socket.off('room_updated', handleRoomUpdated);
    };
  }, [joinRoom, name]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => navigate('/'), 2500);
      return () => clearTimeout(t);
    }
  }, [error, navigate]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startGame = (gameId: string) => {
    socket.emit('start_game', { roomId, gameId }, (res: any) => {
      if (!res?.success) alert(res?.message || 'Failed to start game');
    });
  };

  // Centralized action sender passed to active games
  const sendAction = (type: string, payload?: any) => {
    socket.emit('game_action', { roomId, action: { type, payload } });
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      setName(tempName.trim());
    }
  };

  // ── Missing Name View (Invite Link Flow) ──
  if (!name.trim()) {
    return (
      <div className="flex flex-col items-center justify-center mt-32 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-surface border border-border p-8 rounded-2xl shadow-soft w-full max-w-sm text-center">
          <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center mx-auto mb-6">
            <Users size={24} />
          </div>
          <h2 className="text-2xl font-display font-bold text-textMain mb-2">Joining Room {roomId}</h2>
          <p className="text-sm text-textMuted mb-6">Enter a nickname to join your friends.</p>
          
          <form onSubmit={handleNameSubmit} className="flex gap-2">
             <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="Your Name"
                maxLength={16}
                autoFocus
                className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm font-medium text-textMain outline-none focus:border-accent transition-all"
              />
              <button
                type="submit"
                disabled={!tempName.trim()}
                className="bg-accent hover:bg-accentHover disabled:opacity-50 text-white px-4 py-3 rounded-xl transition-all"
              >
                <ArrowRight size={18} />
              </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Loading View ──
  if (joining && !room) {
    return (
      <div className="flex flex-col items-center justify-center mt-40 gap-4 text-textMuted">
        <Loader2 size={32} className="animate-spin" />
        <p className="text-sm font-medium tracking-wide uppercase">Joining lobby…</p>
      </div>
    );
  }

  // ── Error View ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center mt-40 gap-3 text-textMuted">
        <p className="text-xl font-bold text-textMain">Room not found</p>
        <p className="text-sm">{error} — redirecting you home…</p>
      </div>
    );
  }

  if (!room) return null;

  const me = room.players.find(p => p.id === playerId);

 if (room.status === 'playing') {
    return (
      <div className="animate-in fade-in duration-300">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="bg-surface border border-border px-3 py-1 rounded-lg text-xs font-bold tracking-widest text-textMuted font-mono">
              {roomId}
            </span>
            <div className="flex -space-x-2">
              {room.players.slice(0, 6).map(p => (
                <div
                  key={p.id}
                  title={p.name}
                  className="w-7 h-7 rounded-full border-2 border-surface flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ backgroundColor: p.color }}
                >
                  {p.name.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-accent hidden sm:inline-block">
              Playing
            </span>
            {me?.isHost && (
                <button 
                  onClick={() => {
                    if (window.confirm("Are you sure you want to end this game for everyone and return to the lobby?")) {
                      sendAction('back_to_lobby');
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  <LogOut size={14} /> Exit Game
                </button>
              )}
          </div>
        </div>

        {room.currentGame === AVAILABLE_GAMES.ALMOST_SAME && (
          <AlmostSame room={room} me={me} sendAction={sendAction} />
        )}
        {room.currentGame === AVAILABLE_GAMES.CLUE_COLLISION && (
          <ClueCollision room={room} me={me} sendAction={sendAction} />
        )}
        {room.currentGame === AVAILABLE_GAMES.RANKING_SABOTEUR && (
          <RankingSaboteur room={room} me={me} sendAction={sendAction} />
        )}
        {room.currentGame === AVAILABLE_GAMES.LOCATION_GUESSER && (
          <LocationGuesser room={room} me={me} sendAction={sendAction} />
        )}
        {room.currentGame === AVAILABLE_GAMES.BINGO && (
          <Bingo room={room} me={me} sendAction={sendAction} />
        )}
        {room.currentGame === AVAILABLE_GAMES.TIC_TAC_TOE && (
          <TicTacToe room={room} me={me} sendAction={sendAction} />
        )}
      </div>
    );
  }

  // ── Lobby View ──
  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4 pb-6 border-b border-border">
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-accent mb-1.5">Lobby</p>
          <h2 className="text-4xl font-display font-black tracking-tight text-textMain">{roomId}</h2>
        </div>
        <button
          onClick={copyLink}
          className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-sm font-medium text-textMuted hover:text-textMain hover:border-zinc-300 transition-all"
        >
          {copied ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
          {copied ? 'Copied!' : 'Copy Invite Link'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-soft">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-textMuted" />
                <span className="font-bold text-textMain text-sm">Players</span>
              </div>
              <span className="text-xs font-bold text-textMuted bg-background px-2 py-0.5 rounded-md">
                {room.players.length}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              {room.players.map(player => (
                <div
                  key={player.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-background transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: player.color }}
                    >
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span className={`text-sm font-medium truncate max-w-[120px] ${
                      player.id === playerId ? 'text-textMain font-bold' : 'text-textMuted'
                    }`}>
                      {player.name}
                      {player.id === playerId && (
                        <span className="text-xs text-zinc-400 font-normal ml-1">(you)</span>
                      )}
                    </span>
                  </div>
                  {player.isHost && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-accent shrink-0">Host</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 min-h-[360px] shadow-soft">
            {me?.isHost ? (
              <>
                <div className="flex items-center gap-2.5 mb-6">
                  <Gamepad2 size={18} className="text-accent" />
                  <h3 className="font-display font-bold text-lg text-textMain">Select a Game</h3>
                  <span className="text-xs text-textMuted ml-auto">
                    {room.players.length} player{room.players.length !== 1 ? 's' : ''} ready
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* ALMOST SAME */}
                  <button
                    onClick={() => startGame(AVAILABLE_GAMES.ALMOST_SAME)}
                    className="group text-left border border-border rounded-xl p-5 hover:border-accent hover:bg-accent/5 transition-all duration-200 active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 group-hover:bg-accent/10 flex items-center justify-center text-textMuted group-hover:text-accent mb-4 transition-colors">
                      <Ghost size={20} />
                    </div>
                    <p className="font-bold text-textMain text-sm mb-1">Almost Same</p>
                    <p className="text-xs text-textMuted leading-relaxed">
                      Everyone gets a secret word. One person gets a slightly different one. Find them.
                    </p>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-accent mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      Start this game →
                    </p>
                  </button>

                  {/* CLUE COLLISION */}
                  <button
                    onClick={() => startGame(AVAILABLE_GAMES.CLUE_COLLISION)}
                    className="group text-left border border-border rounded-xl p-5 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 group-hover:bg-blue-100 flex items-center justify-center text-textMuted group-hover:text-blue-600 mb-4 transition-colors">
                      <Brain size={20} />
                    </div>
                    <p className="font-bold text-textMain text-sm mb-1">Clue Collision</p>
                    <p className="text-xs text-textMuted leading-relaxed">
                      Give clues — but duplicate clues get deleted before the guesser sees them.
                    </p>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      Start this game →
                    </p>
                  </button>

                  {/* RANKING SABOTEUR */}
                  <button
                    onClick={() => startGame(AVAILABLE_GAMES.RANKING_SABOTEUR)}
                    className="group text-left border border-border rounded-xl p-5 hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 group-hover:bg-purple-100 flex items-center justify-center text-textMuted group-hover:text-purple-600 mb-4 transition-colors">
                      <ListOrdered size={20} />
                    </div>
                    <p className="font-bold text-textMain text-sm mb-1">Ranking Saboteur</p>
                    <p className="text-xs text-textMuted leading-relaxed">
                      Sort the list correctly together. Spot the one person trying to ruin it.
                    </p>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-purple-600 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      Start this game →
                    </p>
                  </button>

                  {/* LOCATION GUESSER */}
                  <button
                    onClick={() => startGame(AVAILABLE_GAMES.LOCATION_GUESSER)}
                    className="group text-left border border-border rounded-xl p-5 hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-200 active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 group-hover:bg-emerald-100 flex items-center justify-center text-textMuted group-hover:text-emerald-600 mb-4 transition-colors">
                      <MapPin size={20} />
                    </div>
                    <p className="font-bold text-textMain text-sm mb-1">Location Guesser</p>
                    <p className="text-xs text-textMuted leading-relaxed">
                      Explore the street view and drop your pin closest to the true location.
                    </p>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      Start this game →
                    </p>
                  </button>

                  {/* BINGO */}
                  <button
                    onClick={() => startGame(AVAILABLE_GAMES.BINGO)}
                    className="group text-left border border-border rounded-xl p-5 hover:border-amber-500 hover:bg-amber-50 transition-all duration-200 active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 group-hover:bg-amber-100 flex items-center justify-center text-textMuted group-hover:text-amber-600 mb-4 transition-colors">
                      <Check size={20} />
                    </div>
                    <p className="font-bold text-textMain text-sm mb-1">Bingo</p>
                    <p className="text-xs text-textMuted leading-relaxed">
                      Auto-drawing 5x5 Bingo. Dab your board, race to 5-in-a-row, and yell Bingo!
                    </p>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      Start this game →
                    </p>
                  </button>

                  {/* TEAM TIC-TAC-TOE */}
                  <button
                    onClick={() => startGame(AVAILABLE_GAMES.TIC_TAC_TOE)}
                    className="group text-left border border-border rounded-xl p-5 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 group-hover:bg-blue-100 flex items-center justify-center text-textMuted group-hover:text-blue-600 mb-4 transition-colors">
                      <Grid3X3 size={20} />
                    </div>
                    <p className="font-bold text-textMain text-sm mb-1">Team Tic-Tac-Toe</p>
                    <p className="text-xs text-textMuted leading-relaxed">
                      Split into two teams and take turns placing X's and O's on a giant board.
                    </p>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      Start this game →
                    </p>
                  </button>

                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[280px] text-center">
                <div className="w-14 h-14 bg-background rounded-2xl border border-border flex items-center justify-center mb-5">
                  <Loader2 size={22} className="text-textMuted animate-spin" />
                </div>
                <h3 className="font-display font-bold text-xl text-textMain mb-2">Waiting for host</h3>
                <p className="text-sm text-textMuted max-w-xs leading-relaxed">
                  <strong>{room.players.find(p => p.isHost)?.name ?? 'The host'}</strong> is
                  picking a game. Make sure you're unmuted on Discord.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}