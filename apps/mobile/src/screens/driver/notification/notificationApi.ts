import api from '../../../lib/axios';
import { Notification, NotificationCount, NotificationParams } from './notification-types';

export const getNotifications = async (params?: NotificationParams) => {
  return api.get<Notification[]>('/notifications', { params });
};

export const getNotificationCount = async (onlyUnread = true) => {
  return api.get<NotificationCount>('/notifications/count', {
    params: { onlyUnread },
  });
};

export const markAsRead = async (id: string) => {
  return api.patch(`/notifications/${id}/read`);
};

export const markAllAsRead = async () => {
  return api.patch('/notifications/read-all');
};

export const deleteNotification = async (id: string) => {
  return api.delete(`/notifications/${id}`);
}; 