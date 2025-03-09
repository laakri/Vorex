import { useState, useEffect } from "react"
import { format } from "date-fns"
import { 
  Clock, 
  CheckCircle2, 
  MapPin, 
  Package, 
  Truck, 
  Calendar, 
  Search,
  ArrowUpDown,
  ChevronDown,
  Filter
} from "lucide-react"
import api from "@/lib/axios"
import { useToast } from "@/hooks/use-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// TypeScript interfaces
interface RouteStop {
  id: string
  address: string
  isPickup: boolean
  isCompleted: boolean
  completedAt?: string
  
}

interface DeliveryRoute {
  id: string
  status: string
  startedAt?: string
  completedAt?: string
  totalDistance: number
  estimatedDuration: number
  stops: RouteStop[]
  batch?: {
    id: string
    type: string
    orderCount: number
  }
  createdAt: string
}

export function DriverHistory() {
  const { toast } = useToast()
  const [routes, setRoutes] = useState<DeliveryRoute[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [sortOrder, setSortOrder] = useState("desc")

  useEffect(() => {
    fetchRoutes()
  }, [])

  const fetchRoutes = async () => {
    try {
      setLoading(true)
      const response = await api.get("/delivery-routes/driver")
      setRoutes(response.data)
    } catch (error) {
      console.error("Failed to fetch routes:", error)
      toast({
        title: "Error",
        description: "Could not load your delivery history",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredRoutes = routes
    .filter((route) => {
      // Filter by status
      if (filterStatus !== "all" && route.status !== filterStatus) {
        return false
      }
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          route.id.toLowerCase().includes(query) ||
          route.stops.some(stop => stop.address.toLowerCase().includes(query))
        )
      }
      
      return true
    })
    .sort((a, b) => {
      // Sort by selected criteria
      if (sortBy === "date") {
        const dateA = a.completedAt || a.startedAt || a.createdAt || ""
        const dateB = b.completedAt || b.startedAt || b.createdAt || ""
        return sortOrder === "asc" 
          ? dateA.localeCompare(dateB)
          : dateB.localeCompare(dateA)
      } else if (sortBy === "stops") {
        return sortOrder === "asc"
          ? a.stops.length - b.stops.length
          : b.stops.length - a.stops.length
      } else if (sortBy === "distance") {
        return sortOrder === "asc"
          ? a.totalDistance - b.totalDistance
          : b.totalDistance - a.totalDistance
      }
      return 0
    })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200"
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "FAILED":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getBatchTypeLabel = (type: string) => {
    switch (type) {
      case "LOCAL_PICKUP":
        return "Local Pickup"
      case "LOCAL_SELLERS_WAREHOUSE":
        return "Seller to Warehouse"
      case "LOCAL_WAREHOUSE_BUYERS":
        return "Warehouse to Buyers"
      case "INTERCITY":
        return "Intercity Transfer"
      default:
        return type
    }
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Delivery History</h1>
          <p className="text-muted-foreground">View and track your past deliveries</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchRoutes}>
            <Clock className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{routes.length}</div>
            <p className="text-xs text-muted-foreground">All time delivery count</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {routes.filter(route => route.status === "COMPLETED").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {routes.length ? Math.round((routes.filter(route => route.status === "COMPLETED").length / routes.length) * 100) : 0}% completion rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {routes.reduce((total, route) => total + (route.totalDistance || 0), 0).toFixed(1)} km
            </div>
            <p className="text-xs text-muted-foreground">Across all deliveries</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-transparent border-none">
        <CardHeader>
          <CardTitle>Delivery Routes</CardTitle>
          <CardDescription>Browse through your past delivery routes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search routes or addresses..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Status: {filterStatus === "all" ? "All" : filterStatus}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFilterStatus("all")}>
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus("COMPLETED")}>
                    Completed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus("IN_PROGRESS")}>
                    In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus("FAILED")}>
                    Failed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    Sort: {sortBy}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { setSortBy("date"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>
                    Date {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSortBy("stops"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>
                    Stops {sortBy === "stops" && (sortOrder === "asc" ? "↑" : "↓")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSortBy("distance"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>
                    Distance {sortBy === "distance" && (sortOrder === "asc" ? "↑" : "↓")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col space-y-3 p-4 border rounded-lg">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                  <Skeleton className="h-4 w-[300px]" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRoutes.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">No delivery history found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {searchQuery || filterStatus !== "all" 
                  ? "Try adjusting your filters to see more results" 
                  : "Your completed deliveries will appear here"}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {filteredRoutes.map((route) => (
                  <Card key={route.id} className="overflow-hidden">
                    <div className="p-4 border-l-4 border-primary">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">Route #{route.id.substring(0, 8)}</h3>
                            <Badge variant="outline" className={getStatusColor(route.status)}>
                              {route.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {route.completedAt 
                                ? format(new Date(route.completedAt), "MMM d, yyyy")
                                : route.startedAt
                                  ? format(new Date(route.startedAt), "MMM d, yyyy")
                                  : "Not started"}
                            </div>
                            <div className="flex items-center gap-1">
                              <Truck className="h-3.5 w-3.5" />
                              {route.totalDistance?.toFixed(1) || "?"} km
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {route.estimatedDuration 
                                ? `${Math.floor(route.estimatedDuration / 60)}h ${route.estimatedDuration % 60}m`
                                : "?"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {route.batch && (
                            <Badge variant="secondary" className="whitespace-nowrap">
                              {getBatchTypeLabel(route.batch.type)}
                            </Badge>
                          )}
                          <Badge variant="outline" className="whitespace-nowrap">
                            <Package className="mr-1 h-3 w-3" />
                            {route.stops.length} stops
                          </Badge>
                        </div>
                      </div>
                      
                      <Separator className="my-3" />
                      
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {route.stops.slice(0, 3).map((stop) => (
                          <div key={stop.id} className="flex items-start gap-2 p-2 rounded-md bg-muted/30">
                            <div className={`mt-0.5 flex-shrink-0 size-5 rounded-full flex items-center justify-center ${
                              stop.isCompleted 
                                ? "bg-green-100" 
                                : "bg-muted"
                            }`}>
                              {stop.isCompleted 
                                ? <CheckCircle2 className="h-3 w-3 text-green-600" /> 
                                : <Clock className="h-3 w-3 text-muted-foreground" />}
                            </div>
                            <div className="text-sm">
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className={`text-xs ${
                                  stop.isPickup 
                                    ? "bg-amber-50 text-amber-700 border-amber-200" 
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                }`}>
                                  {stop.isPickup ? "Pickup" : "Delivery"}
                                </Badge>
                                {stop.completedAt && (
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(stop.completedAt), "h:mm a")}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-start gap-1 mt-1">
                                <MapPin className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
                                <span className="text-xs">{stop.address}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {route.stops.length > 3 && (
                          <div className="flex items-center justify-center p-2 rounded-md bg-muted/30">
                            <span className="text-sm text-muted-foreground">
                              +{route.stops.length - 3} more stops
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {route.status === "COMPLETED" && (
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {route.completedAt ? format(new Date(route.completedAt), "dd") : "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Completed on </span>
                              <span className="font-medium">
                                {route.completedAt 
                                  ? format(new Date(route.completedAt), "MMM d, yyyy 'at' h:mm a")
                                  : "Unknown date"}
                              </span>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="gap-1">
                            View Details
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 