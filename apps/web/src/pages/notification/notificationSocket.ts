import { io } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.store';



const { token } = useAuthStore();


const getAuthToken = () => {
  return token; // Or however you store your JWT
};

// Use the correct port (3000 for the API, not 5173 which is Vite's dev server)
const socket = io('http://localhost:3000', {
  withCredentials: true,
  auth: {
    token: `Bearer ${getAuthToken()}`
  },
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      // Refresh token if needed
      socket.auth = {
        token: `Bearer ${getAuthToken()}`
      };
    });
  }
};

export const subscribeToNotifications = (
  userId: string,
  callback: (notification: any) => void
) => {
  connectSocket();
  
  socket.on('connect', () => {
    console.log('Socket connected, joining room for user:', userId);
    socket.emit('join', userId);
  });

  socket.on('notification', callback);
};

export const unsubscribeNotifications = () => {
  socket.off('notification');
  socket.disconnect();
};