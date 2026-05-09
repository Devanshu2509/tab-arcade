import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomState, Player } from '@tab-arcade/shared';

// Import Game Engines
import { GameEngine } from './games/GameEngine';
import { AlmostSameEngine } from './games/AlmostSameEngine';
import { ClueCollisionEngine } from './games/ClueCollisionEngine';
import { RankingSaboteurEngine } from './games/RankingSaboteurEngine';
import { LocationGuesserEngine } from './games/LocationGuesserEngine';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'], credentials: true }
});

const rooms = new Map<string, RoomState>();
const disconnectTimeouts = new Map<string, NodeJS.Timeout>();

const getRandomColor = () => {
  const colors = ['#f87171', '#fb923c', '#fbbf24', '#a3e635', '#34d399', '#2dd4bf', '#38bdf8', '#22d3ee', '#60a5fa', '#818cf8', '#a78bfa', '#c084fc', '#e879f9', '#f472b6', '#fb7185'];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Map Game IDs to their specific Engine logic
const GAME_ENGINES: Record<string, GameEngine> = {
  'almost_same': AlmostSameEngine,
  'clue_collision': ClueCollisionEngine,
  'ranking_saboteur': RankingSaboteurEngine,
  'location_guesser': LocationGuesserEngine,
};

io.on('connection', (socket) => {
  console.log(`🟢 Connection established: ${socket.id}`);

  // ✅ CREATE ROOM
  socket.on('create_room', (data: { playerName: string, playerId: string }, callback) => {
    try {
      const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
      const newPlayer: Player = {
        id: data.playerId,
        name: data.playerName || 'Player 1',
        isHost: true,
        color: getRandomColor(),
      };
      const newRoom: RoomState = { id: roomId, players: [newPlayer], status: 'lobby', currentGame: null };
      rooms.set(roomId, newRoom);
      socket.join(roomId);
      (socket as any).playerId = data.playerId;
      console.log(`🏠 Room created: ${roomId}`);
      callback({ success: true, roomId });
    } catch (err) {
      callback({ success: false, message: 'Server error' });
    }
  });

  // ✅ JOIN ROOM
  socket.on('join_room', (data: { roomId: string, playerName: string, playerId: string }, callback) => {
    try {
      const room = rooms.get(data.roomId);
      if (!room) return callback({ success: false, message: 'Room not found' });
      
      (socket as any).playerId = data.playerId;
      socket.join(data.roomId);

      if (disconnectTimeouts.has(data.playerId)) {
        clearTimeout(disconnectTimeouts.get(data.playerId)!);
        disconnectTimeouts.delete(data.playerId);
      }

      const existingPlayerIndex = room.players.findIndex(p => p.id === data.playerId);
      if (existingPlayerIndex !== -1) {
        room.players[existingPlayerIndex].name = data.playerName || room.players[existingPlayerIndex].name;
        io.to(data.roomId).emit('room_updated', room);
        return callback({ success: true, room });
      }

      const newPlayer: Player = {
        id: data.playerId,
        name: data.playerName || `Player ${room.players.length + 1}`,
        isHost: room.players.length === 0,
        color: getRandomColor(),
      };
      room.players.push(newPlayer);
      io.to(data.roomId).emit('room_updated', room);
      callback({ success: true, room });
    } catch (err) {
      callback({ success: false, message: 'Server error' });
    }
  });

  // ✅ START GAME (Delegated to specific Game Engine)
  socket.on('start_game', (data: { roomId: string, gameId: string }, callback) => {
    try {
      const room = rooms.get(data.roomId);
      if (!room) return callback({ success: false, message: 'Room not found' });

      const playerId = (socket as any).playerId;
      const player = room.players.find(p => p.id === playerId);
      
      if (!player || !player.isHost) {
        return callback({ success: false, message: 'Only the host can start' });
      }

      const engine = GAME_ENGINES[data.gameId];
      if (!engine) {
        return callback({ success: false, message: 'Game not implemented yet' });
      }

      // Update room status
      room.status = 'playing';
      room.currentGame = data.gameId;
      
      // Let the specific game engine initialize the state
      room.gameState = engine.initGame(room);
      
      console.log(`🎮 Game ${data.gameId} started in room: ${data.roomId}`);
      io.to(data.roomId).emit('room_updated', room);
      callback({ success: true });
    } catch (err) {
      console.error('❌ start_game error:', err);
      callback({ success: false, message: 'Server error' });
    }
  });

  // ✅ IN-GAME ACTIONS (Delegated to specific Game Engine)
  // FIX: Notice that `action` is now typed as an object { type: string, payload?: any }
  socket.on('game_action', (data: { roomId: string, action: { type: string, payload?: any } }, callback) => {
    try {
      const room = rooms.get(data.roomId);
      if (!room) return;

      const playerId = (socket as any).playerId;

      // ── GLOBAL ACTION INTERCEPTOR ──
      // This makes the Exit Game button work regardless of the active game!
      if (data.action.type === 'back_to_lobby') {
        const player = room.players.find(p => p.id === playerId);
        // Only the host can manually exit the game
        if (player?.isHost) {
          room.status = 'lobby';
          room.currentGame = null;
          room.gameState = null;
          io.to(data.roomId).emit('room_updated', room);
        }
        if (callback) callback({ success: true });
        return; // Stop here, do not pass to game engine
      }

      // ── GAME SPECIFIC ROUTING ──
      if (room.currentGame) {
        const engine = GAME_ENGINES[room.currentGame];
        if (engine) {
          // Pass the destructured action type and payload to the specific engine
          engine.handleAction(room, playerId, data.action.type, data.action.payload);
          
          // Broadcast the updated state to everyone
          io.to(data.roomId).emit('room_updated', room);
        }
      }
      
      if (callback) callback({ success: true });
    } catch (err) {
      console.error('❌ game_action error:', err);
    }
  });

  // ✅ DISCONNECT
  socket.on('disconnect', () => {
    const playerId = (socket as any).playerId;
    if (!playerId) return; 

    const timeout = setTimeout(() => {
      disconnectTimeouts.delete(playerId);
      rooms.forEach((room, roomId) => {
        const playerIndex = room.players.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
          const wasHost = room.players[playerIndex].isHost;
          room.players.splice(playerIndex, 1);

          if (room.players.length === 0) {
            rooms.delete(roomId);
          } else {
            if (wasHost) room.players[0].isHost = true;
            io.to(roomId).emit('room_updated', room);
          }
        }
      });
    }, 4000); 

    disconnectTimeouts.set(playerId, timeout);
  });
});

httpServer.listen(4000, () => {
  console.log('🚀 TabArcade API running on port 4000');
});