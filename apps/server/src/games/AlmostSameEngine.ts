import { GameEngine } from './GameEngine';
import { RoomState } from '@tab-arcade/shared';

// Word pairs for the game. You can add hundreds of these later!
const WORD_PAIRS = [
  ['Apple', 'Pear'], ['Ocean', 'Lake'], ['Guitar', 'Ukulele'],
  ['Car', 'Truck'], ['Dog', 'Wolf'], ['Sun', 'Moon'],
  ['Burger', 'Sandwich'], ['Jacket', 'Coat'], ['River', 'Pool'],
  ['Mountain', 'Hill'], ['Coffee', 'Tea'], ['Lion', 'Tiger'],
  ['Sword', 'Shield'], ['Pancake', 'Waffle'], ['Laptop', 'Tablet']
];

export const AlmostSameEngine: GameEngine = {
  initGame: (room: RoomState) => {
    // 1. Pick a random word pair
    const pair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
    
    // 2. Decide randomly which word is regular and which is imposter
    const isImposterFirst = Math.random() > 0.5;
    const regularWord = isImposterFirst ? pair[1] : pair[0];
    const imposterWord = isImposterFirst ? pair[0] : pair[1];

    // 3. Pick a random player to be the imposter
    const imposterIndex = Math.floor(Math.random() * room.players.length);
    const imposterId = room.players[imposterIndex].id;

    // 4. Assign words to everyone
    const playerWords: Record<string, string> = {};
    room.players.forEach(p => {
      playerWords[p.id] = p.id === imposterId ? imposterWord : regularWord;
    });

    // Return the initial game state
    return {
      phase: 'reading', // phases: reading -> voting -> results
      playerWords,
      imposterId,
      regularWord,
      imposterWord,
      votes: {} // Stores who voted for who: { "voterId": "suspectId" }
    };
  },

  handleAction: (room: RoomState, playerId: string, action: string, payload?: any) => {
    if (!room.gameState) return;

    switch (action) {
      case 'start_voting':
        // Host moves the game to the voting phase
        room.gameState.phase = 'voting';
        break;

      case 'submit_vote':
        // Record the player's vote
        room.gameState.votes[playerId] = payload.votedForId;
        
        // Check if everyone has voted
        const totalVotes = Object.keys(room.gameState.votes).length;
        if (totalVotes === room.players.length) {
          // Everyone voted! Move to results.
          room.gameState.phase = 'results';
        }
        break;

      case 'back_to_lobby':
        // Host clicks back to lobby after the game ends
        room.status = 'lobby';
        room.currentGame = null;
        room.gameState = null;
        break;
    }
  }
};