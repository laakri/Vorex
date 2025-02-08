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

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    name: string;
  };
}

type OrderStatus = 'PENDING' | 'PROCESSING' | 'READY_FOR_PICKUP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';

const ORDER_STATUSES: Record<OrderStatus, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-500' },
  PROCESSING: { label: 'Processing', color: 'bg-blue-500' },
  READY_FOR_PICKUP: { label: 'Ready for Pickup', color: 'bg-purple-500' },
  IN_TRANSIT: { label: 'In Transit', color: 'bg-indigo-500' },
  DELIVERED: { label: 'Delivered', color: 'bg-green-500' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-500' },
};

export function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);

  const { data: orders, isLoading, error, refetch } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await api.get('/sellers/orders');
      console.log('Orders fetched:', response.data);
      return response.data;
    },
  });

  const filteredOrders = orders?.filter((order: Order) => {
    const matchesSearch =
      searchTerm === "" ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders?.length ?? 0,
    pending: orders?.filter((o: Order) => o.status === "PENDING").length ?? 0,
    inTransit: orders?.filter((o: Order) => o.status === "IN_TRANSIT").length ?? 0,
  };

  const handleOrderAdded = async () => {
    console.log('Order added, refreshing list...');
    await refetch();
  };

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
        <CardContent className="flex gap-4 p-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(ORDER_STATUSES).map(([status, { label }]) => (
                <SelectItem key={status} value={status}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              <TableHead className="text-right">Total</TableHead>
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
            ) : orders?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <div className="text-muted-foreground">No orders found</div>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order: Order) => (
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
                    {format(new Date(order.createdAt), "MMM d, yyyy")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AddOrderDialog 
        open={isAddOrderOpen}
        onOpenChange={setIsAddOrderOpen}
        onOrderAdded={handleOrderAdded}
      />
    </div>
  );
} 