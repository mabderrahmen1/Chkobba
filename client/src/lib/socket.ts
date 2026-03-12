import { io, Socket } from 'socket.io-client';

// When VITE_SERVER_URL is set, connect to that URL (local dev with separate server).
// Otherwise connect to the same origin (Render deployment serves both).
const SERVER_URL = import.meta.env.VITE_SERVER_URL;

const socketOptions = {
  transports: ['websocket', 'polling'] as string[],
  autoConnect: true,
  reconnection: true
};

export const socket: Socket = SERVER_URL
  ? io(SERVER_URL, socketOptions)
  : io(socketOptions);
