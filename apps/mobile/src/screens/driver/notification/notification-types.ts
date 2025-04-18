export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  isRead: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

export interface NotificationCount {
  count: number;
}

export interface NotificationParams {
  skip?: number;
  take?: number;
  includeRead?: boolean;
} 