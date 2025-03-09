import { useState, useEffect, useCallback, useRef } from "react";
import { 
   Navigation2, CheckCircle2, 
  RefreshCw, Truck, 
  User, Phone
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// TypeScript interfaces
interface Order {
  id: string;
  status: string;
  customerName: string;
  phone: string;
  totalAmount: number;
  notes?: string;
}

interface Warehouse {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
}

interface RouteStop {
  id: string;
  routeId: string;
  orderId?: string;
  warehouseId?: string;
  latitude: number;
  longitude: number;
  address: string;
  isPickup: boolean;
  isCompleted: boolean;
  completedAt?: string;
  notes?: string;
  sequenceOrder: number;
  createdAt: string;
  updatedAt: string;
  order?: Order;
  warehouse?: Warehouse;
}

interface Batch {
  id: string;
  type: string;
  status: string;
  orderCount: number;
  totalWeight: number;
  totalVolume: number;
  vehicleType: string;
}

interface DeliveryRoute {
  id: string;
  status: string;
  driverId: string;
  batchId?: string;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  startedAt?: string;
  completedAt?: string;
  batch?: Batch;
  stops: RouteStop[];
  fromWarehouse?: Warehouse;
  toWarehouse?: Warehouse;
}

export function ActiveDelivery() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [activeRoute, setActiveRoute] = useState<DeliveryRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<[number, number]>([36.8065, 10.1815]); // Default to Tunis
  const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  
  // Map and marker refs
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const currentLocationMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  
  // Fetch the active route
  const fetchActiveRoute = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/delivery-routes/driver/active');
      setActiveRoute(response.data);
    } catch (error) {
      console.error("Failed to fetch active route:", error);
      toast({
        title: "Error",
        description: "Could not load your active delivery route",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);
  
  // Get current location
  const updateCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ];
          setCurrentLocation(newLocation);
          
          // Update the current location marker if map is initialized
          if (mapRef.current && currentLocationMarkerRef.current) {
            currentLocationMarkerRef.current.setLatLng(newLocation);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);
  
  // Initialize and update map
  useEffect(() => {
    if (!activeRoute || !activeRoute.stops || activeRoute.stops.length === 0) return;
    
    // Create icons
    const createIcon = (color: string, iconUrl: string) => {
      return L.divIcon({
        html: `
          <div class="marker-pin">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="#ffffff" stroke-width="1">
              <path d="M12 0C7.802 0 4 3.403 4 7.602C4 11.8 7.469 16.812 12 24C16.531 16.812 20 11.8 20 7.602C20 3.403 16.199 0 12 0ZM12 11C10.343 11 9 9.657 9 8C9 6.343 10.343 5 12 5C13.657 5 15 6.343 15 8C15 9.657 13.657 11 12 11Z"/>
            </svg>
          </div>
        `,
        className: 'custom-div-icon',
        iconSize: [32, 32] as L.PointExpression,
        iconAnchor: [16, 32] as L.PointExpression,
        popupAnchor: [0, -32] as L.PointExpression
      });
    };
    
    const pickupIcon = createIcon('#f97316', '/icons/pickup.svg'); // Orange
    const deliveryIcon = createIcon('#2563eb', '/icons/delivery.svg'); // Blue
    const warehouseIcon = createIcon('#10b981', '/icons/warehouse.svg'); // Green
    const currentLocationIcon = createIcon('#ef4444', '/icons/current-location.svg'); // Red
    
    // Initialize map if not already initialized
    if (!mapRef.current) {
      mapRef.current = L.map('route-map', {
        center: currentLocation,
        zoom: 13,
        zoomControl: true,
      });
      
      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);
    }
    
    // Clear existing markers
    if (markersRef.current.length > 0) {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    }
    
    // Clear existing polyline
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }
    
    // Add stop markers
    const coordinates: L.LatLngExpression[] = [];
    activeRoute.stops.forEach((stop) => {
      const position: L.LatLngExpression = [stop.latitude, stop.longitude];
      coordinates.push(position);
      
      // Create popup content
      const popupContent = `
        <div class="text-sm">
          <div class="font-bold">${stop.isPickup ? 'Pickup' : 'Delivery'}</div>
          <div>${stop.address}</div>
          ${stop.isCompleted ? '<div class="text-green-600">Completed</div>' : ''}
        </div>
      `;
      
      // Add marker
      const marker = L.marker(position, {
        icon: stop.isPickup ? pickupIcon : deliveryIcon,
        opacity: stop.isCompleted ? 0.6 : 1
      })
        .addTo(mapRef.current!)
        .bindPopup(popupContent);
      
      markersRef.current.push(marker);
    });
    
    // Add warehouse markers if applicable
    if (activeRoute.fromWarehouse) {
      const position: L.LatLngExpression = [
        activeRoute.fromWarehouse.latitude, 
        activeRoute.fromWarehouse.longitude
      ];
      coordinates.push(position);
      
      const marker = L.marker(position, { icon: warehouseIcon })
        .addTo(mapRef.current!)
        .bindPopup(`<div class="font-bold">${activeRoute.fromWarehouse.name}</div><div>Origin Warehouse</div>`);
      
      markersRef.current.push(marker);
    }
    
    if (activeRoute.toWarehouse) {
      const position: L.LatLngExpression = [
        activeRoute.toWarehouse.latitude, 
        activeRoute.toWarehouse.longitude
      ];
      coordinates.push(position);
      
      const marker = L.marker(position, { icon: warehouseIcon })
        .addTo(mapRef.current!)
        .bindPopup(`<div class="font-bold">${activeRoute.toWarehouse.name}</div><div>Destination Warehouse</div>`);
      
      markersRef.current.push(marker);
    }
    
    // Add current location marker
    if (currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current.remove();
    }
    
    currentLocationMarkerRef.current = L.marker(currentLocation, { 
      icon: currentLocationIcon,
      zIndexOffset: 1000 // Show above other markers
    })
      .addTo(mapRef.current!)
      .bindPopup('<div class="font-bold">Your location</div>');
    
    // Add polyline to show route
    if (coordinates.length > 1) {
      polylineRef.current = L.polyline(coordinates, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.7,
        lineJoin: 'round'
      }).addTo(mapRef.current!);
    }
    
    // Add all locations (including current location) to coordinates for bounds
    coordinates.push(currentLocation);
    
    // Fit map to bounds
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates);
      mapRef.current.fitBounds(bounds, { padding: [30, 30] });
    }
    
    // Cleanup when component unmounts
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [activeRoute, currentLocation]);
  
  // Fetch data and set up location updates
  useEffect(() => {
    fetchActiveRoute();
    updateCurrentLocation();
    
    // Update location periodically
    const locationInterval = setInterval(updateCurrentLocation, 60000); // Every minute
    
    return () => clearInterval(locationInterval);
  }, [fetchActiveRoute, updateCurrentLocation]);
  
  const refreshData = () => {
    setRefreshing(true);
    fetchActiveRoute();
    updateCurrentLocation();
  };

  // Start navigation to a stop
  const startNavigation = (stop: RouteStop) => {
    // Open in Google Maps or other map app
    const url = `https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}`;
    window.open(url, '_blank');
  };
  
  // Complete a stop
  const handleCompleteStop = (stop: RouteStop) => {
    setSelectedStop(stop);
    setNotes("");
    setIsCompleteDialogOpen(true);
  };
  
  const completeStop = async () => {
    if (!selectedStop) return;
    
    try {
      await api.patch(`/delivery-routes/stops/${selectedStop.id}/complete`, {
        notes: notes.trim() || undefined
      });
      
      toast({
        title: "Stop completed",
        description: "The stop has been marked as completed",
        variant: "default",
      });
      
      setIsCompleteDialogOpen(false);
      fetchActiveRoute(); // Refresh data
    } catch (error) {
      console.error("Error completing stop:", error);
      toast({
        title: "Error",
        description: "Failed to complete the stop",
        variant: "destructive",
      });
    }
  };
  
  // Filter stops for pending and completed tabs
  const pendingStops = activeRoute?.stops?.filter(stop => !stop.isCompleted) || [];
  const completedStops = activeRoute?.stops?.filter(stop => stop.isCompleted) || [];
  
  if (loading) {
    return (
      <div className="container py-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Loading your active delivery...</p>
      </div>
    );
  }
  
  if (!activeRoute) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Truck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Active Delivery</h2>
            <p className="text-muted-foreground mb-6">
              You don't have any active delivery routes at the moment.
            </p>
            <Button onClick={() => window.location.href = '/driver/available-routes'}>
              Find Available Routes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Active Delivery</h1>
          <p className="text-muted-foreground">Route #{activeRoute.id.slice(-8)}</p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshData} disabled={refreshing}>
          {refreshing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>
      
      {/* Route Details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Route Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge>
                {activeRoute.status}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Type</span>
              <span className="text-sm">{activeRoute.batch?.type}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Stops</span>
              <span className="text-sm">
                {completedStops.length}/{activeRoute.stops.length} completed
              </span>
            </div>
            
            {activeRoute.batch && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Order Count</span>
                  <span className="text-sm">{activeRoute.batch.orderCount}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Weight</span>
                  <span className="text-sm">{activeRoute.batch.totalWeight} kg</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Map and Stops */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Route Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div id="route-map" className="h-[400px] rounded-md overflow-hidden border"></div>
          </CardContent>
        </Card>
        
        {/* Stops */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Stops</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="pending">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="pending">
                  Pending ({pendingStops.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({completedStops.length})
                </TabsTrigger>
              </TabsList>
              
              <ScrollArea className="h-[300px]">
                <TabsContent value="pending" className="m-0">
                  {pendingStops.length === 0 ? (
                    <div className="p-8 text-center">
                      <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">All stops completed!</h3>
                      <p className="text-sm text-muted-foreground">
                        Great job, you've completed all stops on this route.
                      </p>
                    </div>
                  ) : (
                    pendingStops.map((stop, index) => (
                      <div key={stop.id} className="p-4 border-b last:border-0">
                        <div className="flex justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={stop.isPickup ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}>
                                {stop.isPickup ? "Pickup" : "Delivery"}
                              </Badge>
                              {index === 0 && <Badge variant="outline">Next Stop</Badge>}
                            </div>
                            <p className="font-medium">{stop.address}</p>
                            
                            {/* Order details */}
                            {stop.order && (
                              <div className="mt-1 space-y-1 text-sm">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  <span>{stop.order.customerName}</span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  <span>{stop.order.phone}</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex items-start gap-2">
                            <Button size="sm" variant="outline" onClick={() => startNavigation(stop)}>
                              <Navigation2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="default" onClick={() => handleCompleteStop(stop)}>
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
                
                <TabsContent value="completed" className="m-0">
                  {completedStops.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No stops completed yet
                    </div>
                  ) : (
                    completedStops.map((stop) => (
                      <div key={stop.id} className="p-4 border-b last:border-0">
                        <div className="flex items-start">
                          <div className="mt-1 mr-3 flex items-center justify-center rounded-full w-6 h-6 bg-green-100 text-green-800">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{stop.address}</p>
                            {stop.completedAt && (
                              <p className="text-sm text-muted-foreground">
                                Completed: {format(new Date(stop.completedAt), 'MMM d, h:mm a')}
                              </p>
                            )}
                            {stop.notes && (
                              <p className="text-sm mt-1 bg-muted p-2 rounded">
                                {stop.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Complete Stop Dialog */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedStop?.isPickup 
                ? "Confirm Pickup Completion" 
                : "Confirm Delivery Completion"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="mb-4">Are you sure you want to mark this stop as completed?</p>
            <p className="font-medium mb-2">Address:</p>
            <p className="text-muted-foreground mb-4">{selectedStop?.address}</p>
            
            <Textarea
              placeholder="Add notes about this stop (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mb-2"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={completeStop}>
              Confirm Completion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
