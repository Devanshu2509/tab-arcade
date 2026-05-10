import { useState } from 'react';
import { socket } from '../lib/socket';
import type { RoomState, Player } from '@tab-arcade/shared';
import { Eye, Users, ArrowRight, Home, CheckCircle2, Trophy, Settings, Ghost } from 'lucide-react';

interface AlmostSameProps {
  room: RoomState;
  me: Player | undefined;
}

export function AlmostSame({ room, me }: AlmostSameProps) {
  const { 
    phase, 
    playerWords, 
    votes = {}, 
    imposterId, 
    regularWord, 
    imposterWord,
    currentRound,
    totalRounds,
    scores = {}
  } = room.gameState || {};
  
  const [showWord, setShowWord] = useState(false);
  const [selectedRounds, setSelectedRounds] = useState(3);

  if (!me) return null;

  const myWord = playerWords?.[me.id];
  const hasVoted = votes[me.id] !== undefined;
  const isFinalRound = currentRound === totalRounds;

  const sendAction = (action: string, payload?: any) => {
    socket.emit('game_action', { roomId: room.id, action, payload });
  };

  // ── PERSISTENT SIDEBAR LEADERBOARD ──
  const SidebarLeaderboard = () => {
    // Sort players by score, highest first
    const sortedPlayers = [...room.players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));

    return (
      <div className="w-full lg:w-80 shrink-0 bg-surface border border-border rounded-2xl p-5 shadow-soft h-fit self-start">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-accent" />
            <h3 className="font-display font-bold text-lg text-textMain">Leaderboard</h3>
          </div>
          {currentRound && (
            <span className="text-[10px] font-bold tracking-widest uppercase bg-background border border-border px-2 py-1 rounded-md text-textMuted">
              Round {currentRound}/{totalRounds}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {sortedPlayers.map((p, idx) => (
            <div 
              key={p.id} 
              className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                p.id === me.id ? 'bg-background border border-border' : 'hover:bg-background/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold w-4 text-center ${
                  idx === 0 && (scores[p.id] || 0) > 0 ? 'text-yellow-500' : 'text-textMuted'
                }`}>
                  {idx + 1}
                </span>
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: p.color }}
                >
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <span className={`text-sm font-semibold truncate max-w-[100px] ${p.id === me.id ? 'text-textMain' : 'text-textMuted'}`}>
                  {p.name}
                </span>
              </div>
              <span className="font-bold text-textMain font-mono text-sm">
                {scores[p.id] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Helper to wrap the main game area and the sidebar
  const GameLayout = ({ children }: { children: React.ReactNode }) => (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto items-start">
      <div className="flex-1 w-full bg-surface border border-border rounded-2xl p-6 md:p-10 shadow-soft min-h-[500px] flex flex-col items-center justify-center">
        {children}
      </div>
      <SidebarLeaderboard />
    </div>
  );

  // ── 0. SETUP PHASE ──
  if (phase === 'setup') {
    return (
      <GameLayout>
        <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95 w-full max-w-md">
          <div className="w-16 h-16 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mb-6">
            <Settings size={32} />
          </div>
          <h2 className="text-3xl font-display font-black text-textMain mb-2">Game Setup</h2>
          <p className="text-textMuted mb-10 text-center">Choose how many rounds you want to play.</p>

          {me.isHost ? (
            <div className="w-full">
              <p className="text-sm font-bold tracking-widest uppercase text-textMuted mb-4 text-center">Total Rounds</p>
              <div className="flex gap-3 mb-8">
                {[3, 5, 7].map(num => (
                  <button
                    key={num}
                    onClick={() => setSelectedRounds(num)}
                    className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${
                      selectedRounds === num 
                        ? 'border-textMain bg-black text-white' 
                        : 'border-border text-textMuted hover:border-zinc-300 hover:text-textMain'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <button
                onClick={() => sendAction('start_first_round', { rounds: selectedRounds })}
                className="w-full bg-accent hover:bg-accentHover text-white py-4 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Start Game <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center p-8 border border-border rounded-2xl w-full bg-background">
              <Users size={24} className="text-textMuted mb-3" />
              <p className="text-textMain font-bold">Waiting for host...</p>
              <p className="text-sm text-textMuted mt-1 text-center">The host is setting up the game rules.</p>
            </div>
          )}
        </div>
      </GameLayout>
    );
  }

  // ── 1. READING PHASE ──
  if (phase === 'reading') {
    return (
      <GameLayout>
        <div className="flex flex-col items-center w-full animate-in fade-in zoom-in-95 duration-500">
          <h2 className="text-3xl font-display font-black text-textMain mb-3 text-center">Your Secret Word</h2>
          <p className="text-textMuted mb-10 text-center max-w-sm leading-relaxed">
            Memorize your word. Take turns giving a <strong>one-word clue</strong>.
          </p>

          <div 
            onPointerDown={() => setShowWord(true)}
            onPointerUp={() => setShowWord(false)}
            onPointerLeave={() => setShowWord(false)}
            className="w-full max-w-sm aspect-[4/3] bg-background border-2 border-border rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-zinc-300 transition-all select-none active:scale-[0.98]"
          >
            {showWord ? (
              <span className="text-4xl md:text-5xl font-display font-black text-textMain tracking-tight animate-in zoom-in-75 duration-200 text-center px-4">
                {myWord}
              </span>
            ) : (
              <div className="flex flex-col items-center text-textMuted gap-4">
                <Eye size={36} className="opacity-50" />
                <span className="font-bold tracking-widest uppercase text-sm">Press & Hold to reveal</span>
              </div>
            )}
          </div>

          {me.isHost ? (
            <button
              onClick={() => sendAction('start_voting')}
              className="mt-12 bg-black hover:bg-black text-white px-8 py-3.5 rounded-xl font-bold transition-all active:scale-95 flex items-center gap-2 shadow-lg"
            >
              Start Voting Phase <ArrowRight size={18} />
            </button>
          ) : (
            <p className="mt-12 text-sm font-bold text-textMuted uppercase tracking-widest flex items-center gap-2">
              <Users size={16} /> Waiting for host to start voting
            </p>
          )}
        </div>
      </GameLayout>
    );
  }

  // ── 2. VOTING PHASE ──
  if (phase === 'voting') {
    return (
      <GameLayout>
        <div className="flex flex-col items-center w-full animate-in slide-in-from-bottom-4 duration-500">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-display font-black text-textMain mb-2">Who is the Imposter?</h2>
            <p className="text-textMuted font-medium">
              {hasVoted ? "Vote locked in. Waiting for others..." : "Tap a player to cast your vote."}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-2xl">
            {room.players.map((p) => {
              const isMe = p.id === me.id;
              const isMyVote = votes[me.id] === p.id;
              
              return (
                <button
                  key={p.id}
                  disabled={hasVoted || isMe}
                  onClick={() => sendAction('submit_vote', { votedForId: p.id })}
                  className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 ${
                    hasVoted 
                      ? isMyVote 
                        ? 'border-textMain bg-background shadow-md' 
                        : 'border-transparent opacity-40' 
                      : isMe
                        ? 'border-transparent bg-background opacity-40 cursor-not-allowed'
                        : 'border-border bg-background hover:border-accent hover:bg-accent/5 active:scale-95'
                  }`}
                >
                  {isMyVote && (
                    <div className="absolute -top-2 -right-2 bg-black text-white rounded-full p-0.5 animate-in zoom-in">
                      <CheckCircle2 size={20} />
                    </div>
                  )}
                  
                  <div 
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-sm"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <span className={`font-bold text-sm truncate w-full px-2 text-center ${isMyVote ? 'text-textMain' : 'text-textMuted'}`}>
                    {p.name} {isMe && '(You)'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </GameLayout>
    );
  }

  // ── 3. RESULTS PHASE ──
  if (phase === 'results') {
    const imposter = room.players.find(p => p.id === imposterId);
    let imposterVotesCount = 0;
    Object.values(votes).forEach(vId => { if (vId === imposterId) imposterVotesCount++; });
    
    const regularsWon = imposterVotesCount >= Math.ceil((room.players.length - 1) / 2);

    return (
      <GameLayout>
        <div className="flex flex-col items-center w-full max-w-2xl animate-in zoom-in-95 duration-500">
          <p className="text-sm font-bold tracking-widest uppercase mb-4" style={{ color: imposter?.color }}>
            {regularsWon ? 'The Imposter was caught!' : 'The Imposter escaped!'}
          </p>
          
          <div className="flex justify-center mb-5">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-display font-black shadow-lg ring-4 ring-offset-4 ring-offset-surface"
              style={{ backgroundColor: imposter?.color, ringColor: imposter?.color }}
            >
              {imposter?.name.charAt(0).toUpperCase()}
            </div>
          </div>

          <h2 className="text-3xl font-display font-black text-textMain mb-8 text-center">
            {imposter?.name} was the imposter
          </h2>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 w-full">
            <div className="bg-background border border-border rounded-2xl p-4 flex-1 text-center">
              <p className="text-[10px] font-bold text-textMuted uppercase tracking-widest mb-1">Regular Word</p>
              <p className="text-lg font-bold text-textMain">{regularWord}</p>
            </div>
            <div className="bg-background border-2 rounded-2xl p-4 flex-1 text-center" style={{ borderColor: imposter?.color }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: imposter?.color }}>Imposter Word</p>
              <p className="text-lg font-bold text-textMain">{imposterWord}</p>
            </div>
          </div>

          <div className="w-full bg-background border border-border rounded-2xl p-5 mb-8 text-left">
            <h3 className="text-xs font-bold uppercase tracking-widest text-textMuted mb-4 border-b border-border pb-2">Voting Breakdown</h3>
            <div className="flex flex-col gap-2">
              {room.players.map(voter => {
                const targetId = votes[voter.id];
                const target = room.players.find(p => p.id === targetId);
                if (!target) return null;
                
                const isCorrect = targetId === imposterId && voter.id !== imposterId;

                return (
                  <div key={voter.id} className="flex items-center justify-between bg-surface p-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full text-white flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: voter.color }}>
                        {voter.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-textMain">{voter.name}</span>
                    </div>
                    <ArrowRight size={14} className="text-textMuted/40" />
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${isCorrect ? 'text-green-600' : 'text-textMuted'}`}>
                        {target.name} {isCorrect && '+100'}
                      </span>
                      <div className="w-6 h-6 rounded-full text-white flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: target.color }}>
                        {target.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {!regularsWon && (
                <div className="mt-2 pt-2 border-t border-border flex justify-between items-center px-2">
                  <span className="text-xs font-bold text-textMuted">Imposter Escaped Bonus</span>
                  <span className="text-xs font-bold text-green-600" style={{ color: imposter?.color }}>{imposter?.name} (+200)</span>
                </div>
              )}
            </div>
          </div>

          {me.isHost && (
            <button
              onClick={() => sendAction('next_round')}
              className="w-full sm:w-auto mx-auto flex items-center justify-center gap-2 bg-black hover:bg-black text-white px-8 py-3.5 rounded-xl font-bold transition-all active:scale-95"
            >
              {isFinalRound ? 'View Final Leaderboard' : `Start Round ${currentRound + 1}`} <ArrowRight size={18} />
            </button>
          )}
        </div>
      </GameLayout>
    );
  }

  // ── 4. LEADERBOARD PHASE (End of Game) ──
  if (phase === 'leaderboard') {
    const sortedPlayers = [...room.players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));

    return (
      <div className="flex flex-col items-center max-w-xl mx-auto py-10 animate-in slide-in-from-bottom-8 w-full">
        <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <Trophy size={40} />
        </div>
        <h2 className="text-4xl font-display font-black text-textMain mb-2 text-center">Final Scores</h2>
        <p className="text-textMuted mb-10 text-center">After {totalRounds} rounds of chaos.</p>

        <div className="w-full flex flex-col gap-3 mb-12">
          {sortedPlayers.map((p, index) => (
            <div 
              key={p.id} 
              className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                index === 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-surface border-border'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={`text-xl font-black w-8 text-center ${index === 0 ? 'text-yellow-500' : 'text-textMuted'}`}>
                  #{index + 1}
                </span>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-sm" style={{ backgroundColor: p.color }}>
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <span className={`font-bold ${index === 0 ? 'text-yellow-700 text-xl' : 'text-textMain text-lg'}`}>
                  {p.name} {p.id === me.id && <span className="text-sm font-normal opacity-60 ml-1">(You)</span>}
                </span>
              </div>
              <span className={`font-black text-2xl font-mono ${index === 0 ? 'text-yellow-600' : 'text-textMain'}`}>
                {scores[p.id] || 0}
              </span>
            </div>
          ))}
        </div>

        {me.isHost && (
          <button
            onClick={() => sendAction('back_to_lobby')}
            className="flex items-center justify-center gap-2 bg-black hover:bg-black text-white px-8 py-4 rounded-xl font-bold transition-all active:scale-95 shadow-lg w-full sm:w-auto"
          >
            <Home size={18} /> Return to Lobby
          </button>
        )}
      </div>
    );
  }

  return null;
}