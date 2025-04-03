import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, PackageCheck } from "lucide-react";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth.store";

// Order status types
type OrderStatus = 
  | "CITY_ARRIVED_AT_SOURCE_WAREHOUSE"
  | "CITY_READY_FOR_INTERCITY_TRANSFER"
  | "CITY_IN_TRANSIT_TO_DESTINATION_WAREHOUSE"
  | "CITY_ARRIVED_AT_DESTINATION_WAREHOUSE";

// Batch status

// Order type
interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  sellerName: string;
  buyerName: string;
  destination: string;
}

export default function OutgoingOrdersPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const warehouseId = user?.warehouseId;
      if (!warehouseId) throw new Error("No warehouse ID found");

      // Use the correct endpoint based on the controller
      const response = await api.get(`/warehouse/${warehouseId}/outgoing-orders`);
      
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsReady = async (orderId: string) => {
    try {
      setProcessingAction(true);
      const warehouseId = user?.warehouseId;
      if (!warehouseId) throw new Error("No warehouse ID found");
      
      await api.put(`/warehouse/orders/${orderId}/status`, {
        status: "CITY_READY_FOR_INTERCITY_TRANSFER"
      });
      
      toast({
        title: "Success",
        description: "Order marked as ready for transfer",
      });
      
      fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusBadgeColor = (status: OrderStatus) => {
    switch (status) {
      case "CITY_ARRIVED_AT_SOURCE_WAREHOUSE":
        return "bg-yellow-500";
      case "CITY_READY_FOR_INTERCITY_TRANSFER":
        return "bg-green-500";
      case "CITY_IN_TRANSIT_TO_DESTINATION_WAREHOUSE":
        return "bg-blue-500";
      case "CITY_ARRIVED_AT_DESTINATION_WAREHOUSE":
        return "bg-purple-500";
      default:
        return "bg-secondary";
    }
  };

  const filteredOrders = orders.filter(order => {
    const orderNumber = (order.orderNumber || '').toLowerCase();
    const sellerName = (order.sellerName || '').toLowerCase();
    const buyerName = (order.buyerName || '').toLowerCase();
    const destination = (order.destination || '').toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    
    return orderNumber.includes(searchLower) || 
           sellerName.includes(searchLower) || 
           buyerName.includes(searchLower) ||
           destination.includes(searchLower);
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Outgoing Orders</h1>
          <p className="text-muted-foreground">
            Manage orders leaving your warehouse
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search orders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Orders Ready for Transfer</CardTitle>
          <CardDescription>
            Orders that can be prepared for intercity transfer
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No orders found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{order.destination}</TableCell>
                      <TableCell>{order.sellerName}</TableCell>
                      <TableCell>{order.buyerName}</TableCell>
                      <TableCell>
                        <Badge className={`text-white ${getStatusBadgeColor(order.status)}`}>
                          {order.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.status === "CITY_ARRIVED_AT_SOURCE_WAREHOUSE" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsReady(order.id)}
                            disabled={processingAction}
                          >
                            {processingAction ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <PackageCheck className="h-3 w-3 mr-1" />
                            )}
                            Mark Ready
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 