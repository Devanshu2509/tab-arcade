import { useState, useEffect } from 'react';
import type { RoomState, Player } from '@tab-arcade/shared';
import { Trophy, ArrowRight, User, Home, Circle, X, Minus } from 'lucide-react';
import Confetti from 'react-confetti';

interface Props {
  room: RoomState;
  me: Player | undefined;
  sendAction: (action: string, payload?: any) => void;
}

function SidebarLeaderboard({ room, meId, teams, teamScores, currentRound, totalRounds }: any) {
  const teamX = teams?.X || [];
  const teamO = teams?.O || [];
  
  return (
    <div className="w-full xl:w-80 shrink-0 flex flex-col gap-4 h-fit">
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-soft">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-accent" />
            <h3 className="font-display font-bold text-lg text-textMain">Team Scores</h3>
          </div>
          {currentRound ? <span className="text-[10px] font-bold tracking-widest uppercase bg-background border border-border px-2 py-1 rounded-md text-textMuted">Round {currentRound}/{totalRounds}</span> : null}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2 font-black text-blue-700"><X size={20} strokeWidth={3} /> Team X</div>
            <span className="font-mono font-black text-xl text-blue-800">{teamScores?.X || 0}</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {teamX.map((p: Player) => (
              <span key={p.id} className={`text-sm ${p.id === meId ? 'font-bold text-blue-900' : 'text-blue-600/80'} flex items-center gap-2`}>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name} {p.id === meId && '(You)'}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2 font-black text-rose-700"><Circle size={18} strokeWidth={3} /> Team O</div>
            <span className="font-mono font-black text-xl text-rose-800">{teamScores?.O || 0}</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {teamO.map((p: Player) => (
              <span key={p.id} className={`text-sm ${p.id === meId ? 'font-bold text-rose-900' : 'text-rose-600/80'} flex items-center gap-2`}>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name} {p.id === meId && '(You)'}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TicTacToe({ room, me, sendAction }: Props) {
  const { phase, board, teams, teamScores, activeTeam, activePlayerIndexes, roundWinner, currentRound, totalRounds } = room.gameState || {};
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [selectedRounds, setSelectedRounds] = useState(3);

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!me) return null;

  const sidebar = <SidebarLeaderboard room={room} meId={me.id} teams={teams} teamScores={teamScores} currentRound={currentRound} totalRounds={totalRounds} />;

  // ── SETUP PHASE ──
  if (phase === 'setup') {
    const myTeam = teams?.X?.find((p: Player) => p.id === me.id) ? 'X' : 'O';

    return (
      <div className="flex flex-col xl:flex-row gap-6 w-full max-w-6xl mx-auto items-start">
        <div className="flex-1 w-full bg-surface border border-border rounded-2xl p-6 md:p-10 shadow-soft flex flex-col items-center animate-in fade-in zoom-in-95">
          <h2 className="text-3xl font-display font-black text-textMain mb-2">Team Tic-Tac-Toe</h2>
          <p className="text-textMuted mb-8 text-center max-w-md">Choose your side! Teams take turns placing their mark to get 3 in a row.</p>

          {/* TEAM SELECTION */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl mb-10">
            {/* TEAM X */}
            <div className={`flex-1 rounded-2xl border-2 p-5 transition-all ${myTeam === 'X' ? 'bg-blue-50 border-blue-500 shadow-md' : 'bg-surface border-border hover:border-blue-300'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 font-black text-xl text-blue-700"><X size={24} strokeWidth={3} /> Team X</div>
                <span className="text-xs font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded-md">{teams?.X?.length || 0} Players</span>
              </div>
              <div className="flex flex-col gap-2 min-h-[100px] mb-4">
                {teams?.X?.map((p: Player) => (
                  <div key={p.id} className="flex items-center gap-2 text-sm font-medium text-blue-900">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold" style={{backgroundColor: p.color}}>{p.name.charAt(0).toUpperCase()}</div>
                    {p.name} {p.id === me.id && '(You)'}
                  </div>
                ))}
              </div>
              <button onClick={() => sendAction('join_team', { team: 'X' })} disabled={myTeam === 'X'} className={`w-full py-2.5 rounded-xl font-bold transition-all ${myTeam === 'X' ? 'bg-blue-600 text-white cursor-default shadow-sm' : 'bg-blue-100 hover:bg-blue-200 text-blue-700 active:scale-95'}`}>
                {myTeam === 'X' ? 'Joined Team X' : 'Switch to Team X'}
              </button>
            </div>

            {/* TEAM O */}
            <div className={`flex-1 rounded-2xl border-2 p-5 transition-all ${myTeam === 'O' ? 'bg-rose-50 border-rose-500 shadow-md' : 'bg-surface border-border hover:border-rose-300'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 font-black text-xl text-rose-700"><Circle size={22} strokeWidth={3} /> Team O</div>
                <span className="text-xs font-bold bg-rose-100 text-rose-600 px-2 py-1 rounded-md">{teams?.O?.length || 0} Players</span>
              </div>
              <div className="flex flex-col gap-2 min-h-[100px] mb-4">
                {teams?.O?.map((p: Player) => (
                  <div key={p.id} className="flex items-center gap-2 text-sm font-medium text-rose-900">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold" style={{backgroundColor: p.color}}>{p.name.charAt(0).toUpperCase()}</div>
                    {p.name} {p.id === me.id && '(You)'}
                  </div>
                ))}
              </div>
              <button onClick={() => sendAction('join_team', { team: 'O' })} disabled={myTeam === 'O'} className={`w-full py-2.5 rounded-xl font-bold transition-all ${myTeam === 'O' ? 'bg-rose-600 text-white cursor-default shadow-sm' : 'bg-rose-100 hover:bg-rose-200 text-rose-700 active:scale-95'}`}>
                {myTeam === 'O' ? 'Joined Team O' : 'Switch to Team O'}
              </button>
            </div>
          </div>

          {me.isHost ? (
            <div className="w-full max-w-sm pt-6 border-t border-border">
              <p className="text-sm font-bold tracking-widest uppercase text-textMuted mb-3 text-center">Total Rounds</p>
              <div className="flex gap-2 mb-6">
                {[1, 3, 5, 7].map(num => (
                  <button key={num} onClick={() => setSelectedRounds(num)} className={`flex-1 py-2 rounded-lg border-2 font-bold transition-all ${selectedRounds === num ? 'border-textMain bg-textMain text-white' : 'border-border text-textMuted'}`}>{num}</button>
                ))}
              </div>
              <button onClick={() => sendAction('start_match', { rounds: selectedRounds })} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2">Start Match <ArrowRight size={18} /></button>
            </div>
          ) : (
            <p className="text-sm font-bold text-textMuted animate-pulse">Waiting for host to start...</p>
          )}
        </div>
        {sidebar}
      </div>
    );
  }

  // ── PLAYING PHASE ──
  if (phase === 'playing') {
    const activeTeamArray = teams[activeTeam];
    const activePlayerIndex = activePlayerIndexes[activeTeam] % activeTeamArray.length;
    const activePlayer = activeTeamArray[activePlayerIndex];
    
    const isMyTurn = me.id === activePlayer?.id;
    const isXTurn = activeTeam === 'X';
    const turnColorBg = isXTurn ? 'bg-blue-50 border-blue-300' : 'bg-rose-50 border-rose-300';
    const turnTextColor = isXTurn ? 'text-blue-800' : 'text-rose-800';

    return (
      <div className="flex flex-col xl:flex-row gap-6 w-full max-w-6xl mx-auto items-start animate-in fade-in zoom-in-95">
        <div className="flex-1 w-full bg-surface border border-border rounded-2xl p-6 md:p-10 shadow-soft flex flex-col items-center">
          
          <div className={`w-full max-w-sm p-4 rounded-xl text-center mb-10 border-2 transition-all duration-300 shadow-sm ${turnColorBg} ${turnTextColor}`}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <User size={18} />
              <h3 className="font-black text-xl uppercase tracking-wide">
                {isMyTurn ? "Your Turn!" : `${activePlayer?.name}'s Turn`}
              </h3>
            </div>
            <p className="text-sm font-bold opacity-80">
              {isMyTurn ? "Click any empty square to place your mark." : `They are placing for Team ${activeTeam}.`}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full max-w-[400px] aspect-square">
            {board.map((cell: string | null, index: number) => {
              const canClick = isMyTurn && cell === null;
              
              return (
                <button
                  key={index}
                  disabled={!canClick}
                  onClick={() => sendAction('make_move', { index })}
                  className={`
                    w-full h-full rounded-2xl border-4 text-6xl sm:text-7xl flex items-center justify-center transition-all duration-200
                    ${cell === null && canClick ? 'bg-background border-border hover:border-emerald-400 hover:bg-emerald-50 cursor-pointer shadow-sm hover:-translate-y-1' : ''}
                    ${cell === null && !canClick ? 'bg-background border-border opacity-50 cursor-not-allowed' : ''}
                    ${cell === 'X' ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-inner' : ''}
                    ${cell === 'O' ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-inner' : ''}
                  `}
                >
                  {cell === 'X' && <X size={64} strokeWidth={3} className="animate-in zoom-in spin-in-12 duration-300" />}
                  {cell === 'O' && <Circle size={56} strokeWidth={4} className="animate-in zoom-in duration-300" />}
                </button>
              );
            })}
          </div>
        </div>
        {sidebar}
      </div>
    );
  }

  // ── ROUND RESULTS PHASE ──
  if (phase === 'round_results') {
    const isDraw = roundWinner === 'Draw';
    const isXWinner = roundWinner === 'X';
    
    return (
      <div className="flex flex-col xl:flex-row gap-6 w-full max-w-6xl mx-auto items-start">
        <div className="flex-1 w-full bg-surface border border-border rounded-2xl p-10 shadow-soft min-h-[500px] flex flex-col items-center justify-center animate-in zoom-in-95 relative overflow-hidden">
          {!isDraw && <Confetti width={800} height={500} recycle={false} numberOfPieces={300} gravity={0.2} style={{ position: 'absolute' }} />}
          
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-md
            ${isDraw ? 'bg-zinc-100 text-zinc-500' : isXWinner ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'}`}
          >
            {isDraw ? <Minus size={48} /> : isXWinner ? <X size={48} strokeWidth={3} /> : <Circle size={40} strokeWidth={4} />}
          </div>

          <h2 className="text-5xl font-display font-black text-textMain mb-4">
            {isDraw ? "It's a Draw!" : `Team ${roundWinner} Wins!`}
          </h2>
          
          {!isDraw && <p className="text-xl font-bold mb-10 text-emerald-600">(+1 Point)</p>}

          {me.isHost && (
            <button onClick={() => sendAction('next_round')} className="flex items-center justify-center gap-2 bg-textMain hover:bg-black text-white px-8 py-4 rounded-xl font-bold transition-all active:scale-95 z-10">
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
    const xWon = teamScores.X > teamScores.O;
    const oWon = teamScores.O > teamScores.X;
    const draw = teamScores.X === teamScores.O;

    return (
      <div className="flex flex-col items-center w-full max-w-xl mx-auto py-10 animate-in slide-in-from-bottom-8">
        {!draw && <Confetti width={windowSize.width} height={windowSize.height} recycle={true} numberOfPieces={200} />}
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6 shadow-sm"><Trophy size={40} /></div>
        <h2 className="text-4xl font-display font-black text-textMain mb-2 text-center">
          {draw ? "Tournament Tied!" : xWon ? "Team X wins the Tournament!" : "Team O wins the Tournament!"}
        </h2>

        <div className="w-full flex gap-4 mb-12 mt-8">
          <div className={`flex-1 p-6 rounded-2xl border-2 text-center ${xWon ? 'bg-blue-50 border-blue-300 shadow-md scale-105' : 'bg-surface border-border'}`}>
            <h3 className="font-black text-2xl text-blue-700 mb-2">Team X</h3>
            <p className="font-mono text-4xl font-black text-blue-800">{teamScores.X}</p>
          </div>
          <div className={`flex-1 p-6 rounded-2xl border-2 text-center ${oWon ? 'bg-rose-50 border-rose-300 shadow-md scale-105' : 'bg-surface border-border'}`}>
            <h3 className="font-black text-2xl text-rose-700 mb-2">Team O</h3>
            <p className="font-mono text-4xl font-black text-rose-800">{teamScores.O}</p>
          </div>
        </div>

        {me.isHost && (
          <button onClick={() => sendAction('back_to_lobby')} className="flex items-center justify-center gap-2 bg-textMain text-white px-8 py-4 rounded-xl font-bold transition-all active:scale-95 shadow-lg w-full sm:w-auto">
            <Home size={18} /> Return to Lobby
          </button>
        )}
      </div>
    );
  }

  return null;
}