export enum SocketEvents {
  CREATE_ROOM = 'create_room',
  JOIN_ROOM = 'join_room',
  ROOM_UPDATED = 'room_updated',
  START_GAME = 'start_game',
  ERROR = 'error'
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
  gameState?: any;
}

export const AVAILABLE_GAMES = {
  ALMOST_SAME: 'almost_same',
  CLUE_COLLISION: 'clue_collision',
  RANKING_SABOTEUR: 'ranking_saboteur',
  LOCATION_GUESSER: 'location_guesser'
} as const;