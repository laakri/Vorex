import { io, Socket } from 'socket.io-client';

let socket: Socket;

export const connectSocket = (token: string) => {
  if (!socket) {
    socket = io('http://localhost:3000', {
      transports: ['websocket'],
      withCredentials: true,
      autoConnect: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }

  if (!socket.connected) {
    socket.auth = { token: `Bearer ${token}` };

    socket.connect();

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }
};

export const subscribeToNotifications = (
  userId: string,
  token: string,
  callback: (notification: any) => void
) => {
  connectSocket(token);

  const onConnect = () => {
    console.log('Socket connected, joining room for user:', userId);
    socket.emit('join', userId);
  };

  socket.off('connect', onConnect); // Prevent duplicate handlers
  socket.on('connect', onConnect);

  socket.off('notification'); // Remove previous listener to avoid duplicates
  socket.on('notification', callback);
};

export const unsubscribeNotifications = () => {
  if (socket) {
    socket.off('notification');
    socket.off('connect');
    socket.disconnect();
    socket = undefined as any;
  }
};
