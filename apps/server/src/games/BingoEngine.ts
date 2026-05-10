import { RoomState } from '@tab-arcade/shared';
import { GameEngine } from './GameEngine';

const BINGO_RANGES = [
  { min: 1, max: 15 },  { min: 16, max: 30 }, { min: 31, max: 45 }, { min: 46, max: 60 }, { min: 61, max: 75 }
];

const getRandomNumbers = (count: number, min: number, max: number): number[] => {
  const nums = new Set<number>();
  while (nums.size < count) nums.add(Math.floor(Math.random() * (max - min + 1)) + min);
  return Array.from(nums);
};

const generateBoard = (): number[][] => {
  const board: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0));
  for (let col = 0; col < 5; col++) {
    const columnNumbers = getRandomNumbers(5, BINGO_RANGES[col].min, BINGO_RANGES[col].max);
    for (let row = 0; row < 5; row++) {
      if (col === 2 && row === 2) board[row][col] = 0; // FREE SPACE
      else board[row][col] = columnNumbers[row];
    }
  }
  return board;
};

const verifyWin = (board: number[][], drawn: number[]): boolean => {
  const drawnSet = new Set(drawn);
  for (let row = 0; row < 5; row++) if (board[row].every(num => drawnSet.has(num))) return true;
  for (let col = 0; col < 5; col++) {
    let colWin = true;
    for (let row = 0; row < 5; row++) { if (!drawnSet.has(board[row][col])) { colWin = false; break; } }
    if (colWin) return true;
  }
  let diag1Win = true, diag2Win = true;
  for (let i = 0; i < 5; i++) {
    if (!drawnSet.has(board[i][i])) diag1Win = false;
    if (!drawnSet.has(board[i][4 - i])) diag2Win = false;
  }
  return diag1Win || diag2Win;
};

const setupNewRound = (room: RoomState, totalRounds: number) => {
  const boards: Record<string, number[][]> = {};
  room.players.forEach(p => boards[p.id] = generateBoard());
  const turnOrder = room.players.map(p => p.id).sort(() => Math.random() - 0.5);

  const scores = room.gameState?.scores || {};
  room.players.forEach(p => { if (scores[p.id] === undefined) scores[p.id] = 0; });

  room.gameState = {
    phase: 'playing',
    currentRound: (room.gameState?.currentRound || 0) + 1,
    totalRounds,
    scores,
    boards,
    drawnNumbers: [0],
    winner: null,
    recentDraw: null,
    turnOrder,
    currentTurnIndex: 0
  };
};

export const BingoEngine: GameEngine = {
  initGame: (room: RoomState) => {
    const scores: Record<string, number> = {};
    room.players.forEach(p => scores[p.id] = 0);
    return { phase: 'setup', scores, currentRound: 0, totalRounds: 3 };
  },

  handleAction: (room: RoomState, playerId: string, action: string, payload?: any) => {
    if (!room.gameState) return;

    switch (action) {
      case 'start_match':
        setupNewRound(room, payload.rounds || 3);
        break;

      case 'call_number':
        if (room.gameState.phase !== 'playing') return;
        const activePlayerId = room.gameState.turnOrder[room.gameState.currentTurnIndex];
        if (playerId !== activePlayerId) return;

        const num = payload.number;
        if (room.gameState.drawnNumbers.includes(num)) return;

        room.gameState.drawnNumbers.push(num);
        room.gameState.recentDraw = num;
        room.gameState.currentTurnIndex = (room.gameState.currentTurnIndex + 1) % room.gameState.turnOrder.length;
        break;

      case 'claim_bingo':
        if (room.gameState.phase !== 'playing') return;
        const playerBoard = room.gameState.boards[playerId];
        if (!playerBoard) return;

        if (verifyWin(playerBoard, room.gameState.drawnNumbers)) {
          room.gameState.phase = 'round_results';
          room.gameState.winner = room.players.find(p => p.id === playerId)?.name;
          room.gameState.scores[playerId] += 100; // Winner gets 100 points
        }
        break;

      case 'next_round':
        if (room.gameState.currentRound < room.gameState.totalRounds) {
          setupNewRound(room, room.gameState.totalRounds);
        } else {
          room.gameState.phase = 'final_leaderboard';
        }
        break;

      case 'back_to_lobby':
        room.status = 'lobby';
        room.currentGame = null;
        room.gameState = null;
        break;
    }
  }
};