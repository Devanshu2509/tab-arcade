// apps/client/src/lib/socket.ts
import { io } from 'socket.io-client';

export const socket = io('http://localhost:4000', {
  transports: ['websocket'], // Skip polling entirely, go straight to WS
  autoConnect: true,
  withCredentials: true,
});