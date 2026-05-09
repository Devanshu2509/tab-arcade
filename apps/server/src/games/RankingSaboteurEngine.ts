import { GameEngine } from './GameEngine';
import { RoomState } from '@tab-arcade/shared';

interface RankingQuestion {
  question: string;
  items: { name: string; value: number; label: string }[];
}

const QUESTIONS: RankingQuestion[] = [
  {
    question: "Sort these animals by max lifespan (Shortest to Longest)",
    items: [
      { name: "House Fly", value: 0.08, label: "28 days" },
      { name: "Mouse", value: 1, label: "1 year" },
      { name: "Dog", value: 13, label: "13 years" },
      { name: "Lion", value: 16, label: "16 years" },
      { name: "Polar Bear", value: 20, label: "20 years" },
      { name: "Horse", value: 25, label: "25 years" },
      { name: "Elephant", value: 60, label: "60 years" },
      { name: "Human", value: 73, label: "73 years" }
    ]
  },
  {
    question: "Sort these planets by size (Smallest to Largest)",
    items: [
      { name: "Pluto (Dwarf)", value: 2370, label: "2,370 km" },
      { name: "Mercury", value: 4879, label: "4,879 km" },
      { name: "Mars", value: 6422, label: "6,422 km" },
      { name: "Venus", value: 12104, label: "12,104 km" },
      { name: "Earth", value: 12742, label: "12,742 km" },
      { name: "Neptune", value: 49244, label: "49,244 km" },
      { name: "Saturn", value: 50724, label: "50,724 km" },
      { name: "Jupiter", value: 139820, label: "139,820 km" }
    ]
  }
];

const setupNewRound = (room: RoomState, totalRounds: number) => {
  // Select a random question and shuffle its items to create the unplaced pool
  const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
  const pool = [...q.items].sort(() => Math.random() - 0.5);

  const saboteurIndex = Math.floor(Math.random() * room.players.length);
  const saboteurId = room.players[saboteurIndex].id;

  const scores = room.gameState?.scores || {};
  room.players.forEach(p => { if (scores[p.id] === undefined) scores[p.id] = 0; });

  // Determine turn order
  const turnOrder = room.players.map(p => p.id).sort(() => Math.random() - 0.5);

  room.gameState = {
    phase: 'drafting', // drafting -> voting -> results -> leaderboard
    currentRound: (room.gameState?.currentRound || 0) + 1,
    totalRounds,
    scores,
    saboteurId,
    question: q.question,
    unplacedItems: pool,
    placedItems: new Array(pool.length).fill(null), // Empty slots
    turnOrder,
    currentTurnIndex: 0,
    votes: {}, // Record<voterId, suspectId>
    isListCorrect: false
  };
};

export const RankingSaboteurEngine: GameEngine = {
  initGame: (room: RoomState) => {
    return { phase: 'setup' };
  },

  handleAction: (room: RoomState, playerId: string, action: string, payload?: any) => {
    if (!room.gameState) return;

    switch (action) {
      case 'start_first_round':
        setupNewRound(room, payload.rounds || 3);
        break;

      case 'place_item':
        // Ensure it's this player's turn
        const activePlayerId = room.gameState.turnOrder[room.gameState.currentTurnIndex];
        if (playerId !== activePlayerId) return;

        const { itemIndex, slotIndex } = payload;
        
        // Move item from unplaced to placed
        const item = room.gameState.unplacedItems[itemIndex];
        room.gameState.unplacedItems.splice(itemIndex, 1);
        room.gameState.placedItems[slotIndex] = item;

        // Next turn
        room.gameState.currentTurnIndex++;
        
        // If all players have gone, or no slots left, move to voting
        if (room.gameState.unplacedItems.length === 0 || room.gameState.currentTurnIndex >= room.gameState.turnOrder.length) {
          room.gameState.phase = 'voting';
        }
        break;

      case 'submit_vote':
        room.gameState.votes[playerId] = payload.votedForId;
        
        if (Object.keys(room.gameState.votes).length === room.players.length) {
          const { placedItems, saboteurId, votes, scores } = room.gameState;
          
          // Check if the final built list is in correct ascending order
          const builtValues = placedItems.filter((i: any) => i !== null).map((i: any) => i.value);
          const isCorrect = builtValues.every((val: number, i: number, arr: number[]) => !i || arr[i - 1] <= val);
          room.gameState.isListCorrect = isCorrect;

          let saboteurCaughtCount = 0;
          Object.entries(votes).forEach(([voterId, suspectId]) => {
            if (voterId === saboteurId) return;
            if (suspectId === saboteurId) {
              saboteurCaughtCount++;
              scores[voterId] += 100; // Regulars get 100 for catching saboteur
            }
          });

          // Did the group catch the saboteur?
          const saboteurCaught = saboteurCaughtCount >= Math.ceil((room.players.length - 1) / 2);

          if (isCorrect) {
            // Regulars built a perfect list. Everyone except saboteur gets 150 points.
            room.players.forEach(p => { if (p.id !== saboteurId) scores[p.id] += 150; });
          } else if (!saboteurCaught) {
            // List is wrong AND saboteur escaped! Saboteur gets 300 points!
            scores[saboteurId] += 300;
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