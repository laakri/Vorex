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

interface User {
  id: string;
  fullName: string;
  email: string;
  role: any[];
  isVerifiedSeller: boolean;
  isVerifiedDriver: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/admin/users');
        setUsers(response.data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const getRoleBadge = (role: any) => {
    const roleColors = {
      ADMIN: 'bg-red-500',
      SELLER: 'bg-blue-500',
      WAREHOUSE_MANAGER: 'bg-green-500',
      DRIVER: 'bg-yellow-500',
    };
    return (
      <Badge className={`${roleColors[role as keyof typeof roleColors]} text-white mr-1`}>
        {role}
      </Badge>
    );
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Users Management</h2>
        <p className="text-muted-foreground">
          Manage system users and their roles
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.fullName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.role.map((role) => getRoleBadge(role))}
                </TableCell>
                <TableCell>
                  {user.isVerifiedSeller && (
                    <Badge className="bg-blue-500 text-white mr-1">
                      Verified Seller
                    </Badge>
                  )}
                  {user.isVerifiedDriver && (
                    <Badge className="bg-yellow-500 text-white">
                      Verified Driver
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 