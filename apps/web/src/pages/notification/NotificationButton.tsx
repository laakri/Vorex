import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getNotificationCount } from './notificationApi';
import {
  subscribeToNotifications,
  unsubscribeNotifications,
} from './notificationSocket';
import { toast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/auth.store';

export default function NotificationButton({ collapsed }: { collapsed: boolean }) {
  const [notificationsCount, setNotificationsCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    const fetchCount = async () => {
      try {
        const { data } = await getNotificationCount();
        if (mounted) {
          setNotificationsCount(data.count);
        }
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };

    if (user?.id && token) {
      fetchCount();

      subscribeToNotifications(user.id, token, (notification) => {
        console.log('New notification received:', notification);
        if (mounted) {
          setNotificationsCount((prev) => prev + 1);
          toast({
            title: notification.title,
            description: notification.message,
            duration: 5000,
          });
        }
      });
    }

    return () => {
      mounted = false;
      unsubscribeNotifications();
    };
  }, [user?.id, token]);

  const basePath = location.pathname.startsWith('/warehouse')
    ? '/warehouse'
    : location.pathname.startsWith('/seller')
    ? '/seller'
    : location.pathname.startsWith('/driver')
    ? '/driver'
    : location.pathname.startsWith('/admin')
    ? '/admin'
    : '/';

  return (
    <div className={cn('flex items-center justify-center p-3', collapsed && 'p-2')}>
      <Button
        variant="secondary"
        className={cn('flex items-center gap-2', collapsed ? 'w-auto p-2' : 'w-full')}
        onClick={() => navigate(`${basePath}/notifications`)}
      >
        <Bell className="h-5 w-5" />
        {!collapsed && <span className="text-sm">Notifications</span>}
        {notificationsCount > 0 && (
          <span className={cn('bg-red-500 text-white rounded-full px-2 text-xs', !collapsed && 'ml-1')}>
            {notificationsCount}
          </span>
        )}
      </Button>
    </div>
  );
}
