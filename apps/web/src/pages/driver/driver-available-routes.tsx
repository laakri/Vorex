import { useState } from "react";
import {
  MapPin,
  Package,
  Filter,
  Navigation2,
  Timer,
  Warehouse,
  Map,
  Calendar,
  Weight,
  Boxes,
  Search,
  ChevronDown,
  Truck,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Types based on schema.prisma
interface DeliveryRoute {
  id: string;
  fromWarehouseId: string;
  fromWarehouse: {
    name: string;
    address: string;
    city: string;
    governorate: string;
    currentLoad: number;
    capacity: number;
  };
  toAddress: string;
  toCity: string;
  toGovernorate: string;
  distance: number;
  estimatedTime: number;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  batch: {
    id: string;
    type: "LOCAL_PICKUP" | "LOCAL_DELIVERY" | "INTERCITY";
    status: "COLLECTING" | "READY" | "PROCESSING" | "COMPLETED" | "CANCELLED";
    totalWeight: number;
    totalVolume: number;
    orderCount: number;
    vehicleType: "MOTORCYCLE" | "CAR" | "VAN" | "SMALL_TRUCK" | "LARGE_TRUCK";
    scheduledTime: string;
    orders: {
      id: string;
      customerName: string;
      address: string;
      totalAmount: number;
      isLocalDelivery: boolean;
    }[];
  };
}

export function DriverAvailableRoutes() {
  const [selectedRoute, setSelectedRoute] = useState<DeliveryRoute | null>(null);
  const [showRouteDetails, setShowRouteDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("distance");
  const [filterVehicle, setFilterVehicle] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data based on schema structure
  const routes: DeliveryRoute[] = [
    {
      id: "1",
      fromWarehouseId: "wh1",
      fromWarehouse: {
        name: "Central Warehouse",
        address: "123 Logistics Ave",
        city: "Cairo",
        governorate: "Cairo",
        currentLoad: 75,
        capacity: 100,
      },
      toAddress: "789 Customer St",
      toCity: "Alexandria",
      toGovernorate: "Alexandria",
      distance: 15.5,
      estimatedTime: 45,
      status: "PENDING",
      batch: {
        id: "b1",
        type: "LOCAL_DELIVERY",
        status: "READY",
        totalWeight: 450.5,
        totalVolume: 3.2,
        orderCount: 8,
        vehicleType: "VAN",
        scheduledTime: "2024-03-20T09:00:00Z",
        orders: [
          {
            id: "o1",
            customerName: "John Doe",
            address: "789 Customer St",
            totalAmount: 150.00,
            isLocalDelivery: true,
          },
          // Add more orders...
        ],
      },
    },
    // Add more routes with varied data...
  ];

  const handleAcceptRoute = (route: DeliveryRoute) => {
    // TODO: Implement route acceptance logic
    console.log("Accepting route:", route.id);
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
                {routes.length} routes available for your vehicle type
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
                  <p className="text-2xl font-semibold">{routes.length}</p>
                </div>
              </div>
            </Card>
            {/* Add more stat cards */}
          </div>

          {/* Enhanced Filter Section - Mobile Responsive */}
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

            {/* Filters Row */}
            <div className="flex flex-wrap gap-2">
              <Select value={filterVehicle} onValueChange={setFilterVehicle}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Vehicle Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  <SelectItem value="MOTORCYCLE">Motorcycle</SelectItem>
                  <SelectItem value="CAR">Car</SelectItem>
                  <SelectItem value="VAN">Van</SelectItem>
                  <SelectItem value="SMALL_TRUCK">Small Truck</SelectItem>
                  <SelectItem value="LARGE_TRUCK">Large Truck</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distance">Distance</SelectItem>
                  <SelectItem value="time">Estimated Time</SelectItem>
                  <SelectItem value="orders">Number of Orders</SelectItem>
                  <SelectItem value="weight">Total Weight</SelectItem>
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto gap-2">
                    <Filter className="h-4 w-4" />
                    More Filters
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuItem>Batch Type</DropdownMenuItem>
                  <DropdownMenuItem>Route Status</DropdownMenuItem>
                  <DropdownMenuItem>Distance Range</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Route Type Tabs - Mobile Responsive */}
          <div className="border-b overflow-x-auto">
            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="all" className="flex-1 sm:flex-none">All Routes</TabsTrigger>
                <TabsTrigger value="local" className="flex-1 sm:flex-none">Local Delivery</TabsTrigger>
                <TabsTrigger value="pickup" className="flex-1 sm:flex-none">Local Pickup</TabsTrigger>
                <TabsTrigger value="intercity" className="flex-1 sm:flex-none">Intercity</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Routes List - Mobile Responsive */}
      <ScrollArea className="flex-1">
        <div className="container py-4 space-y-4">
          {routes.map((route) => (
            <Card
              key={route.id}
              className="p-4 hover:bg-muted/50 transition-colors"
            >
              {/* Route Content - Mobile Responsive */}
              <div className="space-y-4">
                {/* Header with Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize",
                        route.batch.type === "LOCAL_DELIVERY" && "border-blue-500/20 text-blue-500",
                        route.batch.type === "LOCAL_PICKUP" && "border-green-500/20 text-green-500",
                        route.batch.type === "INTERCITY" && "border-amber-500/20 text-amber-500"
                      )}
                    >
                      {route.batch.type.replace("_", " ").toLowerCase()}
                    </Badge>
                    <Badge variant="secondary">
                      {route.batch.orderCount} Orders
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-none gap-2"
                      onClick={() => {
                        setSelectedRoute(route);
                        setShowRouteDetails(true);
                      }}
                    >
                      <Package className="h-4 w-4" />
                      <span>Details</span>
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 sm:flex-none gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcceptRoute(route);
                      }}
                    >
                      <Navigation2 className="h-4 w-4" />
                      <span>Accept</span>
                    </Button>
                  </div>
                </div>

                {/* Route Information Grid - Mobile Responsive */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Origin */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Warehouse className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {route.fromWarehouse.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {route.fromWarehouse.city}
                      </span>
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Navigation2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Destination</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {route.toCity}
                      </span>
                    </div>
                  </div>

                  {/* Route Details */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{route.estimatedTime} mins</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Weight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{route.batch.totalWeight} kg</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {new Date(route.batch.scheduledTime).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional Info - Mobile Responsive */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-t pt-4">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    <span>{route.batch.vehicleType.replace("_", " ")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Boxes className="h-4 w-4" />
                    <span>{route.batch.totalVolume} m³</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{route.distance} km</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Route Details Dialog */}
      <Dialog open={showRouteDetails} onOpenChange={setShowRouteDetails}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedRoute && (
            <>
              <DialogHeader>
                <DialogTitle>Route Details</DialogTitle>
                <DialogDescription>
                  Review complete route information before accepting
                </DialogDescription>
              </DialogHeader>
              {/* ... existing dialog content ... */}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRouteDetails(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    handleAcceptRoute(selectedRoute);
                    setShowRouteDetails(false);
                  }}
                >
                  Accept Route
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 