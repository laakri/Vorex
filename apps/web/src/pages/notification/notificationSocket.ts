import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
  withCredentials: true,
});

export const subscribeToNotifications = (
  userId: string,
  cb: (notification: any) => void
) => {
  socket.emit('join', userId);
  socket.on('notification', cb);
};

export const unsubscribeNotifications = () => {
  socket.off('notification');
};
