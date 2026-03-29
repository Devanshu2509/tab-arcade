export enum SocketEvents {
  CREATE_ROOM = 'create_room',
  JOIN_ROOM = 'join_room',
  ROOM_UPDATED = 'room_updated',
  START_GAME = 'start_game', // New event
  ERROR = 'error',
  AVAILABLE_GAMES = 'available_games'
}

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  color: string;
}

export interface RoomState {
  id: string;
  players: Player[];
  status: 'lobby' | 'playing';
  currentGame: string | null;
  // We'll add game-specific state here later, but keep it simple for now
  gameState?: any; 
}

// Define the available games
export const AVAILABLE_GAMES = {
  ALMOST_SAME: 'almost_same',
  CLUE_COLLISION: 'clue_collision',
  RANKING_SABOTEUR: 'ranking_saboteur'
};