import { useState } from 'react';
import { socket } from '../lib/socket';
import type { RoomState, Player } from '@tab-arcade/shared';
import { Users, ArrowRight, Home, Trophy, Settings, Brain, Zap, Check, X } from 'lucide-react';

interface Props {
  room: RoomState;
  me: Player | undefined;
}

function SidebarLeaderboard({ room, meId, scores, currentRound, totalRounds }: { 
  room: RoomState, meId: string, scores: Record<string, number>, currentRound: number, totalRounds: number 
}) {
  const sortedPlayers = [...room.players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
  
  return (
    <div className="w-full lg:w-80 shrink-0 bg-surface border border-border rounded-2xl p-5 shadow-soft h-fit self-start">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-accent" />
          <h3 className="font-display font-bold text-lg text-textMain">Leaderboard</h3>
        </div>
        {currentRound ? (
          <span className="text-[10px] font-bold tracking-widest uppercase bg-background border border-border px-2 py-1 rounded-md text-textMuted">
            Round {currentRound}/{totalRounds}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        {sortedPlayers.map((p, idx) => (
          <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl ${p.id === meId ? 'bg-background border border-border' : 'hover:bg-background/50'}`}>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold w-4 text-center ${idx === 0 && (scores[p.id] || 0) > 0 ? 'text-yellow-500' : 'text-textMuted'}`}>
                {idx + 1}
              </span>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: p.color }}>
                {p.name.charAt(0).toUpperCase()}
              </div>
              <span className={`text-sm font-semibold truncate max-w-[100px] ${p.id === meId ? 'text-textMain' : 'text-textMuted'}`}>
                {p.name}
              </span>
            </div>
            <span className="font-bold text-textMain font-mono text-sm">{scores[p.id] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


function GameLayout({ children, sidebar }: { children: React.ReactNode, sidebar: React.ReactNode }) {
  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto items-start">
      <div className="flex-1 w-full bg-surface border border-border rounded-2xl p-6 md:p-10 shadow-soft min-h-[500px] flex flex-col items-center justify-center">
        {children}
      </div>
      {sidebar}
    </div>
  );
}

export function ClueCollision({ room, me }: Props) {
  const { 
    phase, currentRound, totalRounds, scores = {},
    guesserId, secretWord, clues = {}, collidedClues = [], guess, isCorrect
  } = room.gameState || {};

  const [selectedRounds, setSelectedRounds] = useState(3);
  const [clueInput, setClueInput] = useState('');
  const [guessInput, setGuessInput] = useState('');

  if (!me) return null;

  const isGuesser = me.id === guesserId;
  const guesserPlayer = room.players.find(p => p.id === guesserId);
  const hasSubmittedClue = clues[me.id] !== undefined;

  const sendAction = (action: string, payload?: any) => {
    socket.emit('game_action', { roomId: room.id, action, payload });
  };


  const sidebar = (
    <SidebarLeaderboard 
      room={room} 
      meId={me.id} 
      scores={scores} 
      currentRound={currentRound} 
      totalRounds={totalRounds} 
    />
  );

  // ── 0. SETUP PHASE ──
  if (phase === 'setup') {
    return (
      <GameLayout sidebar={sidebar}>
        <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95 w-full max-w-md">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
            <Brain size={32} />
          </div>
          <h2 className="text-3xl font-display font-black text-textMain mb-2">Clue Collision</h2>
          <p className="text-textMuted mb-10 text-center">Give one-word clues. Duplicates are deleted.</p>

          {me.isHost ? (
            <div className="w-full">
              <p className="text-sm font-bold tracking-widest uppercase text-textMuted mb-4 text-center">Total Rounds</p>
              <div className="flex gap-3 mb-8">
                {[3, 5, 7].map(num => (
                  <button key={num} onClick={() => setSelectedRounds(num)} className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${selectedRounds === num ? 'border-blue-600 bg-blue-600 text-white' : 'border-border text-textMuted hover:border-zinc-300'}`}>
                    {num}
                  </button>
                ))}
              </div>
              <button onClick={() => sendAction('start_first_round', { rounds: selectedRounds })} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2">
                Start Game <ArrowRight size={18} />
              </button>
            </div>
          ) : (
             <div className="flex flex-col items-center p-8 border border-border rounded-2xl w-full bg-background">
               <Users size={24} className="text-textMuted mb-3" />
               <p className="text-textMain font-bold">Waiting for host...</p>
             </div>
          )}
        </div>
      </GameLayout>
    );
  }

  // ── 1. WRITING PHASE ──
  if (phase === 'writing') {
    return (
      <GameLayout sidebar={sidebar}>
        <div className="flex flex-col items-center w-full max-w-md animate-in fade-in zoom-in-95">
          {isGuesser ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-background border-2 border-border rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain size={32} className="text-textMuted" />
              </div>
              <h2 className="text-3xl font-display font-black text-textMain mb-3">You are guessing!</h2>
              <p className="text-textMuted">Wait while the others write clues.</p>
            </div>
          ) : (
            <div className="w-full text-center">
              <p className="text-sm font-bold tracking-widest text-textMuted uppercase mb-2">Secret Word</p>
              <h2 className="text-5xl font-display font-black text-textMain mb-10 tracking-tight">{secretWord}</h2>
              
              {hasSubmittedClue ? (
                <div className="p-8 border border-border rounded-2xl bg-background">
                  <Check size={32} className="text-green-500 mx-auto mb-3" />
                  <p className="font-bold text-textMain">Clue locked in.</p>
                  <p className="text-sm text-textMuted mt-1">Waiting for other players...</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 w-full">

                  <input 
                    type="text" 
                    value={clueInput} 
                    onChange={(e) => setClueInput(e.target.value)}
                    placeholder="Enter a 1-word clue..."
                    maxLength={15}
                    className="w-full bg-background border-2 border-border rounded-xl px-5 py-4 text-lg font-bold text-center outline-none focus:border-blue-500 transition-colors"
                    autoFocus
                  />
                  <button 
                    disabled={!clueInput.trim()}
                    onClick={() => { sendAction('submit_clue', { clue: clueInput.trim() }); setClueInput(''); }}
                    className="w-full bg-blue-600 disabled:opacity-50 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition-all active:scale-95"
                  >
                    Submit Clue
                  </button>
                  <p className="text-xs font-bold text-textMuted uppercase tracking-widest mt-4 flex items-center justify-center gap-1">
                    <Zap size={14} /> Warning: Duplicates will be deleted
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </GameLayout>
    );
  }

  // ── 2. GUESSING PHASE ──
  if (phase === 'guessing') {
    const survivingCluesCount = Object.keys(clues).length - collidedClues.length;

    return (
      <GameLayout sidebar={sidebar}>
        <div className="flex flex-col items-center w-full max-w-2xl animate-in slide-in-from-bottom-4">
          <h2 className="text-2xl font-display font-black text-textMain mb-8 text-center">
            {isGuesser ? "Here are your clues..." : "Time for the guess!"}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full mb-10">
            {room.players.filter(p => p.id !== guesserId).map(p => {
              const isCollided = collidedClues.includes(p.id);
              const clueText = clues[p.id];
              return (
                <div key={p.id} className={`p-4 rounded-2xl border-2 flex flex-col items-center text-center transition-all ${isCollided ? 'border-red-200 bg-red-50' : 'border-border bg-background shadow-sm'}`}>
                  <div className="w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center mb-2" style={{ backgroundColor: p.color }}>{p.name.charAt(0)}</div>
                  {isCollided ? (
                    <>
                      <p className="text-red-500 font-black text-lg line-through opacity-50">{isGuesser ? '?????' : clueText}</p>
                      <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mt-1">Collision!</p>
                    </>
                  ) : (
                    <p className="text-textMain font-black text-xl">{clueText}</p>
                  )}
                </div>
              );
            })}
          </div>

          {isGuesser ? (
            <div className="w-full max-w-md flex flex-col gap-3">
              <p className="text-sm font-bold text-textMuted text-center mb-2">{survivingCluesCount} clues survived. What's the word?</p>

              <input 
                type="text" 
                value={guessInput} 
                onChange={e => setGuessInput(e.target.value)}
                placeholder="Your guess..."
                className="w-full bg-background border-2 border-border rounded-xl px-5 py-4 text-xl font-bold text-center outline-none focus:border-blue-500"
                autoFocus
              />
              <button 
                disabled={!guessInput.trim()}
                onClick={() => { sendAction('submit_guess', { guess: guessInput.trim() }); setGuessInput(''); }}
                className="w-full bg-blue-600 disabled:opacity-50 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition-all active:scale-95"
              >
                Submit Guess
              </button>
            </div>
          ) : (
            <div className="p-6 border border-border rounded-2xl bg-background text-center w-full max-w-md">
              <p className="font-bold text-textMain text-lg mb-1">{guesserPlayer?.name} is guessing...</p>
              <p className="text-sm text-textMuted">{survivingCluesCount} clues survived the collision.</p>
            </div>
          )}
        </div>
      </GameLayout>
    );
  }

  // ── 3. RESULTS PHASE ──
  if (phase === 'results') {
    return (
      <GameLayout sidebar={sidebar}>
        <div className="flex flex-col items-center w-full max-w-md animate-in zoom-in-95">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg ${isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {isCorrect ? <Check size={40} /> : <X size={40} />}
          </div>
          
          <h2 className="text-4xl font-display font-black text-textMain mb-2 text-center">
            {isCorrect ? 'Correct!' : 'Wrong!'}
          </h2>
          <p className="text-textMuted mb-10 text-center">
            {guesserPlayer?.name} guessed <strong className="text-textMain">"{guess}"</strong>
          </p>

          <div className="w-full bg-surface border border-border rounded-2xl p-6 text-center mb-10 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-widest text-textMuted mb-2">The Secret Word was</p>
            <p className="text-3xl font-display font-black text-textMain">{secretWord}</p>
          </div>

          {me.isHost && (
            <button onClick={() => sendAction('next_round')} className="w-full bg-textMain hover:bg-black text-white py-4 rounded-xl font-bold transition-all active:scale-95 flex justify-center items-center gap-2">
              {currentRound === totalRounds ? 'View Final Leaderboard' : 'Next Round'} <ArrowRight size={18} />
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
        <p className="text-textMuted mb-10 text-center">After {totalRounds} rounds.</p>
        <div className="w-full flex flex-col gap-3 mb-12">
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
          <button onClick={() => sendAction('back_to_lobby')} className="flex items-center justify-center gap-2 bg-textMain text-white px-8 py-4 rounded-xl font-bold transition-all active:scale-95 shadow-lg w-full sm:w-auto"><Home size={18} /> Return to Lobby</button>
        )}
      </div>
    );
  }

  return null;
}