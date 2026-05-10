import { useState, useEffect } from 'react';
import type { RoomState, Player } from '@tab-arcade/shared';
import { Trophy, ArrowRight, User, Home, Check } from 'lucide-react';
import Confetti from 'react-confetti';

interface Props {
  room: RoomState;
  me: Player | undefined;
  sendAction: (action: string, payload?: any) => void;
}

function SidebarLeaderboard({ room, meId, scores, currentRound, totalRounds }: any) {
  const sortedPlayers = [...room.players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
  return (
    <div className="w-full xl:w-80 shrink-0 bg-surface border border-border rounded-2xl p-5 shadow-soft h-fit">
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

export function Bingo({ room, me, sendAction }: Props) {
  const { phase, scores = {}, boards, drawnNumbers = [], winner, recentDraw, turnOrder = [], currentTurnIndex = 0, currentRound, totalRounds } = room.gameState || {};
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [dabbedSquares, setDabbedSquares] = useState<Set<number>>(new Set([0]));
  const [selectedRounds, setSelectedRounds] = useState(3);
  
  if (!me) return null;
  const myBoard: number[][] | undefined = boards?.[me.id];

  const activePlayerId = turnOrder[currentTurnIndex];
  const isMyTurn = me.id === activePlayerId;
  const activePlayer = room.players.find(p => p.id === activePlayerId);

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Play sound on draw
  useEffect(() => {
    if (recentDraw && recentDraw !== 0) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      audio.play().catch(() => {});
    }
  }, [recentDraw]);

  // Reset dabs automatically on a new round
  useEffect(() => {
    if (phase === 'playing') {
      setDabbedSquares(new Set([0]));
    }
  }, [currentRound, phase]);

  const handleNumberClick = (num: number) => {
    if (!isMyTurn) return;
    if (drawnNumbers.includes(num)) return;
    if (num === 0) return;
    sendAction('call_number', { number: num });
  };

  const hasBingo = () => {
    if (!myBoard) return false;
    for (let row = 0; row < 5; row++) if (myBoard[row].every(num => drawnNumbers.includes(num))) return true;
    for (let col = 0; col < 5; col++) if (myBoard.every(row => drawnNumbers.includes(row[col]))) return true;
    let diag1 = true, diag2 = true;
    for (let i = 0; i < 5; i++) {
      if (!drawnNumbers.includes(myBoard[i][i])) diag1 = false;
      if (!drawnNumbers.includes(myBoard[i][4 - i])) diag2 = false;
    }
    return diag1 || diag2;
  };

  const sidebar = <SidebarLeaderboard room={room} meId={me.id} scores={scores} currentRound={currentRound} totalRounds={totalRounds} />;

  // ── SETUP PHASE ──
  if (phase === 'setup') {
    return (
      <div className="flex flex-col xl:flex-row gap-6 w-full max-w-6xl mx-auto items-start">
        <div className="flex-1 w-full bg-surface border border-border rounded-2xl p-10 shadow-soft min-h-[500px] flex flex-col items-center justify-center animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6"><Check size={32} /></div>
          <h2 className="text-3xl font-display font-black text-textMain mb-2">Turn-Based Bingo</h2>
          <p className="text-textMuted mb-10 text-center max-w-sm">Take turns calling numbers from your board. Be careful not to give someone else a Bingo!</p>

          {me.isHost ? (
            <div className="w-full max-w-md">
              <p className="text-sm font-bold tracking-widest uppercase text-textMuted mb-4 text-center">Total Rounds</p>
              <div className="flex gap-3 mb-8">
                {[1, 3, 5].map(num => (
                  <button key={num} onClick={() => setSelectedRounds(num)} className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${selectedRounds === num ? 'border-amber-500 bg-amber-500 text-white' : 'border-border text-textMuted'}`}>{num}</button>
                ))}
              </div>
              <button onClick={() => sendAction('start_match', { rounds: selectedRounds })} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2">Start Match <ArrowRight size={18} /></button>
            </div>
          ) : (
             <div className="flex flex-col items-center p-8 border border-border rounded-2xl w-full max-w-md bg-background"><p className="text-textMain font-bold">Waiting for host to start...</p></div>
          )}
        </div>
        {sidebar}
      </div>
    );
  }

  // ── PLAYING PHASE ──
  if (phase === 'playing' && myBoard) {
    const isBingoReady = hasBingo();

    return (
      <div className="flex flex-col xl:flex-row gap-6 w-full max-w-6xl mx-auto items-start animate-in fade-in zoom-in-95">
        
        <style>{`
          @keyframes diagonal-strike { 0% { transform: scaleX(0); } 100% { transform: scaleX(1); } }
          .animate-strike { transform-origin: left center; animation: diagonal-strike 0.25s ease-out forwards; }
        `}</style>

        <div className="flex-1 flex flex-col md:flex-row gap-6 w-full">
          {/* Caller Panel */}
          <div className="flex-1 w-full bg-surface border border-border rounded-2xl p-6 shadow-soft flex flex-col h-full">
            <div className={`p-4 rounded-xl text-center mb-6 border-2 transition-all duration-300 ${
              isMyTurn ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-md scale-[1.02]' : 'bg-background border-border text-textMuted'
            }`}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <User size={18} />
                <h3 className="font-bold text-lg uppercase tracking-wide">{isMyTurn ? "Your Turn!" : `${activePlayer?.name}'s Turn`}</h3>
              </div>
              <p className="text-xs font-medium">{isMyTurn ? "Click an uncalled number on your board." : "Waiting for them to call a number..."}</p>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-xs font-bold tracking-widest uppercase text-textMuted mb-2">Number Called</h2>
              <div className="w-24 h-24 mx-auto bg-accent text-white rounded-full flex items-center justify-center text-4xl font-black shadow-lg animate-in pop-in" key={recentDraw}>
                {recentDraw ? recentDraw : '?'}
              </div>
            </div>

            <div className="bg-background border border-border rounded-xl p-3 flex-1 overflow-hidden flex flex-col">
              <p className="text-[10px] font-bold uppercase text-textMuted mb-2 shrink-0">Draws ({drawnNumbers.length - 1}/75)</p>
              <div className="flex flex-wrap gap-1.5 overflow-y-auto pb-2">
                {drawnNumbers.slice().reverse().map((num: number, idx: number) => {
                  if (num === 0) return null;
                  return (
                    <span key={`${num}-${idx}`} className={`w-7 h-7 flex items-center justify-center rounded-md font-bold text-xs ${idx === 0 ? 'bg-accent text-white' : 'bg-surface border border-border text-textMain'}`}>
                      {num}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Board Panel */}
          <div className="flex-[1.5] w-full flex flex-col items-center">
            <div className="bg-surface border border-border p-4 sm:p-6 rounded-2xl shadow-soft w-full">
              <div className="grid grid-cols-5 gap-2 mb-4 text-center">
                {['B', 'I', 'N', 'G', 'O'].map(letter => (
                  <div key={letter} className="font-black text-2xl text-accent">{letter}</div>
                ))}
              </div>

              <div className="grid grid-cols-5 gap-2">
                {myBoard[0].map((_, colIndex) => (
                  <div key={colIndex} className="flex flex-col gap-2">
                    {myBoard.map((row, rowIndex) => {
                      const num = row[colIndex];
                      const isFree = num === 0;
                      const isCalled = drawnNumbers.includes(num);
                      const canPick = isMyTurn && !isCalled;

                      return (
                        <button
                          key={rowIndex}
                          onClick={() => handleNumberClick(num)}
                          disabled={!canPick}
                          className={`relative overflow-hidden aspect-square flex items-center justify-center rounded-lg font-bold text-lg sm:text-xl transition-all border-2 
                            ${isFree ? 'bg-accent/10 border-accent/30 text-accent' : 
                              canPick ? 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100 hover:scale-105 cursor-pointer text-emerald-800 shadow-sm' : 
                              isCalled ? 'bg-zinc-100 border-zinc-200 text-zinc-400' :
                              'bg-background border-border opacity-80 cursor-not-allowed'}`}
                        >
                          {isFree ? 'FREE' : num}
                          {isCalled && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="absolute w-[140%] h-1 bg-red-500 rotate-45 animate-strike rounded-full"></div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => sendAction('claim_bingo')}
              disabled={!isBingoReady}
              className={`mt-6 w-full py-4 rounded-2xl font-black text-2xl tracking-widest transition-all duration-300 
                ${isBingoReady ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg hover:scale-105 active:scale-95 animate-bounce' : 'bg-surface border-2 border-border text-zinc-400 cursor-not-allowed'}`}
            >
              BINGO!
            </button>
          </div>
        </div>

        {sidebar}
      </div>
    );
  }

  // ── ROUND RESULTS PHASE ──
  if (phase === 'round_results') {
    return (
      <div className="flex flex-col xl:flex-row gap-6 w-full max-w-6xl mx-auto items-start">
        <div className="flex-1 w-full bg-surface border border-border rounded-2xl p-10 shadow-soft min-h-[500px] flex flex-col items-center justify-center animate-in zoom-in-95 relative overflow-hidden">
          <Confetti width={800} height={500} recycle={false} numberOfPieces={300} gravity={0.2} style={{ position: 'absolute' }} />
          <h2 className="text-5xl font-display font-black text-textMain mb-4">BINGO!</h2>
          <p className="text-2xl text-textMuted font-medium mb-8 text-center">
            <span className="font-bold text-textMain">{winner}</span> won the round! <br/>
            <span className="text-emerald-600 text-lg">(+100 points)</span>
          </p>
          {me.isHost && (
            <button onClick={() => sendAction('next_round')} className="flex items-center justify-center gap-2 bg-textMain hover:bg-black text-white px-8 py-4 rounded-xl font-bold transition-all active:scale-95">
              {currentRound === totalRounds ? 'View Final Results' : `Start Round ${currentRound + 1}`} <ArrowRight size={18} />
            </button>
          )}
        </div>
        {sidebar}
      </div>
    );
  }

  // ── FINAL LEADERBOARD PHASE ──
  if (phase === 'final_leaderboard') {
    const sortedPlayers = [...room.players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
    return (
      <div className="flex flex-col items-center w-full max-w-xl mx-auto py-10 animate-in slide-in-from-bottom-8">
        <Confetti width={windowSize.width} height={windowSize.height} recycle={true} numberOfPieces={200} />
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6 shadow-sm"><Trophy size={40} /></div>
        <h2 className="text-4xl font-display font-black text-textMain mb-2 text-center">Final Scores</h2>
        <div className="w-full flex flex-col gap-3 mb-12 mt-8">
          {sortedPlayers.map((p, index) => (
             <div key={p.id} className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${index === 0 ? 'bg-amber-50 border-amber-200' : 'bg-surface border-border'}`}>
               <div className="flex items-center gap-4">
                 <span className={`text-xl font-black w-8 text-center ${index === 0 ? 'text-amber-500' : 'text-textMuted'}`}>#{index + 1}</span>
                 <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-sm" style={{ backgroundColor: p.color }}>{p.name.charAt(0).toUpperCase()}</div>
                 <span className={`font-bold ${index === 0 ? 'text-amber-700 text-xl' : 'text-textMain text-lg'}`}>{p.name}</span>
               </div>
               <span className={`font-black text-2xl font-mono ${index === 0 ? 'text-amber-600' : 'text-textMain'}`}>{scores[p.id] || 0}</span>
             </div>
          ))}
        </div>
        {me.isHost && (
          <button onClick={() => sendAction('back_to_lobby')} className="flex items-center justify-center gap-2 bg-textMain text-white px-8 py-4 rounded-xl font-bold transition-all active:scale-95 shadow-lg w-full sm:w-auto"><Home size={18} /> Return to Lobby</button>
        )}
      </div>
    );
  }

  return null;
}