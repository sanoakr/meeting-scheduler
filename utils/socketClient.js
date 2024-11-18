
import io from 'socket.io-client';

let socket;
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const initiateSocket = () => {
  if (!socket) {
    socket = io('/', {
      path: `${basePath}/socket.io`,
      //transports: ['websocket']
      transports: ['websocket', 'polling']
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;