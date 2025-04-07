import { useEffect, useState } from 'react';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from './notificationApi';
import { Notification } from './notification-type';
export default function NotificationPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetch = async () => {
    const { data } = await getNotifications({ includeRead: true });
    setNotifications(data);
  };

  useEffect(() => {
    fetch();
  }, []);

  const handleRead = async (id: string) => {
    await markAsRead(id);
    fetch();
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    fetch();
  };

  const handleReadAll = async () => {
    await markAllAsRead();
    fetch();
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold">Notifications</h2>
        <button onClick={handleReadAll} className="text-sm text-blue-600">
          Mark all as read
        </button>
      </div>
      <ul className="space-y-4">
        {notifications.map((n) => (
          <li
            key={n.id}
            className={`p-4 border rounded-lg ${
              n.isRead ? 'bg-white' : 'bg-blue-50'
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{n.title}</p>
                <p className="text-sm text-gray-700">{n.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                {!n.isRead && (
                  <button
                    onClick={() => handleRead(n.id)}
                    className="text-xs text-blue-600"
                  >
                    Mark as read
                  </button>
                )}
                <button
                  onClick={() => handleDelete(n.id)}
                  className="text-xs text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
