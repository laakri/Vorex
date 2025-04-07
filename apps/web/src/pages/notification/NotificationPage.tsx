import { useEffect, useState } from 'react';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from './notificationApi';
import { Notification } from './notification-type';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Your Notifications</h2>
        <Button variant="outline" onClick={handleReadAll}>
          Mark All as Read
        </Button>
      </div>

      <ScrollArea className="h-[70vh] pr-2">
        <div className="space-y-4">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`transition-all ${
                n.isRead ? 'bg-muted' : 'bg-primary/5 border-primary/30'
              }`}
            >
              <CardContent className="py-4 px-6 flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-medium">{n.title}</p>
                    {!n.isRead && <Badge variant="outline">New</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  {!n.isRead && (
                    <Button variant="link" size="sm" onClick={() => handleRead(n.id)}>
                      Mark as Read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => handleDelete(n.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
