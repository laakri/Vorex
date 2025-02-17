import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Truck, AlertCircle, Plus } from "lucide-react";
import { format } from "date-fns";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { AddOrderDialog } from "./add-order-dialog";
import React from "react";

// Enums
export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

// Interfaces
interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    name: string;
  };
}

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}



interface StatusConfig {
  label: string;
  color: string;
}

interface OrderStats {
  total: number;
  pending: number;
  inTransit: number;
}

// Constants
const ORDER_STATUSES: Record<OrderStatus, StatusConfig> = {
  [OrderStatus.PENDING]: { label: 'Pending', color: 'bg-yellow-500' },
  [OrderStatus.PROCESSING]: { label: 'Processing', color: 'bg-blue-500' },
  [OrderStatus.READY_FOR_PICKUP]: { label: 'Ready for Pickup', color: 'bg-purple-500' },
  [OrderStatus.IN_TRANSIT]: { label: 'In Transit', color: 'bg-indigo-500' },
  [OrderStatus.DELIVERED]: { label: 'Delivered', color: 'bg-green-500' },
  [OrderStatus.CANCELLED]: { label: 'Cancelled', color: 'bg-red-500' },
};

export function OrdersPage(): JSX.Element {
  // State
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [isAddOrderOpen, setIsAddOrderOpen] = useState<boolean>(false);

  // Queries
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await api.get('/sellers/orders');
      return response.data;
    },
  });

  const orders = data ?? [];

  // Calculations
  const stats: OrderStats = {
    total: orders.length,
    pending: orders.filter(order => order.status === OrderStatus.PENDING).length,
    inTransit: orders.filter(order => order.status === OrderStatus.IN_TRANSIT).length,
  };

  // Filters
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === "" || 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group by status
  const groupedOrders: Record<OrderStatus, Order[]> = filteredOrders.reduce((acc, order) => {
    const status = order.status;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(order);
    return acc;
  }, {} as Record<OrderStatus, Order[]>);

  // Status order for display
  const statusOrder: OrderStatus[] = [
    OrderStatus.PENDING,
    OrderStatus.PROCESSING,
    OrderStatus.READY_FOR_PICKUP,
    OrderStatus.IN_TRANSIT,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED
  ];

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your customer orders
          </p>
        </div>
        <Button onClick={() => setIsAddOrderOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Order
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <Package className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground leading-none">
                Total Orders
              </p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground leading-none">
                Pending Orders
              </p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <Truck className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground leading-none">
                In Transit
              </p>
              <p className="text-2xl font-bold">{stats.inTransit}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-dashed">
        <CardContent className="flex justify-between items-center py-3">
          <div className="flex gap-3 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders by ID, customer name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select 
              value={statusFilter} 
              onValueChange={(value) => setStatusFilter(value as OrderStatus | 'all')}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(ORDER_STATUSES).map(([value, { label }]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <div className="text-red-500">Error loading orders</div>
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <div className="text-muted-foreground">No orders found</div>
                </TableCell>
              </TableRow>
            ) : (
              statusOrder.map(status => {
                const ordersInStatus = groupedOrders[status] || [];
                if (ordersInStatus.length === 0) return null;

                return (
                  <React.Fragment key={status}>
                    <TableRow className="bg-primary/5">
                      <TableCell colSpan={6} className="py-2">
                        <span className="font-semibold text-primary">
                          {ORDER_STATUSES[status].label}
                        </span>
                      </TableCell>
                    </TableRow>
                    {ordersInStatus.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.customerName}</div>
                            <div className="text-sm text-muted-foreground">
                              {order.customerEmail}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${ORDER_STATUSES[order.status].color} text-white`}
                          >
                            {ORDER_STATUSES[order.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell>{order.items.length} items</TableCell>
                        <TableCell className="text-right">
                          {order.totalAmount.toFixed(2)} DT
                        </TableCell>
                        <TableCell>
                          {format(new Date(order.createdAt), "dd MMM yyyy HH:mm")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AddOrderDialog 
        open={isAddOrderOpen}
        onOpenChange={setIsAddOrderOpen}
        onOrderAdded={() => refetch()}
      />
    </div>
  );
} 