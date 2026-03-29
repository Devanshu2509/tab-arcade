import { RoomState } from '@tab-arcade/shared';

export interface GameEngine {
  /**
   * Initializes the game state when the host clicks "Start".
   */
  initGame: (room: RoomState) => any;

  /**
   * Handles in-game actions (voting, guessing, etc).
   * Modifies the `room` object directly in memory.
   */
  handleAction: (room: RoomState, playerId: string, action: string, payload?: any) => void;
}