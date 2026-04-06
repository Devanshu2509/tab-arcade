import { GameEngine } from './GameEngine';
import { RoomState } from '@tab-arcade/shared';

const SECRET_WORDS = [
  'Pyramid', 'Vampire', 'Microscope', 'Tornado', 'Cactus', 
  'Submarine', 'Kangaroo', 'Helicopter', 'Volcano', 'Penguin',
  'Telescope', 'Dragon', 'Astronaut', 'Rainbow', 'Octopus',
  'Diamond', 'Parachute', 'Dinosaur', 'Magnet', 'Skeleton'
];

const setupNewRound = (room: RoomState, totalRounds: number) => {
  const word = SECRET_WORDS[Math.floor(Math.random() * SECRET_WORDS.length)];
  
  // Rotate the guesser each round
  const currentRound = (room.gameState?.currentRound || 0) + 1;
  const guesserIndex = (currentRound - 1) % room.players.length;
  const guesserId = room.players[guesserIndex].id;

  const scores = room.gameState?.scores || {};
  room.players.forEach(p => {
    if (scores[p.id] === undefined) scores[p.id] = 0;
  });

  room.gameState = {
    phase: 'writing',
    currentRound,
    totalRounds,
    scores,
    guesserId,
    secretWord: word,
    clues: {}, 
    collidedClues: [], // Array of playerIds whose clues were deleted
    guess: null,
    isCorrect: false
  };
};

export const ClueCollisionEngine: GameEngine = {
  initGame: (room: RoomState) => {
    return { phase: 'setup' };
  },

  handleAction: (room: RoomState, playerId: string, action: string, payload?: any) => {
    if (!room.gameState) return;

    switch (action) {
      case 'start_first_round':
        setupNewRound(room, payload.rounds || 3);
        break;

      case 'submit_clue':
        room.gameState.clues[playerId] = payload.clue;
        
        // Check if all clue givers have submitted
        const expectedClues = room.players.length - 1; // Everyone except guesser
        if (Object.keys(room.gameState.clues).length === expectedClues) {
          
          // --- COLLISION LOGIC ---
          const clueMap: Record<string, string[]> = {};
          
          Object.entries(room.gameState.clues).forEach(([pId, clue]) => {
            // Normalize: lowercase, remove spaces and special chars
            const normalized = String(clue).toLowerCase().replace(/[^a-z0-9]/g, '');
            if (!clueMap[normalized]) clueMap[normalized] = [];
            clueMap[normalized].push(pId);
          });

          const collided: string[] = [];
          Object.values(clueMap).forEach(pIds => {
            if (pIds.length > 1) {
              collided.push(...pIds); // If more than 1 person wrote it, they collide!
            }
          });

          room.gameState.collidedClues = collided;
          room.gameState.phase = 'guessing';
        }
        break;

      case 'submit_guess':
        const isCorrect = String(payload.guess).toLowerCase().trim() === room.gameState.secretWord.toLowerCase().trim();
        room.gameState.guess = payload.guess;
        room.gameState.isCorrect = isCorrect;

        // SCORING
        if (isCorrect) {
          room.gameState.scores[room.gameState.guesserId] += 150; // Guesser gets 150
          
          // Surviving clue givers get 100
          Object.keys(room.gameState.clues).forEach(giverId => {
            if (!room.gameState.collidedClues.includes(giverId)) {
              room.gameState.scores[giverId] += 100;
            }
          });
        }

        room.gameState.phase = 'results';
        break;

      case 'next_round':
        if (room.gameState.currentRound < room.gameState.totalRounds) {
          setupNewRound(room, room.gameState.totalRounds);
        } else {
          room.gameState.phase = 'leaderboard';
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