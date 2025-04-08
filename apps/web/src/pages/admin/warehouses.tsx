import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Warehouse {
  id: string;
  name: string;
  address: string;
  city: string;
  governorate: string;
  capacity: number;
  currentLoad: number;
  managers: {
    id: string;
    user: {
      fullName: string;
    };
  }[];
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await api.get('/admin/warehouses');
        setWarehouses(response.data);
      } catch (error) {
        console.error('Failed to fetch warehouses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWarehouses();
  }, []);

  const getLoadPercentage = (current: number, total: number) => {
    return ((current / total) * 100).toFixed(1);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Warehouses Management</h2>
        <p className="text-muted-foreground">
          Manage system warehouses and their managers
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Current Load</TableHead>
              <TableHead>Managers</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {warehouses.map((warehouse) => (
              <TableRow key={warehouse.id}>
                <TableCell className="font-medium">{warehouse.name}</TableCell>
                <TableCell>
                  {warehouse.address}, {warehouse.city}, {warehouse.governorate}
                </TableCell>
                <TableCell>{warehouse.capacity} units</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{
                          width: `${getLoadPercentage(
                            warehouse.currentLoad,
                            warehouse.capacity,
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-500">
                      {getLoadPercentage(warehouse.currentLoad, warehouse.capacity)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {warehouse.managers.map((manager) => (
                    <Badge key={manager.id} className="mr-1">
                      {manager.user.fullName}
                    </Badge>
                  ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 