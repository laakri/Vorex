import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Warehouse, Truck, Package } from 'lucide-react';
import api from '@/lib/axios';

interface SystemStats {
  totalUsers: number;
  totalSellers: number;
  totalDrivers: number;
  totalWarehouses: number;
  totalOrders: number;
  activeOrders: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/statistics');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch statistics:', error);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      description: 'Registered users in the system',
    },
    {
      title: 'Total Sellers',
      value: stats?.totalSellers || 0,
      icon: Users,
      description: 'Active sellers',
    },
    {
      title: 'Total Drivers',
      value: stats?.totalDrivers || 0,
      icon: Truck,
      description: 'Active drivers',
    },
    {
      title: 'Total Warehouses',
      value: stats?.totalWarehouses || 0,
      icon: Warehouse,
      description: 'Active warehouses',
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: Package,
      description: 'All time orders',
    },
    {
      title: 'Active Orders',
      value: stats?.activeOrders || 0,
      icon: Package,
      description: 'Currently active orders',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your system statistics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 