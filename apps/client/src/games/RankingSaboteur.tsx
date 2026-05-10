import { useState } from 'react';
import { socket } from '../lib/socket';
import type { RoomState, Player } from '@tab-arcade/shared';
import { Users, ArrowRight, Home, Trophy, ListOrdered, AlertTriangle, Check } from 'lucide-react';

interface Props { room: RoomState; me: Player | undefined; sendAction: (type: string, payload?: any) => void; }

function SidebarLeaderboard({ room, meId, scores, currentRound, totalRounds }: any) {
  const sortedPlayers = [...room.players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
  return (
    <div className="w-full lg:w-80 shrink-0 bg-surface border border-border rounded-2xl p-5 shadow-soft h-fit self-start">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-accent" />
          <h3 className="font-display font-bold text-lg text-textMain">Leaderboard</h3>
        </div>
        {currentRound ? <span className="text-[10px] font-bold tracking-widest uppercase bg-background border border-border px-2 py-1 rounded-md text-textMuted">Round {currentRound}/{totalRounds}</span> : null}
      </div>
      <div className="flex flex-col gap-2">
        {sortedPlayers.map((p, idx) => (
          <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl ${p.id === meId ? 'bg-background border border-border' : 'hover:bg-background/50'}`}>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold w-4 text-center ${idx === 0 && (scores[p.id] || 0) > 0 ? 'text-yellow-500' : 'text-textMuted'}`}>{idx + 1}</span>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: p.color }}>{p.name.charAt(0).toUpperCase()}</div>
              <span className={`text-sm font-semibold truncate max-w-[100px] ${p.id === meId ? 'text-textMain' : 'text-textMuted'}`}>{p.name}</span>
            </div>
            <span className="font-bold text-textMain font-mono text-sm">{scores[p.id] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GameLayout({ children, sidebar }: any) {
  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto items-start">
      <div className="flex-1 w-full bg-surface border border-border rounded-2xl p-6 md:p-10 shadow-soft min-h-[500px] flex flex-col items-center justify-center">
        {children}
      </div>
      {sidebar}
    </div>
  );
}

export function RankingSaboteur({ room, me, sendAction }: Props) {
  const { 
    phase, currentRound, totalRounds, scores = {},
    saboteurId, question, unplacedItems = [], placedItems = [], turnOrder = [], currentTurnIndex, votes = {}, isListCorrect
  } = room.gameState || {};

  const [selectedRounds, setSelectedRounds] = useState(3);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);

  if (!me) return null;

  const isSaboteur = me.id === saboteurId;
  const activePlayerId = turnOrder[currentTurnIndex];
  const isMyTurn = me.id === activePlayerId;
  const activePlayer = room.players.find(p => p.id === activePlayerId);
  const hasVoted = votes[me.id] !== undefined;

  const sidebar = <SidebarLeaderboard room={room} meId={me.id} scores={scores} currentRound={currentRound} totalRounds={totalRounds} />;

  // ── 0. SETUP ──
  if (phase === 'setup') {
    return (
      <GameLayout sidebar={sidebar}>
        <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95 w-full max-w-md">
          <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6"><ListOrdered size={32} /></div>
          <h2 className="text-3xl font-display font-black text-textMain mb-2">Ranking Saboteur</h2>
          <p className="text-textMuted mb-10 text-center">Work together to build the sorted list. One player is secretly trying to ruin it.</p>

          {me.isHost ? (
            <div className="w-full">
              <p className="text-sm font-bold tracking-widest uppercase text-textMuted mb-4 text-center">Total Rounds</p>
              <div className="flex gap-3 mb-8">
                {[3, 5, 7].map(num => (
                  <button key={num} onClick={() => setSelectedRounds(num)} className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${selectedRounds === num ? 'border-purple-600 bg-purple-600 text-white' : 'border-border text-textMuted'}`}>{num}</button>
                ))}
              </div>
              <button onClick={() => sendAction('start_first_round', { rounds: selectedRounds })} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2">Start Game <ArrowRight size={18} /></button>
            </div>
          ) : (
             <div className="flex flex-col items-center p-8 border border-border rounded-2xl w-full bg-background"><Users size={24} className="text-textMuted mb-3" /><p className="text-textMain font-bold">Waiting for host...</p></div>
          )}
        </div>
      </GameLayout>
    );
  }

  // ── 1. DRAFTING PHASE ──
  if (phase === 'drafting') {
    return (
      <GameLayout sidebar={sidebar}>
        <div className="flex flex-col items-center w-full animate-in fade-in zoom-in-95">
          {/* Secret Role Banner */}
          <div className={`mb-8 px-6 py-3 rounded-xl flex items-center gap-3 w-full max-w-2xl border ${isSaboteur ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
            {isSaboteur ? <AlertTriangle size={24} /> : <Check size={24} />}
            <div>
              <p className="font-black text-lg">{isSaboteur ? 'You are the Saboteur!' : 'You are a Regular.'}</p>
              <p className="text-sm opacity-80">{isSaboteur ? 'Subtly mess up the order without getting caught.' : 'Work together to get the list exactly right.'}</p>
            </div>
          </div>

          <h2 className="text-2xl font-display font-black text-textMain mb-6 text-center">{question}</h2>

          {/* Unplaced Items Pool */}
          <div className="w-full max-w-2xl mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-textMuted mb-3">Unplaced Items</p>
            <div className="flex flex-wrap gap-2">
              {unplacedItems.map((item: any, idx: number) => (
                <button 
                  key={idx} 
                  disabled={!isMyTurn}
                  onClick={() => setSelectedItemIndex(idx)}
                  className={`px-4 py-2 rounded-lg border-2 font-bold transition-all ${
                    selectedItemIndex === idx ? 'bg-purple-600 border-purple-600 text-white' : 
                    isMyTurn ? 'bg-background border-border hover:border-purple-300' : 'bg-background border-border opacity-60 cursor-not-allowed'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          {/* The Board */}
          <div className="w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-textMuted">The Board</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-textMuted">Current Turn:</span>
                <div className="flex items-center gap-1.5 bg-background border border-border px-2 py-1 rounded">
                  <div className="w-4 h-4 rounded-full text-white text-[8px] flex items-center justify-center font-bold" style={{ backgroundColor: activePlayer?.color }}>{activePlayer?.name.charAt(0)}</div>
                  <span className="text-xs font-bold text-textMain">{isMyTurn ? 'You' : activePlayer?.name}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {placedItems.map((item: any, slotIdx: number) => (
                <div key={slotIdx} className="flex gap-3 h-14">
                  <div className="w-12 shrink-0 bg-background border border-border rounded-xl flex items-center justify-center font-black text-textMuted">
                    {slotIdx + 1}
                  </div>
                  {item ? (
                    <div className="flex-1 bg-surface border-2 border-border rounded-xl px-4 flex items-center shadow-sm">
                      <span className="font-bold text-textMain text-lg">{item.name}</span>
                    </div>
                  ) : (
                    <button 
                      disabled={!isMyTurn || selectedItemIndex === null}
                      onClick={() => {
                        sendAction('place_item', { itemIndex: selectedItemIndex, slotIndex: slotIdx });
                        setSelectedItemIndex(null);
                      }}
                      className={`flex-1 border-2 border-dashed rounded-xl flex items-center justify-center transition-all ${
                        isMyTurn && selectedItemIndex !== null ? 'border-purple-400 bg-purple-50 hover:bg-purple-100 cursor-pointer text-purple-600 font-bold' : 'border-border bg-background/50 cursor-not-allowed'
                      }`}
                    >
                      {isMyTurn && selectedItemIndex !== null ? 'Place Here' : ''}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </GameLayout>
    );
  }

  // ── 2. VOTING PHASE ──
  if (phase === 'voting') {
    return (
      <GameLayout sidebar={sidebar}>
        <div className="flex flex-col items-center w-full animate-in slide-in-from-bottom-4 duration-500">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-display font-black text-textMain mb-2">Who ruined the list?</h2>
            <p className="text-textMuted font-medium">{hasVoted ? "Vote locked in." : "If you think the list is perfect, the saboteur failed. But who is it?"}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-2xl">
            {room.players.map((p) => {
              const isMyVote = votes[me.id] === p.id;
              return (
                <button key={p.id} disabled={hasVoted} onClick={() => sendAction('submit_vote', { votedForId: p.id })} className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${hasVoted ? (isMyVote ? 'border-purple-600 bg-purple-50' : 'border-transparent opacity-40') : 'border-border bg-background hover:border-purple-300'}`}>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-sm" style={{ backgroundColor: p.color }}>{p.name.charAt(0)}</div>
                  <span className="font-bold text-sm">{p.name} {p.id === me.id && '(You)'}</span>
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
    const saboteur = room.players.find(p => p.id === saboteurId);
    let saboteurCaughtCount = 0;
    Object.values(votes).forEach(vId => { if (vId === saboteurId) saboteurCaughtCount++; });
    const saboteurCaught = saboteurCaughtCount >= Math.ceil((room.players.length - 1) / 2);

    return (
      <GameLayout sidebar={sidebar}>
         <div className="flex flex-col items-center w-full max-w-2xl animate-in zoom-in-95 duration-500 pb-10">
          
          <div className="text-center mb-8">
            <h2 className="text-4xl font-display font-black text-textMain mb-2">
              The List was <span className={isListCorrect ? 'text-green-500' : 'text-red-500'}>{isListCorrect ? 'Perfect!' : 'Wrong!'}</span>
            </h2>
            <p className="text-xl font-bold text-textMuted mb-2">
              {saboteur?.name} was the Saboteur.
            </p>
            <p className="text-sm font-bold tracking-widest uppercase">
              {isListCorrect ? 'Regulars Win (+150)' : saboteurCaught ? 'Saboteur was caught! Regulars Win (+100)' : 'Saboteur Escaped! Saboteur Wins (+300)'}
            </p>
          </div>

          <div className="w-full bg-background border border-border rounded-2xl p-6 mb-8 shadow-soft">
            <h3 className="text-xs font-bold uppercase tracking-widest text-textMuted mb-4 border-b border-border pb-2">The Real Order</h3>
            <div className="flex flex-col gap-2">
              {placedItems.map((item: any, idx: number) => {
                if (!item) return null; // Skip empty slots

                // Safely filter and sort valid items only
                const validItems = [...placedItems].filter(i => i !== null);
                const trueSorted = validItems.sort((a,b) => a.value - b.value);
                const playerMistake = trueSorted[idx]?.name !== item.name;

                return (
                  <div key={idx} className={`flex justify-between items-center p-3 rounded-lg border ${playerMistake ? 'bg-red-50 border-red-200' : 'bg-surface border-border'}`}>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-textMuted w-4">{idx + 1}</span>
                      <span className={`font-bold ${playerMistake ? 'text-red-700' : 'text-textMain'}`}>{item.name}</span>
                    </div>
                    <span className="text-sm font-mono text-textMuted">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {me.isHost && (
            <button onClick={() => sendAction('next_round')} className="w-full sm:w-auto mx-auto flex items-center justify-center gap-2 bg-black hover:bg-black text-white px-8 py-3.5 rounded-xl font-bold transition-all active:scale-95">
              {currentRound === totalRounds ? 'View Final Leaderboard' : `Start Round ${currentRound + 1}`} <ArrowRight size={18} />
            </button>
          )}
        </div>
      </GameLayout>
    );
  }

  // ── 4. LEADERBOARD PHASE ──
  if (phase === 'leaderboard') {
    const sortedPlayers = [...room.players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
    return (
      <div className="flex flex-col items-center w-full max-w-xl mx-auto py-10 animate-in slide-in-from-bottom-8">
        <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-6 shadow-sm"><Trophy size={40} /></div>
        <h2 className="text-4xl font-display font-black text-textMain mb-2 text-center">Final Scores</h2>
        <div className="w-full flex flex-col gap-3 mb-12 mt-8">
          {sortedPlayers.map((p, index) => (
             <div key={p.id} className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${index === 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-surface border-border'}`}>
               <div className="flex items-center gap-4">
                 <span className={`text-xl font-black w-8 text-center ${index === 0 ? 'text-yellow-500' : 'text-textMuted'}`}>#{index + 1}</span>
                 <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-sm" style={{ backgroundColor: p.color }}>{p.name.charAt(0).toUpperCase()}</div>
                 <span className={`font-bold ${index === 0 ? 'text-yellow-700 text-xl' : 'text-textMain text-lg'}`}>{p.name}</span>
               </div>
               <span className={`font-black text-2xl font-mono ${index === 0 ? 'text-yellow-600' : 'text-textMain'}`}>{scores[p.id] || 0}</span>
             </div>
          ))}
        </div>
        {me.isHost && (
          <button onClick={() => sendAction('back_to_lobby')} className="flex items-center justify-center gap-2 bg-black text-white px-8 py-4 rounded-xl font-bold transition-all active:scale-95 shadow-lg w-full sm:w-auto"><Home size={18} /> Return to Lobby</button>
        )}
      </div>
    );
  }

  return null;
}