import { useState } from 'react';
import { socket } from '../lib/socket';
import type { RoomState, Player } from '@tab-arcade/shared';
import { Eye, Users, ArrowRight, Home, CheckCircle2 } from 'lucide-react';

interface AlmostSameProps {
  room: RoomState;
  me: Player | undefined;
}

export function AlmostSame({ room, me }: AlmostSameProps) {
  // Extract state safely
  const { 
    phase, 
    playerWords, 
    votes = {}, 
    imposterId, 
    regularWord, 
    imposterWord 
  } = room.gameState || {};
  
  const [showWord, setShowWord] = useState(false);

  if (!me) return null;

  const myWord = playerWords?.[me.id];
  const hasVoted = votes[me.id] !== undefined;

  // Helper to send game actions to the backend
  const sendAction = (action: string, payload?: any) => {
    socket.emit('game_action', { roomId: room.id, action, payload });
  };

  // ── 1. READING PHASE ──
  if (phase === 'reading') {
    return (
      <div className="flex flex-col items-center justify-center py-10 animate-in fade-in zoom-in-95 duration-500">
        <h2 className="text-3xl font-display font-black text-textMain mb-3">Your Secret Word</h2>
        <p className="text-textMuted mb-10 text-center max-w-sm leading-relaxed">
          Memorize your word. Take turns giving a <strong>one-word clue</strong>. Find the player whose word is slightly different.
        </p>

        {/* Interactive Word Card */}
        <div 
          onPointerDown={() => setShowWord(true)}
          onPointerUp={() => setShowWord(false)}
          onPointerLeave={() => setShowWord(false)}
          className="w-full max-w-md aspect-video bg-surface border-2 border-border rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-zinc-300 transition-all select-none shadow-soft active:scale-95"
        >
          {showWord ? (
            <span className="text-5xl md:text-6xl font-display font-black text-textMain tracking-tight animate-in zoom-in-75 duration-200">
              {myWord}
            </span>
          ) : (
            <div className="flex flex-col items-center text-textMuted gap-4">
              <Eye size={36} className="opacity-50" />
              <span className="font-bold tracking-widest uppercase text-sm">Press & Hold to reveal</span>
            </div>
          )}
        </div>

        {/* Host Controls */}
        {me.isHost ? (
          <button
            onClick={() => sendAction('start_voting')}
            className="mt-14 bg-textMain hover:bg-black text-white px-8 py-3.5 rounded-xl font-bold transition-all active:scale-95 flex items-center gap-2 shadow-lg"
          >
            Start Voting Phase <ArrowRight size={18} />
          </button>
        ) : (
          <p className="mt-14 text-sm font-bold text-textMuted uppercase tracking-widest flex items-center gap-2">
            <Users size={16} /> Waiting for host to start voting
          </p>
        )}
      </div>
    );
  }

  // ── 2. VOTING PHASE ──
  if (phase === 'voting') {
    return (
      <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-8 duration-500">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-display font-black text-textMain mb-2">Who is the Imposter?</h2>
          <p className="text-textMuted font-medium">
            {hasVoted ? "Vote locked in. Waiting for others..." : "Tap a player to cast your vote."}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {room.players.map((p) => {
            const isMe = p.id === me.id;
            const isMyVote = votes[me.id] === p.id;
            
            return (
              <button
                key={p.id}
                disabled={hasVoted || isMe}
                onClick={() => sendAction('submit_vote', { votedForId: p.id })}
                className={`relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-200 ${
                  hasVoted 
                    ? isMyVote 
                      ? 'border-textMain bg-surface shadow-md' // The one I voted for
                      : 'border-transparent bg-background opacity-40' // Others after I voted
                    : isMe
                      ? 'border-transparent bg-background opacity-40 cursor-not-allowed' // Myself
                      : 'border-border bg-surface hover:border-accent hover:bg-accent/5 active:scale-95 cursor-pointer' // Voteable
                }`}
              >
                {/* Checkmark badge if selected */}
                {isMyVote && (
                  <div className="absolute -top-2 -right-2 bg-textMain text-white rounded-full p-0.5 animate-in zoom-in">
                    <CheckCircle2 size={20} />
                  </div>
                )}
                
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-sm"
                  style={{ backgroundColor: p.color }}
                >
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <span className={`font-bold text-sm truncate w-full px-2 ${isMyVote ? 'text-textMain' : 'text-textMuted'}`}>
                  {p.name} {isMe && '(You)'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── 3. RESULTS PHASE ──
  if (phase === 'results') {
    const imposter = room.players.find(p => p.id === imposterId);
    
    // Logic: Did the majority of players vote for the imposter?
    const votesForImposter = Object.values(votes).filter(vId => vId === imposterId).length;
    const regularsWon = votesForImposter >= Math.ceil(room.players.length / 2);

    return (
      <div className="max-w-2xl mx-auto text-center animate-in zoom-in-95 duration-500 py-8">
        <p className="text-sm font-bold tracking-widest uppercase mb-6" style={{ color: imposter?.color }}>
          {regularsWon ? 'The Imposter was caught!' : 'The Imposter escaped!'}
        </p>
        
        <div className="flex justify-center mb-6">
          <div 
            className="w-28 h-28 rounded-full flex items-center justify-center text-white text-5xl font-display font-black shadow-xl ring-4 ring-offset-4 ring-offset-background"
            style={{ backgroundColor: imposter?.color, ringColor: imposter?.color }}
          >
            {imposter?.name.charAt(0).toUpperCase()}
          </div>
        </div>

        <h2 className="text-4xl md:text-5xl font-display font-black text-textMain mb-10">
          {imposter?.name} was the imposter
        </h2>

        {/* Word Reveal Cards */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <div className="bg-surface border border-border rounded-2xl p-6 flex-1 max-w-[240px] mx-auto w-full shadow-soft">
            <p className="text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">Regular Word</p>
            <p className="text-2xl font-bold text-textMain">{regularWord}</p>
          </div>
          <div className="bg-surface border-2 rounded-2xl p-6 flex-1 max-w-[240px] mx-auto w-full shadow-soft" style={{ borderColor: imposter?.color }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: imposter?.color }}>Imposter Word</p>
            <p className="text-2xl font-bold text-textMain">{imposterWord}</p>
          </div>
        </div>

        {me.isHost && (
          <button
            onClick={() => sendAction('back_to_lobby')}
            className="mx-auto flex items-center gap-2 bg-textMain hover:bg-black text-white px-8 py-4 rounded-xl font-bold transition-all active:scale-95 shadow-lg"
          >
            <Home size={18} /> Back to Lobby
          </button>
        )}
      </div>
    );
  }

  return null;
}