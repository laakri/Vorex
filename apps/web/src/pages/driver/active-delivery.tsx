"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Navigation2,
  CheckCircle2,
  RefreshCw,
  Truck,
  User,
  Phone,
  MapPin,
  Clock,
  Package,
  Info,
  ArrowRight,
  Calendar,
  MoreHorizontal,
  ChevronRight,
  Clipboard,
  Menu,
  Hash,
  ClipboardList,
} from "lucide-react"
import { useAuthStore } from "@/stores/auth.store"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/axios"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// TypeScript interfaces
interface Order {
  id: string
  status: string
  customerName: string
  phone: string
  totalAmount: number
  notes?: string
}

interface Warehouse {
  id: string
  name: string
  latitude: number
  longitude: number
  address: string
}

interface RouteStop {
  id: string
  routeId: string
  orderId?: string
  warehouseId?: string
  latitude: number
  longitude: number
  address: string
  isPickup: boolean
  isCompleted: boolean
  completedAt?: string
  notes?: string
  sequenceOrder: number
  createdAt: string
  updatedAt: string
  order?: Order
  warehouse?: Warehouse
}

interface Batch {
  id: string
  type: string
  status: string
  orderCount: number
  totalWeight: number
  totalVolume: number
  vehicleType: string
}

interface DeliveryRoute {
  id: string
  status: string
  driverId: string
  batchId?: string
  fromWarehouseId?: string
  toWarehouseId?: string
  startedAt?: string
  completedAt?: string
  batch?: Batch
  stops: RouteStop[]
  fromWarehouse?: Warehouse
  toWarehouse?: Warehouse
}

