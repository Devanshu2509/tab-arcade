import { GameEngine } from './GameEngine';
import { RoomState } from '@tab-arcade/shared';

const WORD_PAIRS = [
  ['Apple', 'Pear'], ['Ocean', 'Lake'], ['Guitar', 'Ukulele'],
  ['Car', 'Truck'], ['Dog', 'Wolf'], ['Sun', 'Moon'],
  ['Burger', 'Sandwich'], ['Jacket', 'Coat'], ['River', 'Pool'],
  ['Mountain', 'Hill'], ['Coffee', 'Tea'], ['Lion', 'Tiger'],
  ['Sword', 'Shield'], ['Pancake', 'Waffle'], ['Laptop', 'Tablet'],
  ['Coke', 'Pepsi'], ['Sofa', 'Chair'], ['Movie', 'Play']
];

// Helper to generate a new round while keeping scores
const setupNewRound = (room: RoomState, totalRounds: number) => {
  const pair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
  const isImposterFirst = Math.random() > 0.5;
  const regularWord = isImposterFirst ? pair[1] : pair[0];
  const imposterWord = isImposterFirst ? pair[0] : pair[1];

  // Logic to pick a new imposter, trying to avoid picking the exact same one twice in a row
  const previousImposterId = room.gameState?.imposterId;
  let possibleImposters = room.players;
  
  // If we have more than 2 players, try to exclude the previous imposter from this round's draw
  if (room.players.length > 2 && previousImposterId) {
    possibleImposters = room.players.filter(p => p.id !== previousImposterId);
  }

  // Pick the imposter from the available pool
  const imposterIndex = Math.floor(Math.random() * possibleImposters.length);
  const imposterId = possibleImposters[imposterIndex].id;

  // Assign words
  const playerWords: Record<string, string> = {};
  room.players.forEach(p => {
    playerWords[p.id] = p.id === imposterId ? imposterWord : regularWord;
  });

  // Preserve scores or initialize them to 0
  const scores = room.gameState?.scores || {};
  room.players.forEach(p => {
    if (scores[p.id] === undefined) scores[p.id] = 0;
  });

  room.gameState = {
    phase: 'reading',
    currentRound: (room.gameState?.currentRound || 0) + 1,
    totalRounds,
    scores,
    playerWords,
    imposterId,
    regularWord,
    imposterWord,
    votes: {}
  };
};

export const AlmostSameEngine: GameEngine = {
  initGame: (room: RoomState) => {
    // Start with a setup phase to ask for the number of rounds
    return { phase: 'setup' };
  },

  handleAction: (room: RoomState, playerId: string, action: string, payload?: any) => {
    if (!room.gameState) return;

    switch (action) {
      case 'start_first_round':
        // Host selected rounds and started the game
        setupNewRound(room, payload.rounds || 3);
        break;

      case 'start_voting':
        room.gameState.phase = 'voting';
        break;

      case 'submit_vote':
        room.gameState.votes[playerId] = payload.votedForId;
        
        // Check if everyone has voted
        if (Object.keys(room.gameState.votes).length === room.players.length) {
          // CALCULATE SCORES
          const { imposterId, votes, scores } = room.gameState;
          let imposterVotes = 0;

          Object.entries(votes).forEach(([voterId, targetId]) => {
            if (voterId === imposterId) return; // Imposter's vote doesn't earn them points this way
            
            if (targetId === imposterId) {
              imposterVotes++;
              scores[voterId] += 100; // +100 to each regular who caught the imposter
            }
          });

          // If majority of regulars didn't vote for imposter, imposter wins the round
          // (room.players.length - 1) removes the imposter from the majority calculation
          const regularsWon = imposterVotes >= Math.ceil((room.players.length - 1) / 2); 
          if (!regularsWon) {
            scores[imposterId] += 200; // +200 for imposter if they escape
          }

          room.gameState.phase = 'results';
        }
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