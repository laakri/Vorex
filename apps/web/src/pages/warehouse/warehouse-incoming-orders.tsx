import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Search} from "lucide-react";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth.store";
import { format } from "date-fns";

// Order status types based on your schema
type OrderStatus = 
  | "PENDING"
  | "LOCAL_ASSIGNED_TO_PICKUP"
  | "LOCAL_PICKED_UP"
  | "LOCAL_DELIVERED"
  | "CITY_ASSIGNED_TO_PICKUP"
  | "CITY_PICKED_UP"
  | "CITY_IN_TRANSIT_TO_WAREHOUSE"
  | "CITY_ARRIVED_AT_SOURCE_WAREHOUSE"
  | "CITY_READY_FOR_INTERCITY_TRANSFER"
  | "CITY_READY_FOR_INTERCITY_TRANSFER_BATCHED"
  | "CITY_IN_TRANSIT_TO_DESTINATION_WAREHOUSE"
  | "CITY_ARRIVED_AT_DESTINATION_WAREHOUSE"
  | "CITY_READY_FOR_LOCAL_DELIVERY"
  | "CITY_READY_FOR_LOCAL_DELIVERY_BATCHED"
  | "CITY_DELIVERED"
  | "CANCELLED";

// Batch types
type BatchType = "LOCAL_PICKUP" | "LOCAL_SELLERS_WAREHOUSE" | "LOCAL_WAREHOUSE_BUYERS" | "INTERCITY";

// Batch status
type BatchStatus = "COLLECTING" | "PROCESSING" | "COMPLETED";

// Order type
type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  sellerId: string;
  sellerName: string;
  buyerName: string;
  buyerAddress: string;
  buyerCity: string;
  buyerGovernorate: string;
  totalWeight: number;
  totalItems: number;
  warehouseId?: string;
  secondaryWarehouseId?: string;
  sectionId?: string;
  pileId?: string;
  batchId?: string;
  batch?: {
    id: string;
    batchNumber: string;
    type: BatchType;
    status: BatchStatus;
  };
  seller?: {
    businessName: string;
    phone: string;
  };
  items?: Array<{
    quantity: number;
    weight: number;
    product: {
      name: string;
      sku: string;
    };
  }>;
};

// Batch type
type Batch = {
  id: string;
  batchNumber: string;
  type: BatchType;
  status: BatchStatus;
  createdAt: string;
  updatedAt: string;
  orders: Order[];
  totalOrders: number;
  totalWeight: number;
  sourceWarehouseId?: string;
  destinationWarehouseId?: string;
  batchId : string;
  driverId?: string;
  driverName?: string;
  vehicleId?: string;
  vehiclePlate?: string;
};

