import { useState, useEffect } from "react";
import {
  MapPin,
  Package,
  Filter,
  Navigation2,
  Timer,
  Warehouse,
  Map,
  Weight,
  Boxes,
  Search,
  Truck,
  Clock,
  CheckCircle2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth.store";

// API types based on backend structure
interface Warehouse {
  id: string;
  name: string;
  address: string;
  city: string;
  governorate: string;
}

interface Batch {
  id: string;
  type: "LOCAL_PICKUP" | "LOCAL_DELIVERY" | "INTERCITY" | "LOCAL_SELLERS_WAREHOUSE" | "LOCAL_WAREHOUSE_BUYERS";
  status: "COLLECTING" | "READY" | "PROCESSING" | "COMPLETED" | "CANCELLED";
  totalWeight: number;
  totalVolume: number;
  orderCount: number;
  vehicleType: "MOTORCYCLE" | "CAR" | "VAN" | "SMALL_TRUCK" | "LARGE_TRUCK";
  scheduledTime: string | null;
}

interface RouteStop {
  id: string;
  orderId: string | null;
  warehouseId: string | null;
  address: string;
  latitude: number;
  longitude: number;
  isPickup: boolean;
  sequenceOrder: number;
  isCompleted: boolean;
  completedAt: string | null;
}

interface DeliveryRoute {
  id: string;
  batchId: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  driverId: string | null;
  totalDistance: number;
  estimatedDuration: number;
  fromWarehouseId: string;
  toWarehouseId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  batch: Batch;
  stops: RouteStop[];
  fromWarehouse?: Warehouse;
  toWarehouse?: Warehouse | null;
  createdAt: number;
}

// Vehicle type mapping for display
const vehicleTypeLabels = {
  MOTORCYCLE: "Motorcycle",
  CAR: "Car",
  VAN: "Van",
  SMALL_TRUCK: "Small Truck",
  LARGE_TRUCK: "Large Truck",
};

// Batch type mapping for display
const batchTypeLabels = {
  LOCAL_PICKUP: "Local Pickup",
  LOCAL_DELIVERY: "Local Delivery",
  INTERCITY: "Intercity",
  LOCAL_SELLERS_WAREHOUSE: "Seller to Warehouse",
  LOCAL_WAREHOUSE_BUYERS: "Warehouse to Buyer",
};

export function DriverAvailableRoutes() {
  const { user } = useAuthStore();
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<DeliveryRoute | null>(null);
  const [showRouteDetails, setShowRouteDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("distance");
  const [filterVehicle, setFilterVehicle] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [acceptingRoute, setAcceptingRoute] = useState(false);
  
  // Fetch available routes
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true);
        
        // Use the api instance which is already configured with the correct baseURL
        const response = await api.get('/delivery-routes/available');
        
        // Ensure we always set an array
        if (Array.isArray(response.data)) {
          setRoutes(response.data);
        } else {
          console.error('Expected array response but got:', response.data);
          setRoutes([]);
        }
      } catch (error) {
        console.error('Failed to fetch routes:', error);
        toast({
          variant: "destructive",
          title: "Error fetching routes",
          description: "Could not load available routes. Please try again.",
        });
        setRoutes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
    
    // Refresh routes every 30 seconds
    const intervalId = setInterval(fetchRoutes, 30000);
    return () => clearInterval(intervalId);
  }, []);

  // Filter and sort routes
  const filteredRoutes = routes
    .filter(route => {
      // Filter by vehicle type if not "all"
      if (filterVehicle !== "all" && route.batch.vehicleType !== filterVehicle) {
        return false;
      }
      
      // Filter by status
      if (activeTab === "pending" && route.status !== "PENDING") return false;
      if (activeTab === "inProgress" && route.status !== "IN_PROGRESS") return false;
      if (activeTab === "completed" && route.status !== "COMPLETED") return false;
      
      // Search query - search in addresses, warehouse names, etc.
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const fromWarehouse = route.fromWarehouse?.name?.toLowerCase() || '';
        const toWarehouse = route.toWarehouse?.name?.toLowerCase() || '';
        const addresses = route.stops.map(s => s.address.toLowerCase()).join(' ');
        
        return (
          fromWarehouse.includes(query) || 
          toWarehouse.includes(query) || 
          addresses.includes(query)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort based on selected criteria
      if (sortBy === "distance") {
        return a.totalDistance - b.totalDistance;
      } else if (sortBy === "duration") {
        return a.estimatedDuration - b.estimatedDuration;
      } else if (sortBy === "date") {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      } else if (sortBy === "orders") {
        return b.batch.orderCount - a.batch.orderCount;
      }
      return 0;
    });

  const handleAcceptRoute = async (route: DeliveryRoute) => {
    try {
      setAcceptingRoute(true);
      
      // Call API to assign driver to route
      await api.post(`/delivery-routes/${route.id}/assign`, {
        driverId: user?.id,
      });
      
      toast({
        title: "Route Accepted",
        description: "You have successfully accepted this delivery route.",
      });
      
      setRoutes(routes.filter(r => r.id !== route.id));
      setShowRouteDetails(false);
    } catch (error) {
      console.error('Failed to accept route:', error);
      toast({
        variant: "destructive",
        title: "Error accepting route",
        description: "Could not accept this route. Please try again.",
      });
    } finally {
      setAcceptingRoute(false);
    }
  };

  const getRouteDescription = (route: DeliveryRoute) => {
    // Determine route type description
    if (route.batch.type === 'INTERCITY') {
      return `Intercity: ${route.fromWarehouse?.city || 'Origin'} → ${route.toWarehouse?.city || 'Destination'}`;
    } else if (route.batch.type === 'LOCAL_PICKUP' || route.batch.type === 'LOCAL_SELLERS_WAREHOUSE') {
      return `Pickup: ${route.stops.length - 1} stops → ${route.fromWarehouse?.name || 'Warehouse'}`;
    } else {
      return `Delivery: ${route.fromWarehouse?.name || 'Warehouse'} → ${route.stops.length - 1} stops`;
    }
  };
  
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header with Stats */}
      <div className="border-b">
        <div className="container py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Available Routes</h1>
              <p className="text-sm text-muted-foreground">
                {filteredRoutes.length} routes available for your vehicle type
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Available</p>
                  <p className="text-2xl font-semibold">{routes.filter(r => r.status === "PENDING").length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Navigation2 className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">In Progress</p>
                  <p className="text-2xl font-semibold">{routes.filter(r => r.status === "IN_PROGRESS").length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Timer className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Avg. Duration</p>
                  <p className="text-2xl font-semibold">
                    {Math.round(routes.reduce((acc, route) => acc + route.estimatedDuration, 0) / (routes.length || 1))} min
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Warehouse className="h-4 w-4 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Warehouses</p>
                  <p className="text-2xl font-semibold">
                    {new Set(routes.map(r => r.fromWarehouseId).concat(
                      routes.map(r => r.toWarehouseId).filter(Boolean) as string[]
                    )).size}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Enhanced Filter Section */}
          <div className="flex flex-col gap-4 mb-6">
            {/* Search and Map View */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search routes..."
                  className="pl-9 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="default" size="sm" className="gap-2 hidden sm:flex">
                <Map className="h-4 w-4" />
                Map View
              </Button>
            </div>

            {/* Filter and Sort Controls */}
            <div className="flex flex-wrap gap-2">
              <Tabs 
                defaultValue="all" 
                className="w-full sm:w-auto"
                value={activeTab}
                onValueChange={setActiveTab}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                  <TabsTrigger value="pending" className="flex-1">Pending</TabsTrigger>
                  <TabsTrigger value="inProgress" className="flex-1">In Progress</TabsTrigger>
                  <TabsTrigger value="completed" className="flex-1">Completed</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex gap-2 w-full sm:w-auto">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <div className="flex items-center">
                      <Filter className="mr-2 h-4 w-4" />
                      <span>Sort By</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="distance">Distance</SelectItem>
                    <SelectItem value="duration">Duration</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="orders">Orders</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterVehicle} onValueChange={setFilterVehicle}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <div className="flex items-center">
                      <Truck className="mr-2 h-4 w-4" />
                      <span>Vehicle</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="MOTORCYCLE">Motorcycle</SelectItem>
                    <SelectItem value="CAR">Car</SelectItem>
                    <SelectItem value="VAN">Van</SelectItem>
                    <SelectItem value="SMALL_TRUCK">Small Truck</SelectItem>
                    <SelectItem value="LARGE_TRUCK">Large Truck</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Route Cards */}
      <div className="flex-1 overflow-hidden">
        <div className="container h-full py-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Loading routes...</p>
              </div>
            </div>
          ) : filteredRoutes.length > 0 ? (
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-6">
                {filteredRoutes.map((route) => (
                  <Card 
                    key={route.id} 
                    className="overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="border-l-4 border-primary p-4">
                      <div className="flex flex-col gap-3">
                        {/* Route Header */}
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{getRouteDescription(route)}</h3>
                            <p className="text-sm text-muted-foreground">
                              {route.fromWarehouse?.name} • {new Date(route.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={
                            route.status === "PENDING" ? "outline" : 
                            route.status === "IN_PROGRESS" ? "secondary" : 
                            "default"
                          }>
                            {route.status.replace('_', ' ')}
                          </Badge>
                        </div>

                        {/* Route Stats */}
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <div className="flex items-center gap-2">
                            <Weight className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{Math.round(route.batch.totalWeight)} kg</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Boxes className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{route.batch.orderCount} orders</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Navigation2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{route.totalDistance.toFixed(1)} km</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{route.estimatedDuration} min</span>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">
                            {batchTypeLabels[route.batch.type] || route.batch.type}
                          </Badge>
                          <Badge variant="outline">
                            {vehicleTypeLabels[route.batch.vehicleType] || route.batch.vehicleType}
                          </Badge>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-between items-center">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedRoute(route);
                              setShowRouteDetails(true);
                            }}
                          >
                            View Details
                          </Button>
                          <Button 
                            size="sm"
                            disabled={route.status !== "PENDING"}
                            onClick={() => handleAcceptRoute(route)}
                          >
                            Accept Route
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No routes available</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  There are currently no available routes matching your criteria.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Route Details Dialog */}
      {selectedRoute && (
        <Dialog open={showRouteDetails} onOpenChange={setShowRouteDetails}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Route Details</DialogTitle>
              <DialogDescription>
                {getRouteDescription(selectedRoute)}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column - Details */}
              <div>
                <h4 className="font-medium mb-2">Delivery Information</h4>
                <Card className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <Badge variant={
                      selectedRoute.status === "PENDING" ? "outline" : 
                      selectedRoute.status === "IN_PROGRESS" ? "secondary" : 
                      "default"
                    }>
                      {selectedRoute.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Batch Type</span>
                    <span className="text-sm">
                      {batchTypeLabels[selectedRoute.batch.type] || selectedRoute.batch.type}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Vehicle Type</span>
                    <span className="text-sm">
                      {vehicleTypeLabels[selectedRoute.batch.vehicleType] || selectedRoute.batch.vehicleType}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Distance</span>
                    <span className="text-sm">{selectedRoute.totalDistance.toFixed(1)} km</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Est. Duration</span>
                    <span className="text-sm">{selectedRoute.estimatedDuration} min</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Orders</span>
                    <span className="text-sm">{selectedRoute.batch.orderCount}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Weight</span>
                    <span className="text-sm">{Math.round(selectedRoute.batch.totalWeight)} kg</span>
                  </div>
                </Card>
              </div>
              
              {/* Right Column - Stops */}
              <div>
                <h4 className="font-medium mb-2">Route Stops</h4>
                <ScrollArea className="h-80">
                  <div className="space-y-3">
                    {selectedRoute.stops.map((stop, index) => (
                      <Card 
                        key={stop.id} 
                        className={cn(
                          "p-3 border-l-4", 
                          stop.isPickup 
                            ? "border-l-blue-400" 
                            : "border-l-green-400",
                          stop.isCompleted && "bg-muted/30"
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex gap-3">
                            {stop.isPickup 
                              ? <Package className="h-5 w-5 text-blue-500" /> 
                              : <MapPin className="h-5 w-5 text-green-500" />}
                            <div>
                              <div className="flex items-center">
                                <span className="font-medium mr-2">Stop {index + 1}</span>
                                <Badge variant="outline" className="text-xs">
                                  {stop.isPickup ? "Pickup" : "Delivery"}
                                </Badge>
                              </div>
                              <p className="text-sm">{stop.address}</p>
                              {stop.orderId && (
                                <p className="text-xs text-muted-foreground">
                                  Order: {stop.orderId.slice(0, 8)}...
                                </p>
                              )}
                            </div>
                          </div>
                          {stop.isCompleted && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline"
                onClick={() => setShowRouteDetails(false)}
              >
                <X className="mr-2 h-4 w-4" />
                Close
              </Button>
              <Button
                disabled={acceptingRoute || selectedRoute.status !== "PENDING"}
                onClick={() => handleAcceptRoute(selectedRoute)}
              >
                {acceptingRoute ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Accept Route
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 