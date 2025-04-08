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
import { formatDistanceToNow } from 'date-fns';

interface AuditLog {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  createdAt: string;
  isRead: boolean;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.get('/admin/audit-logs');
        setLogs(response.data);
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const getLogTypeBadge = (type: string) => {
    const typeColors = {
      AUDIT: 'bg-blue-500',
      SECURITY: 'bg-red-500',
      SYSTEM: 'bg-purple-500',
      USER: 'bg-green-500',
    };

    return (
      <Badge className={`${typeColors[type as keyof typeof typeColors] || 'bg-gray-500'} text-white`}>
        {type}
      </Badge>
    );
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
        <p className="text-muted-foreground">
          System audit and security logs
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{getLogTypeBadge(log.type)}</TableCell>
                <TableCell className="font-medium">{log.title}</TableCell>
                <TableCell>{log.message}</TableCell>
                <TableCell>
                  <pre className="text-xs bg-muted p-2 rounded">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 