export function ActiveDelivery() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [activeRoute, setActiveRoute] = useState<DeliveryRoute | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentLocation, setCurrentLocation] = useState<[number, number]>([36.8065, 10.1815]) // Default to Tunis
  const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null)
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false)
  const [notes, setNotes] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  // Map and marker refs
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const currentLocationMarkerRef = useRef<L.Marker | null>(null)
  const polylineRef = useRef<L.Polyline | null>(null)

  // Fetch the active route
  const fetchActiveRoute = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get("/delivery-routes/driver/active")
      setActiveRoute(response.data)
    } catch (error) {
      console.error("Failed to fetch active route:", error)
      toast({
        title: "Error",
        description: "Could not load your active delivery route",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [toast])

  // Get current location
  const updateCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation: [number, number] = [position.coords.latitude, position.coords.longitude]
          setCurrentLocation(newLocation)

          // Update the current location marker if map is initialized
          if (mapRef.current && currentLocationMarkerRef.current) {
            currentLocationMarkerRef.current.setLatLng(newLocation)
          }
        },
        (error) => {
          console.error("Error getting location:", error)
        },
      )
    }
  }, [])

  // Initialize and update map
  useEffect(() => {
    if (!activeRoute || !activeRoute.stops || activeRoute.stops.length === 0) return

    // Create icons
    const createIcon = (color: string, iconUrl: string) => {
      return L.divIcon({
        html: `
          <div class="marker-pin" style="background-color: ${color}; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              ${
                iconUrl.includes("pickup")
                  ? '<polyline points="17 11 12 6 7 11"></polyline><polyline points="12 18 12 6"></polyline>'
                  : iconUrl.includes("delivery")
                    ? '<polyline points="7 13 12 18 17 13"></polyline><polyline points="12 18 12 6"></polyline>'
                    : iconUrl.includes("warehouse")
                      ? '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>'
                      : '<circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle>'
              }
            </svg>
          </div>
        `,
        className: "custom-div-icon",
        iconSize: [30, 30] as L.PointExpression,
        iconAnchor: [15, 15] as L.PointExpression,
        popupAnchor: [0, -15] as L.PointExpression,
      })
    }

    const pickupIcon = createIcon("#f97316", "/icons/pickup.svg") // Orange
    const deliveryIcon = createIcon("#0284c7", "/icons/delivery.svg") // Blue
    const warehouseIcon = createIcon("#10b981", "/icons/warehouse.svg") // Green
    const currentLocationIcon = createIcon("#ef4444", "/icons/current-location.svg") // Red

    // Initialize map if not already initialized
    if (!mapRef.current) {
      mapRef.current = L.map("route-map", {
        center: currentLocation,
        zoom: 13,
        zoomControl: true,
      })

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current)
      
      // Set the map container's z-index to a lower value
      const mapContainer = document.getElementById("route-map");
      if (mapContainer) {
        mapContainer.style.zIndex = "0";
      }
    }

    // Clear existing markers
    if (markersRef.current.length > 0) {
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
    }

    // Clear existing polyline
    if (polylineRef.current) {
      polylineRef.current.remove()
      polylineRef.current = null
    }

    // Add stop markers
    const coordinates: L.LatLngExpression[] = []
    activeRoute.stops.forEach((stop) => {
      const position: L.LatLngExpression = [stop.latitude, stop.longitude]
      coordinates.push(position)

      // Create popup content
      const popupContent = `
        <div class="text-sm p-1">
          <div class="font-bold">${stop.isPickup ? "Pickup" : "Delivery"}</div>
          <div>${stop.address}</div>
          ${stop.isCompleted ? '<div class="text-green-600 font-medium">✓ Completed</div>' : ""}
          ${
            stop.order
              ? `<div class="mt-1 pt-1 border-t border-gray-200">
                  <div class="font-medium">${stop.order.customerName}</div>
                  <div>${stop.order.phone}</div>
                </div>`
              : ""
          }
        </div>
      `

      // Add marker
      const marker = L.marker(position, {
        icon: stop.isPickup ? pickupIcon : deliveryIcon,
        opacity: stop.isCompleted ? 0.6 : 1,
      })
        .addTo(mapRef.current!)
        .bindPopup(popupContent)

      markersRef.current.push(marker)
    })

    // Add warehouse markers if applicable
    if (activeRoute.fromWarehouse) {
      const position: L.LatLngExpression = [activeRoute.fromWarehouse.latitude, activeRoute.fromWarehouse.longitude]
      coordinates.push(position)

      const marker = L.marker(position, { icon: warehouseIcon })
        .addTo(mapRef.current!)
        .bindPopup(`<div class="font-bold">${activeRoute.fromWarehouse.name}</div><div>Origin Warehouse</div>`)

      markersRef.current.push(marker)
    }

    if (activeRoute.toWarehouse) {
      const position: L.LatLngExpression = [activeRoute.toWarehouse.latitude, activeRoute.toWarehouse.longitude]
      coordinates.push(position)

      const marker = L.marker(position, { icon: warehouseIcon })
        .addTo(mapRef.current!)
        .bindPopup(`<div class="font-bold">${activeRoute.toWarehouse.name}</div><div>Destination Warehouse</div>`)

      markersRef.current.push(marker)
    }

    // Add current location marker
    if (currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current.remove()
    }

    currentLocationMarkerRef.current = L.marker(currentLocation, {
      icon: currentLocationIcon,
      zIndexOffset: 1000, // Show above other markers
    })
      .addTo(mapRef.current!)
      .bindPopup('<div class="font-bold">Your location</div>')

    // Add polyline to show route
    if (coordinates.length > 1) {
      polylineRef.current = L.polyline(coordinates, {
        color: "#0284c7",
        weight: 4,
        opacity: 0.7,
        lineJoin: "round",
        dashArray: "5, 10",
      }).addTo(mapRef.current!)
    }

    // Add all locations (including current location) to coordinates for bounds
    coordinates.push(currentLocation)

    // Fit map to bounds
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates)
      mapRef.current.fitBounds(bounds, { padding: [30, 30] })
    }

    // Cleanup when component unmounts
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [activeRoute, currentLocation])

  // Fetch data and set up location updates
  useEffect(() => {
    fetchActiveRoute()
    updateCurrentLocation()

    // Update location periodically
    const locationInterval = setInterval(updateCurrentLocation, 60000) // Every minute

    return () => clearInterval(locationInterval)
  }, [fetchActiveRoute, updateCurrentLocation])

  const refreshData = () => {
    setRefreshing(true)
    fetchActiveRoute()
    updateCurrentLocation()
  }

  // Start navigation to a stop
  const startNavigation = (stop: RouteStop) => {
    // Open in Google Maps or other map app
    const url = `https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}`
    window.open(url, "_blank")
  }

  // Complete a stop
  const handleCompleteStop = (stop: RouteStop) => {
    setSelectedStop(stop)
    setNotes("")
    setIsCompleteDialogOpen(true)
  }

  const completeStop = async () => {
    if (!selectedStop) return

    try {
      await api.patch(`/delivery-routes/stops/${selectedStop.id}/complete`, {
        notes: notes.trim() || undefined,
      })

      toast({
        title: "Stop completed",
        description: "The stop has been marked as completed",
        variant: "default",
      })

      setIsCompleteDialogOpen(false)
      fetchActiveRoute() // Refresh data
    } catch (error) {
      console.error("Error completing stop:", error)
      toast({
        title: "Error",
        description: "Failed to complete the stop",
        variant: "destructive",
      })
    }
  }

  // Filter stops for pending and completed tabs
  const pendingStops = activeRoute?.stops?.filter((stop) => !stop.isCompleted) || []
  const completedStops = activeRoute?.stops?.filter((stop) => stop.isCompleted) || []

  // Calculate progress percentage
  const progressPercentage = activeRoute?.stops?.length
    ? Math.round((completedStops.length / activeRoute.stops.length) * 100)
    : 0

  // Get next stop
  const nextStop = pendingStops.length > 0 ? pendingStops[0] : null

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-primary/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-6 text-lg font-medium text-muted-foreground">Loading your active delivery...</p>
      </div>
    )
  }

  if (!activeRoute) {
    return (
      <div className="container max-w-5xl py-12">
        <Card className="border-dashed bg-gradient-to-b from-background to-muted/30">
          <CardContent className="py-16 text-center">
            <div className="rounded-full bg-primary/10 w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Truck className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-3">No Active Delivery</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              You don't have any active delivery routes at the moment. Check available routes to start a new delivery.
            </p>
            <Button onClick={() => (window.location.href = "/driver/available-routes")} size="lg" className="px-8">
              Find Available Routes
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Determine route status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "in_progress":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "completed":
        return "bg-green-50 text-green-700 border-green-200"
      case "delayed":
        return "bg-amber-50 text-amber-700 border-amber-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-10 bg-background border-b border-border/40 shadow-sm">
        <div className="container py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-semibold">Active Delivery</h1>
              <div className="text-xs text-muted-foreground">Route #{activeRoute.id.slice(-8)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={refreshData} disabled={refreshing}>
                    <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    <span className="sr-only">Refresh</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh data</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="container pb-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="map">Map</TabsTrigger>
              <TabsTrigger value="stops">Stops</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Mobile Content */}
      <div className="lg:hidden overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="overview" className="mt-0">
            <div className="space-y-4 container py-4">
              {/* Progress Card */}
              <Card className="bg-gradient-to-br from-background to-muted/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">Delivery Progress</h3>
                      <p className="text-muted-foreground text-sm">
                        {completedStops.length} of {activeRoute.stops.length} stops completed
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center border-4 border-primary/20 relative">
                        <div
                          className="absolute inset-0 rounded-full border-4 border-primary border-r-transparent border-b-transparent border-l-transparent"
                          style={{ transform: `rotate(${progressPercentage * 3.6}deg)` }}
                        ></div>
                        <span className="text-lg font-bold">{progressPercentage}%</span>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="grid grid-cols-2 gap-4">
                    {/* From/To */}
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Route Type</div>
                      <div className="font-medium flex items-center gap-1">
                        {activeRoute.fromWarehouse && <span>{activeRoute.fromWarehouse.name}</span>}
                        {activeRoute.fromWarehouse && activeRoute.toWarehouse && (
                          <ArrowRight className="h-3 w-3 mx-1" />
                        )}
                        {activeRoute.toWarehouse && <span>{activeRoute.toWarehouse.name}</span>}
                        {!activeRoute.fromWarehouse && !activeRoute.toWarehouse && <span>Local Delivery</span>}
                      </div>
                    </div>

                    {/* Order Count */}
                    {activeRoute.batch && (
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Orders</div>
                        <div className="font-medium flex items-center gap-1">
                          <Package className="h-4 w-4 mr-1" />
                          {activeRoute.batch.orderCount} {activeRoute.batch.orderCount === 1 ? "order" : "orders"}
                        </div>
                      </div>
                    )}

                    {/* Weight */}
                    {activeRoute.batch && (
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Total Weight</div>
                        <div className="font-medium">{activeRoute.batch.totalWeight} kg</div>
                      </div>
                    )}

                    {/* Started At */}
                    {activeRoute.startedAt && (
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Started</div>
                        <div className="font-medium flex items-center gap-1">
                          <Clock className="h-4 w-4 mr-1" />
                          {format(new Date(activeRoute.startedAt), "h:mm a")}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Next Stop Card */}
              {nextStop && (
                <Card className="border-2 border-primary/20 overflow-hidden">
                  <div className="bg-primary/5 px-4 py-2 border-b border-primary/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 rounded-full p-1">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="font-semibold">Next Stop</h3>
                      </div>
                      <Badge
                        variant="outline"
                        className={nextStop.isPickup ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}
                      >
                        {nextStop.isPickup ? "Pickup" : "Delivery"}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      <div>
                        <div className="font-medium text-lg">{nextStop.address}</div>
                        {nextStop.order && (
                          <div className="mt-3 space-y-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 border">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {nextStop.order.customerName.charAt(0)}
                                </AvatarFallback>
                                <AvatarImage
                                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${nextStop.order.customerName}`}
                                />
                              </Avatar>
                              <div>
                                <div className="font-medium">{nextStop.order.customerName}</div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  <span>{nextStop.order.phone}</span>
                                </div>
                              </div>
                            </div>
                            {nextStop.order.notes && (
                              <div className="flex items-start gap-2 text-sm bg-muted/50 p-3 rounded-lg">
                                <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <span className="text-muted-foreground">{nextStop.order.notes}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={() => startNavigation(nextStop)} className="flex-1">
                          <Navigation2 className="h-4 w-4 mr-2" />
                          Navigate
                        </Button>
                        <Button onClick={() => handleCompleteStop(nextStop)} variant="secondary" className="flex-1">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Complete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="map" className="mt-0">
            <div className="container py-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Navigation2 className="h-5 w-5 text-primary" />
                    Route Map
                  </CardTitle>
                  <CardDescription>View all stops and your current location</CardDescription>
                </CardHeader>
                <CardContent>
                  <div id="route-map" className="h-[450px] rounded-md overflow-hidden border" style={{ zIndex: 1 }}></div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stops" className="mt-0">
            <div className="container py-4">
              <Card className="border shadow-sm overflow-hidden">
                <CardHeader className="pb-3 bg-gradient-to-r from-background to-muted/30 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="bg-primary/10 p-1.5 rounded-full">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      Route Stops
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-muted-foreground">Completion:</div>
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                      <Badge variant="outline" className="font-normal">
                        {progressPercentage}%
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="mt-1">
                    {completedStops.length} of {activeRoute.stops.length} stops completed on this route
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs defaultValue="pending" className="w-full">
                    <TabsList className="w-full grid grid-cols-2 rounded-none border-b bg-muted/20">
                      <TabsTrigger
                        value="pending"
                        className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-background"
                      >
                        <div className="flex items-center gap-2">
                          <div className="size-2.5 rounded-full bg-blue-500"></div>
                          <span className="font-medium">Pending</span>
                          <Badge variant="secondary" className="ml-1 bg-blue-50 text-blue-700 border-blue-200">
                            {pendingStops.length}
                          </Badge>
                        </div>
                      </TabsTrigger>
                      <TabsTrigger
                        value="completed"
                        className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-background"
                      >
                        <div className="flex items-center gap-2">
                          <div className="size-2.5 rounded-full bg-green-500"></div>
                          <span className="font-medium">Completed</span>
                          <Badge variant="secondary" className="ml-1 bg-green-50 text-green-700 border-green-200">
                            {completedStops.length}
                          </Badge>
                        </div>
                      </TabsTrigger>
                    </TabsList>

                    <ScrollArea className="h-[350px]">
                      <TabsContent value="pending" className="m-0 p-0">
                        {pendingStops.length === 0 ? (
                          <div className="p-8 text-center">
                            <div className="rounded-full bg-green-50 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                              <CheckCircle2 className="h-8 w-8 text-green-500" />
                            </div>
                            <h3 className="text-lg font-medium">All stops completed!</h3>
                            <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                              Great job, you've completed all stops on this route.
                            </p>
                          </div>
                        ) : (
                          <div className="divide-y">
                            {pendingStops.map((stop, index) => (
                              <div key={stop.id} className="hover:bg-muted/20 transition-colors">
                                <div className="p-4">
                                  <div className="flex justify-between">
                                    <div className="space-y-2 flex-1 mr-3">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge
                                          variant="outline"
                                          className={
                                            stop.isPickup
                                              ? "bg-amber-50 text-amber-700 border-amber-200"
                                              : "bg-blue-50 text-blue-700 border-blue-200"
                                          }
                                        >
                                          {stop.isPickup ? "Pickup" : "Delivery"}
                                        </Badge>
                                        {index === 0 && (
                                          <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                                            Next Stop
                                          </Badge>
                                        )}
                                        <div className="text-xs text-muted-foreground flex items-center">
                                          <Hash className="h-3 w-3 mr-0.5" />
                                          Stop {stop.sequenceOrder}
                                        </div>
                                      </div>
                                      <p className="font-medium flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                        {stop.address}
                                      </p>

                                      {/* Order details */}
                                      {stop.order && (
                                        <div className="mt-2 pt-2 border-t border-dashed border-border/60">
                                          <div className="flex items-center gap-2">
                                            <Avatar className="h-7 w-7 border">
                                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                {stop.order.customerName.charAt(0)}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div>
                                              <div className="font-medium text-sm">{stop.order.customerName}</div>
                                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Phone className="h-3 w-3" />
                                                <span>{stop.order.phone}</span>
                                              </div>
                                            </div>
                                          </div>
                                          {stop.order.notes && (
                                            <div className="flex items-start gap-1.5 text-xs bg-muted/50 p-2 rounded-md mt-2 border border-border/30">
                                              <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                              <span className="text-muted-foreground">{stop.order.notes}</span>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                      <div className="flex items-center gap-2">
                                        <Button
                                          size="icon"
                                          variant="outline"
                                          onClick={() => startNavigation(stop)}
                                          className="h-8 w-8 rounded-full"
                                        >
                                          <Navigation2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="default"
                                          onClick={() => handleCompleteStop(stop)}
                                          className="h-8 w-8 rounded-full"
                                        >
                                          <CheckCircle2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="completed" className="m-0 p-0">
                        {completedStops.length === 0 ? (
                          <div className="p-8 text-center">
                            <div className="rounded-full bg-muted w-16 h-16 flex items-center justify-center mx-auto mb-4">
                              <ClipboardList className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground">No stops completed yet</p>
                          </div>
                        ) : (
                          <div className="divide-y">
                            {completedStops.map((stop) => (
                              <div key={stop.id} className="hover:bg-muted/20 transition-colors">
                                <div className="p-4">
                                  <div className="flex items-start gap-3">
                                    <div className="mt-1 flex items-center justify-center rounded-full w-6 h-6 bg-green-100 text-green-600 flex-shrink-0">
                                      <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <div className="space-y-1.5 flex-1">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <p className="font-medium">{stop.address}</p>
                                          <div className="text-xs text-muted-foreground flex items-center">
                                            <Hash className="h-3 w-3 mr-0.5" />
                                            {stop.sequenceOrder}
                                          </div>
                                        </div>
                                        <Badge 
                                          variant="outline" 
                                          className={stop.isPickup 
                                            ? "bg-amber-50/50 text-amber-700 border-amber-200" 
                                            : "bg-blue-50/50 text-blue-700 border-blue-200"
                                          }
                                        >
                                          {stop.isPickup ? "Pickup" : "Delivery"}
                                        </Badge>
                                      </div>
                                      
                                      {stop.completedAt && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                                          <Clock className="h-3.5 w-3.5" />
                                          Completed {format(new Date(stop.completedAt), "MMM d, h:mm a")}
                                        </p>
                                      )}
                                      
                                      {stop.order && (
                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                                          <User className="h-3.5 w-3.5" />
                                          <span>{stop.order.customerName}</span>
                                        </div>
                                      )}
                                      
                                      {stop.notes && (
                                        <div className="text-sm mt-2 bg-muted/70 p-2.5 rounded-md border border-border/30">
                                          <p className="text-xs font-medium mb-1">Notes:</p>
                                          <p className="text-sm text-muted-foreground">{stop.notes}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </TabsContent>
                    </ScrollArea>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block overflow-auto">
        <div className="container max-w-7xl py-6 lg:py-8">
          {/* Desktop Header */}
          <div className="hidden lg:flex lg:items-center lg:justify-between mb-8">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">Active Delivery</h1>
                <Badge
                  variant="outline"
                  className={`ml-2 px-3 py-1 text-sm font-medium ${getStatusColor(activeRoute.status)}`}
                >
                  {activeRoute.status.replace("_", " ")}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <span className="text-sm">Route #{activeRoute.id.slice(-8)}</span>
                {activeRoute.batch?.type && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm">{activeRoute.batch.type}</span>
                  </>
                )}
                {activeRoute.startedAt && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(activeRoute.startedAt), "MMM d, yyyy")}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={refreshData} disabled={refreshing}>
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Actions
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => (window.location.href = "/driver/dashboard")}>
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => (window.location.href = "/driver/history")}>
                    <Clock className="mr-2 h-4 w-4" />
                    Delivery History
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column */}
            <div className="col-span-8 space-y-6">
              {/* Progress Card */}
              <Card className="bg-gradient-to-br from-background to-muted/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-xl">Delivery Progress</h3>
                      <p className="text-muted-foreground">
                        {completedStops.length} of {activeRoute.stops.length} stops completed
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Progress value={progressPercentage} className="w-48 h-3" />
                      <span className="text-lg font-medium">{progressPercentage}%</span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="grid grid-cols-4 gap-6">
                    {/* From/To */}
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Route Type</div>
                      <div className="font-medium flex items-center gap-1">
                        {activeRoute.fromWarehouse && <span>{activeRoute.fromWarehouse.name}</span>}
                        {activeRoute.fromWarehouse && activeRoute.toWarehouse && (
                          <ArrowRight className="h-3 w-3 mx-1" />
                        )}
                        {activeRoute.toWarehouse && <span>{activeRoute.toWarehouse.name}</span>}
                        {!activeRoute.fromWarehouse && !activeRoute.toWarehouse && <span>Local Delivery</span>}
                      </div>
                    </div>

                    {/* Order Count */}
                    {activeRoute.batch && (
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Orders</div>
                        <div className="font-medium flex items-center gap-1">
                          <Package className="h-4 w-4 mr-1" />
                          {activeRoute.batch.orderCount} {activeRoute.batch.orderCount === 1 ? "order" : "orders"}
                        </div>
                      </div>
                    )}

                    {/* Weight */}
                    {activeRoute.batch && (
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Total Weight</div>
                        <div className="font-medium">{activeRoute.batch.totalWeight} kg</div>
                      </div>
                    )}

                    {/* Started At */}
                    {activeRoute.startedAt && (
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Started</div>
                        <div className="font-medium flex items-center gap-1">
                          <Clock className="h-4 w-4 mr-1" />
                          {format(new Date(activeRoute.startedAt), "MMM d, h:mm a")}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Map */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Navigation2 className="h-5 w-5 text-primary" />
                    Route Map
                  </CardTitle>
                  <CardDescription>View all stops and your current location</CardDescription>
                </CardHeader>
                <CardContent>
                  <div id="route-map" className="h-[500px] rounded-md overflow-hidden border"></div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="col-span-4 space-y-6">
              {/* Next Stop Card */}
              {nextStop && (
                <Card className="border-2 border-primary/20 overflow-hidden">
                  <div className="bg-primary/5 px-6 py-3 border-b border-primary/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 rounded-full p-1.5">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg">Next Stop</h3>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          nextStop.isPickup
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }
                      >
                        {nextStop.isPickup ? "Pickup" : "Delivery"}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="pt-5">
                    <div className="space-y-5">
                      <div>
                        <div className="font-medium text-lg">{nextStop.address}</div>
                        {nextStop.order && (
                          <div className="mt-4 space-y-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12 border">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {nextStop.order.customerName.charAt(0)}
                                </AvatarFallback>
                                <AvatarImage
                                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${nextStop.order.customerName}`}
                                />
                              </Avatar>
                              <div>
                                <div className="font-medium text-lg">{nextStop.order.customerName}</div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Phone className="h-4 w-4" />
                                  <span>{nextStop.order.phone}</span>
                                </div>
                              </div>
                            </div>
                            {nextStop.order.notes && (
                              <div className="flex items-start gap-3 bg-muted/50 p-4 rounded-lg">
                                <Info className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <span className="text-muted-foreground">{nextStop.order.notes}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <Button onClick={() => startNavigation(nextStop)} size="lg">
                          <Navigation2 className="h-5 w-5 mr-2" />
                          Navigate
                        </Button>
                        <Button onClick={() => handleCompleteStop(nextStop)} variant="secondary" size="lg">
                          <CheckCircle2 className="h-5 w-5 mr-2" />
                          Complete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Stops */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Stops
                  </CardTitle>
                  <CardDescription>{activeRoute.stops.length} total stops on this route</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs defaultValue="pending" className="w-full">
                    <TabsList className="w-full grid grid-cols-2 rounded-none border-b">
                      <TabsTrigger
                        value="pending"
                        className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                      >
                        Pending ({pendingStops.length})
                      </TabsTrigger>
                      <TabsTrigger
                        value="completed"
                        className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                      >
                        Completed ({completedStops.length})
                      </TabsTrigger>
                    </TabsList>

                    <ScrollArea className="h-[400px]">
                      <TabsContent value="pending" className="m-0 p-0">
                        {pendingStops.length === 0 ? (
                          <div className="p-8 text-center">
                            <div className="rounded-full bg-green-50 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                              <CheckCircle2 className="h-8 w-8 text-green-500" />
                            </div>
                            <h3 className="text-lg font-medium">All stops completed!</h3>
                            <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                              Great job, you've completed all stops on this route.
                            </p>
                          </div>
                        ) : (
                          <div className="divide-y">
                            {pendingStops.map((stop, index) => (
                              <div key={stop.id} className="p-4 hover:bg-muted/50 transition-colors">
                                <div className="flex justify-between">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant="outline"
                                        className={
                                          stop.isPickup
                                            ? "bg-amber-50 text-amber-700 border-amber-200"
                                            : "bg-blue-50 text-blue-700 border-blue-200"
                                        }
                                      >
                                        {stop.isPickup ? "Pickup" : "Delivery"}
                                      </Badge>
                                      {index === 0 && <Badge variant="secondary">Next Stop</Badge>}
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
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      onClick={() => startNavigation(stop)}
                                      className="h-8 w-8"
                                    >
                                      <Navigation2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="default"
                                      onClick={() => handleCompleteStop(stop)}
                                      className="h-8 w-8"
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="completed" className="m-0 p-0">
                        {completedStops.length === 0 ? (
                          <div className="p-8 text-center">
                            <p className="text-muted-foreground">No stops completed yet</p>
                          </div>
                        ) : (
                          <div className="divide-y">
                            {completedStops.map((stop) => (
                              <div key={stop.id} className="p-4 hover:bg-muted/50 transition-colors">
                                <div className="flex items-start gap-3">
                                  <div className="mt-1 flex items-center justify-center rounded-full w-6 h-6 bg-green-100 text-green-600 flex-shrink-0">
                                    <CheckCircle2 className="h-4 w-4" />
                                  </div>
                                  <div className="space-y-1 flex-1">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <p className="font-medium">{stop.address}</p>
                                        <div className="text-xs text-muted-foreground flex items-center">
                                          <Hash className="h-3 w-3 mr-0.5" />
                                          {stop.sequenceOrder}
                                        </div>
                                      </div>
                                      <Badge 
                                        variant="outline" 
                                        className={stop.isPickup 
                                          ? "bg-amber-50/50 text-amber-700 border-amber-200" 
                                          : "bg-blue-50/50 text-blue-700 border-blue-200"
                                        }
                                      >
                                        {stop.isPickup ? "Pickup" : "Delivery"}
                                      </Badge>
                                    </div>
                                    
                                    {stop.completedAt && (
                                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        Completed {format(new Date(stop.completedAt), "MMM d, h:mm a")}
                                      </p>
                                    )}
                                    
                                    {stop.order && (
                                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                                        <User className="h-3.5 w-3.5" />
                                        <span>{stop.order.customerName}</span>
                                      </div>
                                    )}
                                    
                                    {stop.notes && (
                                      <div className="text-sm mt-2 bg-muted p-2 rounded-md">{stop.notes}</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </TabsContent>
                    </ScrollArea>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Complete Stop Dialog */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent className="sm:max-w-md fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ zIndex: 9999 }}>
          <DialogHeader>
            <DialogTitle>
              {selectedStop?.isPickup ? "Confirm Pickup Completion" : "Confirm Delivery Completion"}
            </DialogTitle>
            <DialogDescription>Mark this stop as completed in your route</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="mb-4 p-3 bg-muted rounded-md">
              <p className="font-medium text-sm">Address:</p>
              <p className="text-muted-foreground">{selectedStop?.address}</p>

              {selectedStop?.order && (
                <div className="mt-2 pt-2 border-t border-border">
                  <p className="font-medium text-sm">Customer:</p>
                  <p className="text-muted-foreground">{selectedStop?.order.customerName}</p>
                </div>
              )}
            </div>

            <Textarea
              placeholder="Add notes about this stop (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mb-2"
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row sm:justify-between sm:space-x-2">
            <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={completeStop} className="sm:ml-2">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirm Completion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

