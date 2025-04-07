import api from '@/lib/axios';
import { Notification } from './notification-type';
export const getNotifications = (params?: {
  skip?: number;
  take?: number;
  includeRead?: boolean;
}) => {
  return api.get<Notification[]>('/notifications', { params });
};

export const getNotificationCount = (onlyUnread = true) => {
  return api.get<{ count: number }>('/notifications/count', {
    params: { onlyUnread },
  });
};

export const markAsRead = (id: string) => {
  return api.patch(`/notifications/${id}/read`);
};

export const markAllAsRead = () => {
  return api.patch(`/notifications/read-all`);
};

export const deleteNotification = (id: string) => {
  return api.delete(`/notifications/${id}`);
};
