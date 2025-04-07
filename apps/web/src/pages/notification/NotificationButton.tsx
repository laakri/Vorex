import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getNotificationCount } from './notificationApi';

export default function NotificationButton({ collapsed }: { collapsed: boolean }) {
  const [notificationsCount, setNotificationsCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchCount = async () => {
      const { data } = await getNotificationCount();
      setNotificationsCount(data.count);
    };
    fetchCount();
  }, []);

  // Determine which layout we're in
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
