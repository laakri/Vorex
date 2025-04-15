import { useState, useEffect, useMemo, useCallback } from "react";
import {
  MapPin,
  Package,
  Filter,
  Navigation2,
  Timer,
  Warehouse,
  Map,
  Weight,
  Search,
  Truck,
  Clock,
  CheckCircle2,
  X,
  RotateCw,
  Route as RouteIcon,
  Calendar,
  Navigation,
  Info,
  Clock3,
  LayoutGrid,
  LayoutList,
  ArrowDown,
  PackageCheck,
  Loader2,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
 
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {  useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth.store";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

// Type definitions
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
  isCompleted: boolean;
  sequenceOrder: number;
  estimatedArrival: string | null;
  estimatedDeparture: string | null;
  actualArrival: string | null;
  actualDeparture: string | null;
}

interface DeliveryRoute {
  id: string;
  batchId: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  driverId: string | null;
  totalDistance: number;
  estimatedDuration: number;
  fromWarehouseId: string | null;
  toWarehouseId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string | number;
  batch: Batch;
  fromWarehouse?: Warehouse;
  toWarehouse?: Warehouse;
  stops: RouteStop[];
  driver?: {
    id: string;
    name: string;
  };
}

// Constants
const vehicleTypeLabels = {
  MOTORCYCLE: "Motorcycle",
  CAR: "Car",
  VAN: "Van", 
  SMALL_TRUCK: "Small Truck",
  LARGE_TRUCK: "Large Truck"
};

const batchTypeLabels = {
  LOCAL_PICKUP: "Local Pickup",
  LOCAL_DELIVERY: "Local Delivery",
  INTERCITY: "Intercity",
  LOCAL_SELLERS_WAREHOUSE: "Seller to Warehouse",
  LOCAL_WAREHOUSE_BUYERS: "Warehouse to Buyer"
};

const statusColors = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
  COMPLETED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

export function DriverAvailableRoutes() {
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<DeliveryRoute | null>(null);
  const [showRouteDetails, setShowRouteDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("distance");
  const [filterVehicle, setFilterVehicle] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [acceptingRouteId, setAcceptingRouteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const { toast } = useToast();
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();
  
  // Fetch available routes
  const fetchRoutes = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const response = await api.get('/delivery-routes/available');
      
      // Ensure we always set an array
      if (Array.isArray(response.data)) {
        setRoutes(response.data);
      } else {
        console.error('Expected array response but got:', response.data);
        setRoutes([]);
        setError("Invalid response format from server");
      }
    } catch (error) {
      console.error('Failed to fetch routes:', error);
      setError("Could not load available routes. Please try again.");
      toast({
        variant: "destructive",
        title: "Error fetching routes",
        description: "Could not load available routes. Please try again.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutes();
    
    // Refresh routes every 30 seconds
    const intervalId = setInterval(() => fetchRoutes(), 30000);
    return () => clearInterval(intervalId);
  }, [fetchRoutes]);

  // Filter and sort routes with memoization
  const filteredRoutes = useMemo(() => {
    return routes
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
          const batchType = batchTypeLabels[route.batch.type]?.toLowerCase() || '';
          
          return (
            fromWarehouse.includes(query) || 
            toWarehouse.includes(query) || 
            addresses.includes(query) ||
            batchType.includes(query) ||
            route.id.toLowerCase().includes(query)
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
        return 0; // Default case
      });
  }, [routes, filterVehicle, activeTab, searchQuery, sortBy]);

  // Update the acceptRoute function to use the user ID directly
  const acceptRoute = async (routeId: string) => {
    try {
      setAcceptingRouteId(routeId);
      
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      
      // Assign the route directly using the route ID
      await api.post(`/delivery-routes/${routeId}/assign`, {
        userId: user.id  // Send user ID instead of driver ID
      });
      
      // Show success message
      toast({
        title: "Route accepted!",
        description: "You've successfully accepted this delivery route.",
        variant: "default",
      });
      
      // Close the route details dialog if it's open
      setShowRouteDetails(false);
      
      // Navigate to the available delivery page
      navigate('/driver/active-delivery');
      
    } catch (err: any) {
      console.error("Error accepting route:", err);
      toast({
        title: "Failed to accept route",
        description: err.response?.data?.message || "An error occurred while accepting the route",
        variant: "destructive",
      });
    } finally {
      setAcceptingRouteId(null);
    }
  };

  // Get descriptive text for route type
  const getRouteDescription = useCallback((route: DeliveryRoute) => {
    // Determine route type description
    if (route.batch.type === 'INTERCITY') {
      return `Intercity: ${route.fromWarehouse?.city || 'Origin'} → ${route.toWarehouse?.city || 'Destination'}`;
    } else if (route.batch.type === 'LOCAL_PICKUP' || route.batch.type === 'LOCAL_SELLERS_WAREHOUSE') {
      return `Pickup: ${route.stops.length - 1} stops → ${route.fromWarehouse?.name || 'Warehouse'}`;
    } else {
      return `Delivery: ${route.fromWarehouse?.name || 'Warehouse'} → ${route.stops.length - 1} stops`;
    }
  }, []);

  // Get total stats for display
  const stats = useMemo(() => {
    const pending = routes.filter(r => r.status === "PENDING").length;
    const inProgress = routes.filter(r => r.status === "IN_PROGRESS").length;
    const avgDuration = Math.round(
      routes.reduce((acc, route) => acc + route.estimatedDuration, 0) / (routes.length || 1)
    );
    const uniqueWarehouses = new Set(
      routes.map(r => r.fromWarehouseId)
        .concat(routes.map(r => r.toWarehouseId).filter(Boolean) as string[])
    ).size;
    
    return { pending, inProgress, avgDuration, uniqueWarehouses };
  }, [routes]);
  
  // Render skeleton loaders during initial load
  const renderSkeletons = () => (
    <div className={cn(
      viewType === "grid" 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
        : "space-y-4"
    )}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} className={cn(
          viewType === "grid" 
            ? "h-[220px] rounded-lg" 
            : "h-[140px] rounded-lg"
        )} />
      ))}
    </div>
  );

  // Function to navigate to order tracking page
  const navigateToOrderTracking = (orderId: string) => {
    navigate(`/track/${orderId}`);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header with Stats */}
      <div className="border-b bg-background-secondary/50 backdrop-blur-sm">
        <div className="container py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Available Routes</h1>
              <p className="text-sm text-muted-foreground">
                {filteredRoutes.length} routes available for your vehicle type
              </p>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchRoutes(true)}
              disabled={refreshing}
              className="w-full sm:w-auto"
            >
              {refreshing ? (
                <>
                  <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RotateCw className="mr-2 h-4 w-4" />
                  Refresh Routes
                </>
              )}
            </Button>
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
                  <p className="text-2xl font-semibold">{stats.pending}</p>
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
                  <p className="text-2xl font-semibold">{stats.inProgress}</p>
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
                    {stats.avgDuration} min
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
                    {stats.uniqueWarehouses}
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
                  placeholder="Search routes, warehouses, addresses..."
                  className="pl-9 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
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
                  <TabsTrigger value="all" className="flex-1">
                    All
                    {activeTab === "all" && routes.length > 0 && (
                      <Badge variant="secondary" className="ml-2">{routes.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="flex-1">
                    Pending
                    {activeTab === "pending" && (
                      <Badge variant="secondary" className="ml-2">
                        {routes.filter(r => r.status === "PENDING").length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="inProgress" className="flex-1">
                    In Progress
                    {activeTab === "inProgress" && (
                      <Badge variant="secondary" className="ml-2">
                        {routes.filter(r => r.status === "IN_PROGRESS").length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="flex-1">
                    Completed
                    {activeTab === "completed" && (
                      <Badge variant="secondary" className="ml-2">
                        {routes.filter(r => r.status === "COMPLETED").length}
                      </Badge>
                    )}
                  </TabsTrigger>
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

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Available Routes</h2>
              
              <div className="flex items-center space-x-2">
                <Tabs value={viewType} onValueChange={(value) => setViewType(value as "grid" | "list")}>
                  <TabsList className="grid w-[160px] grid-cols-2">
                    <TabsTrigger value="grid" className="flex items-center justify-center">
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      Grid
                    </TabsTrigger>
                    <TabsTrigger value="list" className="flex items-center justify-center">
                      <LayoutList className="h-4 w-4 mr-2" />
                      List
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add this wrapper div with overflow-auto */}
      <div className="flex-1 overflow-auto">
        <div className="container py-6">
          {/* View Content */}
          {loading ? (
            renderSkeletons()
          ) : error ? (
            <Card className="p-8 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                <X className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Error Loading Routes</h3>
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
              <Button onClick={() => fetchRoutes(true)} className="mt-4">
                Try Again
              </Button>
            </Card>
          ) : filteredRoutes.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <RouteIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">No routes found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {searchQuery || filterVehicle !== "all" || activeTab !== "all"
                  ? "Try adjusting your filters to see more results"
                  : "There are no available routes at the moment."}
              </p>
              {(searchQuery || filterVehicle !== "all" || activeTab !== "all") && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery("");
                    setFilterVehicle("all");
                    setActiveTab("all");
                  }} 
                  className="mt-6"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className={cn(
              viewType === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
                : "space-y-4"
            )}>
              {filteredRoutes.map((route) => (
                viewType === "grid" ? (
                  <Card key={route.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <Badge 
                              className={cn(
                                "mb-2", 
                                statusColors[route.status]
                              )}
                            >
                              {route.status.replace('_', ' ')}
                            </Badge>
                            <h3 className="font-semibold text-base">{getRouteDescription(route)}</h3>
                          </div>
                          
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
                            <Truck className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-y-2 mt-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Navigation2 className="h-4 w-4 text-muted-foreground" />
                            <span>{route.totalDistance.toFixed(1)} km</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Timer className="h-4 w-4 text-muted-foreground" />
                            <span>{route.estimatedDuration} min</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span>{route.batch.orderCount} orders</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(route.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="p-4 flex justify-between items-center">
                        <Badge variant="outline">
                          {vehicleTypeLabels[route.batch.vehicleType]}
                        </Badge>
                        
                        <Button 
                          size="sm" 
                          onClick={() => {
                            setSelectedRoute(route);
                            setShowRouteDetails(true);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card key={route.id} className={cn(
                    "overflow-hidden",
                    "flex flex-col md:flex-row"
                  )}>
                    <CardContent className={cn(
                      "p-0",
                      "flex flex-col md:flex-1"
                    )}>
                      <div className="p-4 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium">{route.fromWarehouse?.name} Route</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(route.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={
                            route.status === "PENDING" ? "outline" : 
                            route.status === "IN_PROGRESS" ? "secondary" : 
                            "default"
                          }>
                            {route.status}
                          </Badge>
                        </div>
                        
                        <div className="mt-2 space-y-1 flex-1">
                          <div className="text-sm flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="flex-1 truncate">{route.fromWarehouse?.address}</span>
                          </div>
                          {route.toWarehouse && (
                            <div className="text-sm flex items-center gap-2">
                              <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="flex-1 truncate">{route.toWarehouse?.address}</span>
                            </div>
                          )}
                          <div className="text-sm flex items-center gap-2">
                            <PackageCheck className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{route.stops?.length || 0} stops</span>
                          </div>
                          <div className="text-sm flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{Math.round(route.estimatedDuration / 60)} hours</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    
                    <div className={cn(
                      "p-4 flex flex-row gap-2 justify-end items-center border-t",
                      "md:border-t-0 md:border-l"
                    )}>
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
                        variant="default" 
                        size="sm"
                        onClick={() => acceptRoute(route.id)}
                        disabled={!!acceptingRouteId || route.driverId !== null}
                      >
                        {acceptingRouteId === route.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Accepting...
                          </>
                        ) : route.driverId !== null ? (
                          "Already Assigned"
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Accept Route
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                )
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Route Details Dialog */}
      {selectedRoute && (
        <Dialog open={showRouteDetails} onOpenChange={setShowRouteDetails}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden flex flex-col">
            <div className="flex flex-col md:flex-row">
              {/* Left Sidebar */}
              <div className="w-full md:w-1/3 p-6 border-r">
                <div className="space-y-6">
                  {/* Route ID and Status */}
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <RouteIcon className="h-5 w-5" />
                      Route Details
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge 
                        className={cn(
                          "px-2.5 py-0.5 text-xs",
                          selectedRoute.status === "PENDING" ? "bg-secondary text-secondary-foreground" : 
                          selectedRoute.status === "IN_PROGRESS" ? "bg-primary text-primary-foreground" :
                          selectedRoute.status === "COMPLETED" ? "bg-accent text-accent-foreground" : 
                          "bg-destructive text-destructive-foreground"
                        )}
                      >
                        {selectedRoute.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ID: {selectedRoute.id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Key Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Navigation className="h-3.5 w-3.5" />
                        Distance
                      </div>
                      <p className="font-medium">{selectedRoute.totalDistance.toFixed(1)} km</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock3 className="h-3.5 w-3.5" />
                        Duration
                      </div>
                      <p className="font-medium">{selectedRoute.estimatedDuration} min</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Package className="h-3.5 w-3.5" />
                        Orders
                      </div>
                      <p className="font-medium">{selectedRoute.batch.orderCount}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Weight className="h-3.5 w-3.5" />
                        Weight
                      </div>
                      <p className="font-medium">{Math.round(selectedRoute.batch.totalWeight)} kg</p>
                    </div>
                  </div>
                  
                  <Separator />

                  {/* Vehicle */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Truck className="h-3.5 w-3.5" />
                      Vehicle Type
                    </div>
                    <Badge variant="outline" className="w-full justify-center">
                      {vehicleTypeLabels[selectedRoute.batch.vehicleType] || selectedRoute.batch.vehicleType}
                    </Badge>
                  </div>
                  
                  {/* Batch Type */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Info className="h-3.5 w-3.5" />
                      Batch Type
                    </div>
                    <Badge variant="secondary" className="w-full justify-center">
                      {batchTypeLabels[selectedRoute.batch.type] || selectedRoute.batch.type}
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  {/* Created At */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      Created
                    </div>
                    <p className="font-medium">
                      {typeof selectedRoute.createdAt === 'string' 
                        ? format(new Date(selectedRoute.createdAt), 'MMM d, yyyy · h:mm a')
                        : format(new Date(selectedRoute.createdAt), 'MMM d, yyyy · h:mm a')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 max-h-[80vh] overflow-hidden flex flex-col">
                {/* Location Header */}
                <div className="p-6 border-b">
                  <div className="space-y-4">
                    {/* From/To Header */}
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-1.5">
                        <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center">
                          <Warehouse className="h-3.5 w-3.5 text-secondary-foreground" />
                        </div>
                        <span className="font-medium">Origin</span>
                      </div>
                      
                      <div className="flex-1 h-0.5 border-t border-dashed border-muted mx-2"></div>
                      
                      <div className="flex items-center gap-1.5">
                        <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                          <MapPin className="h-3.5 w-3.5 text-primary-foreground" />
                        </div>
                        <span className="font-medium">Destination</span>
                      </div>
                    </div>

                    {/* Warehouse Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-secondary/20 rounded-lg">
                        <p className="font-medium">{selectedRoute.fromWarehouse?.name || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedRoute.fromWarehouse?.address || 'No address available'}
                        </p>
                      </div>
                      
                      {selectedRoute.toWarehouse ? (
                        <div className="p-3 bg-primary/20 rounded-lg">
                          <p className="font-medium">{selectedRoute.toWarehouse.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {selectedRoute.toWarehouse.address}
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-primary/20 rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                          Multiple destinations
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Route Stops */}
                <div className="flex-1 overflow-hidden">
                  <div className="p-4 border-b bg-muted">
                    <h4 className="font-medium flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Route Stops ({selectedRoute.stops.length})
                    </h4>
                  </div>
                  
                  <ScrollArea className="h-[calc(80vh-13rem)]">
                    <div className="p-4">
                      <div className="relative pl-6 border-l border-muted space-y-0">
                        {selectedRoute.stops.map((stop, index) => (
                          <div key={stop.id} className="mb-5 last:mb-0">
                            {/* Timeline Node */}
                            <div 
                              className={cn(
                                "absolute left-0 w-6 h-6 -translate-x-3 rounded-full flex items-center justify-center",
                                stop.isPickup 
                                  ? "bg-secondary" 
                                  : "bg-primary",
                                stop.isCompleted && "ring-2 ring-offset-2 ring-muted"
                              )}
                            >
                              {stop.isPickup 
                                ? <Package className={cn("h-3 w-3", stop.isCompleted ? "text-secondary-foreground" : "text-secondary-foreground")} /> 
                                : <MapPin className={cn("h-3 w-3", stop.isCompleted ? "text-primary-foreground" : "text-primary-foreground")} />}
                            </div>
                            
                            {/* Stop Card */}
                            <div className="ml-5">
                              <Card className={cn(
                                "p-4 border", 
                                stop.isCompleted ? "bg-muted" : "bg-card"
                              )}>
                                {/* Header */}
                                <div className="flex justify-between mb-2">
                                  <div className="flex items-center">
                                    <span className="font-medium mr-2">Stop {index + 1}</span>
                                    <Badge 
                                      variant="outline" 
                                      className={cn(
                                        "text-xs",
                                        stop.isPickup 
                                          ? "text-secondary-foreground bg-secondary/20 border-secondary"
                                          : "text-primary-foreground bg-primary/20 border-primary"
                                      )}
                                    >
                                      {stop.isPickup ? "Pickup" : "Delivery"}
                                    </Badge>
                                  </div>
                                  
                                  {stop.isCompleted && (
                                    <Badge variant="outline" className="text-xs bg-accent text-accent-foreground border-accent">
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Completed
                                    </Badge>
                                  )}
                                </div>
                                
                                {/* Address */}
                                <p className="text-sm mb-2">{stop.address}</p>
                                
                                {/* Additional Details */}
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                  {stop.orderId && (
                                    <div className="flex items-center">
                                      <Package className="h-3 w-3 mr-1" />
                                      Order: {stop.orderId.slice(0, 8)}...
                                    </div>
                                  )}
                                  
                                  {stop.estimatedArrival && (
                                    <div className="flex items-center">
                                      <Clock3 className="h-3 w-3 mr-1" />
                                      Est. arrival: {format(new Date(stop.estimatedArrival), 'h:mm a')}
                                    </div>
                                  )}
                                </div>
                                
                                {/* Order Details Button */}
                                {stop.orderId && (
                                  <div className="mt-3 flex justify-end">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-xs"
                                      onClick={() => navigateToOrderTracking(stop.orderId!)}
                                    >
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      View Order Details
                                    </Button>
                                  </div>
                                )}
                              </Card>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
            
            {/* Footer Actions */}
            <div className="p-4 border-t flex justify-between items-center bg-muted">
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => setShowRouteDetails(false)}
              >
                <X className="mr-2 h-4 w-4" />
                Close
              </Button>
              
              {/* Add Accept Route button */}
              {selectedRoute.status === "PENDING" && !selectedRoute.driverId && (
                <Button
                  variant="default"
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => acceptRoute(selectedRoute.id)}
                  disabled={acceptingRouteId === selectedRoute.id}
                >
                  {acceptingRouteId === selectedRoute.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Accepting Route...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Accept Route
                    </>
                  )}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 