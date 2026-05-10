import { RoomState, Player } from '@tab-arcade/shared';
import { GameEngine } from './GameEngine';

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

const checkWin = (board: (string | null)[]) => {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  if (!board.includes(null)) return 'Draw';
  return null;
};

const setupNewRound = (room: RoomState, totalRounds: number) => {
  const state = room.gameState;
  const startingTeam = state.currentRound ? (state.currentRound % 2 === 0 ? 'X' : 'O') : 'X';

  room.gameState = {
    ...state,
    phase: 'playing',
    currentRound: (state.currentRound || 0) + 1,
    totalRounds,
    board: Array(9).fill(null),
    activeTeam: startingTeam,
    activePlayerIndexes: state.activePlayerIndexes || { X: 0, O: 0 },
    roundWinner: null
  };
};

export const TicTacToeEngine: GameEngine = {
  initGame: (room: RoomState) => {
    // Pre-split players evenly so everyone starts with a default team
    const teams = { X: [] as Player[], O: [] as Player[] };
    room.players.forEach((p, i) => {
      if (i % 2 === 0) teams.X.push(p);
      else teams.O.push(p);
    });

    return { 
      phase: 'setup', 
      teams, 
      teamScores: { X: 0, O: 0 },
      currentRound: 0
    };
  },

  handleAction: (room: RoomState, playerId: string, action: string, payload?: any) => {
    const state = room.gameState;
    if (!state) return;

    switch (action) {
      case 'join_team':
        if (state.phase !== 'setup') return;
        const targetTeam = payload.team;
        if (targetTeam !== 'X' && targetTeam !== 'O') return;
        
        const player = room.players.find(p => p.id === playerId);
        if (!player) return;

        // Remove player from both teams
        state.teams.X = state.teams.X.filter((p: Player) => p.id !== playerId);
        state.teams.O = state.teams.O.filter((p: Player) => p.id !== playerId);

        // Add to the new target team
        state.teams[targetTeam].push(player);
        break;

      case 'start_match':
        if (state.phase !== 'setup') return;
        setupNewRound(room, payload.rounds || 3);
        break;

      case 'make_move':
        if (state.phase !== 'playing') return;

        const teamArray = state.teams[state.activeTeam] as Player[];
        if (teamArray.length === 0) return; // Failsafe

        const activePlayerIndex = state.activePlayerIndexes[state.activeTeam] % teamArray.length;
        const activePlayer = teamArray[activePlayerIndex];

        if (playerId !== activePlayer.id) return;
        const cellIndex = payload.index;
        if (state.board[cellIndex] !== null) return;

        state.board[cellIndex] = state.activeTeam;
        state.activePlayerIndexes[state.activeTeam]++;

        const result = checkWin(state.board);
        if (result) {
          state.phase = 'round_results';
          state.roundWinner = result;
          if (result === 'X') state.teamScores.X += 1;
          if (result === 'O') state.teamScores.O += 1;
        } else {
          state.activeTeam = state.activeTeam === 'X' ? 'O' : 'X';
        }
        break;

      case 'next_round':
        if (state.currentRound < state.totalRounds) {
          setupNewRound(room, state.totalRounds);
        } else {
          state.phase = 'final_leaderboard';
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