export default function IncomingOrdersPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("source");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isAssignLocationOpen, setIsAssignLocationOpen] = useState(false);
  const [sections, setSections] = useState<{id: string, name: string, piles: {id: string, name: string}[]}[]>([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedPile, setSelectedPile] = useState("");
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchWarehouseSections();
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const warehouseId = user?.warehouseId;
      if (!warehouseId) throw new Error("No warehouse ID found");
      
      const response = await api.get(`/warehouse/${warehouseId}/orders/incoming-warehouse`);
      console.log(response.data, warehouseId); // Log raw data
      
      // Ensure we have valid data with all required fields
      const validOrders = response.data.map((order: any) => ({
        ...order,
        id: order.id || '',
        orderNumber: order.orderNumber || order.id?.substring(0, 8) || '',
        sellerName: order.sellerName || (order.seller?.businessName || 'Unknown Seller'),
        buyerName: order.customerName || order.buyerName || 'Unknown Buyer',
        totalItems: order.totalItems || (order.items?.length || 0),
        totalWeight: order.totalWeight || 0,
        status: order.status || 'PENDING'
      }));
      
      console.log("Processed orders:", validOrders);
      setOrders(validOrders);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to load incoming orders",
        variant: "destructive",
      });
      setOrders([]); // Set empty array on error
      setLoading(false);
    }
  };

  const fetchWarehouseSections = async () => {
    try {
      const warehouseId = user?.warehouseId || "default-warehouse-id";
      const response = await api.get(`/warehouse/${warehouseId}`);
      
      if (response.data && response.data.sections) {
        setSections(response.data.sections);
      }
    } catch (error) {
      console.error("Error fetching warehouse sections:", error);
      toast({
        title: "Error",
        description: "Failed to load warehouse sections",
        variant: "destructive",
      });
    }
  };

  const handleOrderArrival = async (orderId: string) => {
    try {
      setProcessingAction(true);
      const warehouseId = user?.warehouseId;
      if (!warehouseId) throw new Error("No warehouse ID found");
      
      await api.put(`/warehouse/orders/${orderId}/status`, {
        status: "CITY_ARRIVED_AT_SOURCE_WAREHOUSE"
      });
      
      toast({
        title: "Success",
        description: "Order marked as arrived",
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

  const handleAssignLocation = (order: Order) => {
    setSelectedOrder(order);
    setSelectedSection("");
    setSelectedPile("");
    setIsAssignLocationOpen(true);
  };

  const handleLocationAssignment = async () => {
    if (!selectedOrder || !selectedSection || !selectedPile) {
      toast({
        title: "Error",
        description: "Please select both section and pile",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessingAction(true);
      await api.put(`/warehouse/orders/${selectedOrder.id}/location`, {
        sectionId: selectedSection,
        pileId: selectedPile
      });
      
      toast({
        title: "Success",
        description: "Order location assigned successfully",
      });
      setSelectedOrder(null as unknown as Order);
      setSelectedSection("");
      setSelectedPile("");
      setIsAssignLocationOpen(false);
      fetchOrders();
    } catch (error) {
      console.error("Error assigning location:", error);
      toast({
        title: "Error",
        description: "Failed to assign location",
        variant: "destructive",
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCreateBatch = async () => {
    try {
      setProcessingAction(true);
      const warehouseId = user?.warehouseId || "default-warehouse-id";
      
      const eligibleOrders = orders.filter(
        order => order.status === "CITY_READY_FOR_INTERCITY_TRANSFER"
      );
      
      if (eligibleOrders.length === 0) {
        toast({
          title: "Warning",
          description: "No eligible orders to create a batch",
          variant: "destructive",
        });
        setProcessingAction(false);
        return;
      }
      
      await api.post(`/batches`, {
        warehouseId: warehouseId,
        type: "INTERCITY",
        orderIds: eligibleOrders.map(order => order.id)
      });
      
      toast({
        title: "Success",
        description: `Created a new batch with ${eligibleOrders.length} orders`,
      });
      
      fetchOrders();
    } catch (error) {
      console.error("Error creating batch:", error);
      toast({
        title: "Error",
        description: "Failed to create batch",
        variant: "destructive",
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusBadgeColor = (status: OrderStatus) => {
    switch (status) {
      case "CITY_IN_TRANSIT_TO_WAREHOUSE":
        return "bg-yellow-100 text-yellow-800";
      case "CITY_ARRIVED_AT_SOURCE_WAREHOUSE":
        return "bg-green-100 text-green-800";
      case "CITY_IN_TRANSIT_TO_DESTINATION_WAREHOUSE":
        return "bg-blue-100 text-blue-800";
      case "CITY_ARRIVED_AT_DESTINATION_WAREHOUSE":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getBatchStatusBadgeColor = (status: BatchStatus) => {
    switch (status) {
      case "COLLECTING":
        return "bg-yellow-500";
      case "PROCESSING":
        return "bg-blue-500";
      case "COMPLETED":
        return "bg-green-500";
      default:
        return "bg-secondary";
    }
  };

  const filteredOrders = orders.filter(order => {
    const orderNumber = (order.orderNumber || '').toLowerCase();
    const sellerName = (order.sellerName || '').toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    
    const matchesSearch = 
      orderNumber.includes(searchLower) ||
      sellerName.includes(searchLower);
    
    if (activeTab === "source") {
      return matchesSearch && (
        order.status === "CITY_PICKED_UP" ||
        order.status === "CITY_ARRIVED_AT_SOURCE_WAREHOUSE"
      );
    } else if (activeTab === "destination") {
      return matchesSearch && (
        order.status === "CITY_IN_TRANSIT_TO_DESTINATION_WAREHOUSE" ||
        order.status === "CITY_ARRIVED_AT_DESTINATION_WAREHOUSE"
      );
    }
    
    return matchesSearch;
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Incoming Orders</h1>
        <Button 
          onClick={fetchOrders}
          variant="outline"
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Refresh
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading orders...</span>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Orders Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="source" onValueChange={setActiveTab}>
                <div className="flex justify-between items-center mb-4">
                  <TabsList>
                    <TabsTrigger value="source">Source Warehouse</TabsTrigger>
                    <TabsTrigger value="destination">Destination Warehouse</TabsTrigger>
                  </TabsList>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search orders..."
                        className="pl-8 w-[200px] sm:w-[300px]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    {activeTab === "destination" && (
                      <Button 
                        onClick={handleCreateBatch}
                        disabled={processingAction || !orders.some(o => o.status === "CITY_READY_FOR_INTERCITY_TRANSFER")}
                      >
                        {processingAction ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Create Batch
                      </Button>
                    )}
                  </div>
                </div>

                <TabsContent value="source" className="space-y-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Seller</TableHead>
                          <TableHead>Buyer</TableHead>
                          <TableHead>Destination</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Weight</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.length > 0 ? (
                          filteredOrders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-medium">{order.orderNumber || order.id?.substring(0, 8) || 'N/A'}</TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{order.sellerName || 'Unknown'}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {order.seller?.phone || 'No phone'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>{order.buyerName}</TableCell>
                              <TableCell>{order.buyerCity}, {order.buyerGovernorate}</TableCell>
                              <TableCell>{order.totalItems || 0}</TableCell>
                              <TableCell>{(order.totalWeight || 0).toFixed(2)} kg</TableCell>
                              <TableCell>
                                <Badge className={getStatusBadgeColor(order.status)}>
                                  {order.status?.replace(/_/g, " ") || 'UNKNOWN'}
                                </Badge>
                              </TableCell>
                              <TableCell>{format(new Date(order.createdAt || new Date()), "MMM dd, yyyy")}</TableCell>
                              <TableCell className="text-right">
                                {order.status === "CITY_PICKED_UP" && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleOrderArrival(order.id)}
                                    disabled={processingAction}
                                  >
                                    {processingAction ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                                    Mark Arrived
                                  </Button>
                                )}
                                {order.status === "CITY_ARRIVED_AT_SOURCE_WAREHOUSE" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAssignLocation(order)}
                                    disabled={processingAction}
                                  >
                                    {processingAction ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                                    Assign Location
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                              No incoming orders found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="destination" className="space-y-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Seller</TableHead>
                          <TableHead>Buyer</TableHead>
                          <TableHead>Destination</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Batch</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.length > 0 ? (
                          filteredOrders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-medium">{order.orderNumber || order.id?.substring(0, 8) || 'N/A'}</TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{order.sellerName || 'Unknown'}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {order.seller?.phone || 'No phone'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>{order.buyerName}</TableCell>
                              <TableCell>{order.buyerCity}, {order.buyerGovernorate}</TableCell>
                              <TableCell>
                                {order.sectionId ? (
                                  <span className="text-green-600">Assigned</span>
                                ) : (
                                  <span className="text-amber-600">Unassigned</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusBadgeColor(order.status)}>
                                  {order.status?.replace(/_/g, " ") || 'UNKNOWN'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {order.batchId ? (
                                  <Badge variant="outline">
                                    {batches.find(b => b.id === order.batchId)?.batchNumber || "Unknown"}
                                  </Badge>
                                ) : (
                                  <span className="text-sm text-muted-foreground">Not batched</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {!order.batchId && order.status === "CITY_READY_FOR_INTERCITY_TRANSFER" && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleAssignLocation(order)}
                                    disabled={processingAction}
                                  >
                                    Reassign
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                              No orders in destination
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Batches Card */}
          <Card>
            <CardHeader>
              <CardTitle>Active Batches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch #</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Total Weight</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.length > 0 ? (
                      batches.map((batch) => (
                        <TableRow key={batch.id}>
                          <TableCell className="font-medium">{batch.batchNumber}</TableCell>
                          <TableCell>{batch.type.replace(/_/g, " ")}</TableCell>
                          <TableCell>
                            <Badge className={getBatchStatusBadgeColor(batch.status)}>
                              {batch.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{batch.totalOrders}</TableCell>
                          <TableCell>{batch.totalWeight.toFixed(2)} kg</TableCell>
                          <TableCell>
                            {batch.destinationWarehouseId ? (
                              <span>Warehouse #{batch.destinationWarehouseId.substring(0, 8)}</span>
                            ) : (
                              <span className="text-muted-foreground">Not assigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {batch.driverName || <span className="text-muted-foreground">Not assigned</span>}
                          </TableCell>
                          <TableCell>{format(new Date(batch.createdAt), "MMM dd, yyyy")}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                          No active batches
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Assign Location Dialog */}
      <Dialog open={isAssignLocationOpen} onOpenChange={setIsAssignLocationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Warehouse Location</DialogTitle>
            <DialogDescription>
              Select a section and pile to store this order in the warehouse.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedOrder && (
              <div className="grid gap-2">
                <div className="p-2 border rounded-md bg-muted">
                  <p className="font-medium">Order #{selectedOrder.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    From: {selectedOrder.sellerName} | To: {selectedOrder.buyerName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Items: {selectedOrder.totalItems} | Weight: {selectedOrder.totalWeight.toFixed(2)} kg
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="section" className="text-sm font-medium">
                  Warehouse Section
                </label>
                <select
                  id="section"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                >
                  <option value="">Select a section</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <label htmlFor="pile" className="text-sm font-medium">
                  Storage Pile
                </label>
                <select
                  id="pile"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedPile}
                  onChange={(e) => setSelectedPile(e.target.value)}
                  disabled={!selectedSection}
                >
                  <option value="">Select a pile</option>
                  {sections
                    .find(section => section.id === selectedSection)
                    ?.piles.map((pile) => (
                      <option key={pile.id} value={pile.id}>
                        {pile.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAssignLocationOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleLocationAssignment}
              disabled={processingAction || !selectedSection || !selectedPile}
            >
              {processingAction ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Assign Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 