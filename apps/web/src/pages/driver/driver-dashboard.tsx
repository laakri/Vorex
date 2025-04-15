import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet,
  Package,
  Navigation2,
  CheckCircle,
  Truck,
  Info,
  BarChart,
  Boxes,
  RotateCw,
  ArrowRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import api from "@/lib/axios";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function DriverDashboard() {
  const [timeRange, setTimeRange] = useState<string>("7d");
  const { toast } = useToast();
  
  // Fetch dashboard data from API
  const { data, isLoading, error } = useQuery({
    queryKey: ["driverDashboard", timeRange],
    queryFn: async () => {
      try {
        const response = await api.get(`/drivers/dashboard?timeRange=${timeRange}`);
        return response.data;
      } catch (err) {
        toast({
          title: "Error loading dashboard",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive"
        });
        throw err;
      }
    }
  });
  
  // Destructure data for easier access
  const { 
    deliveryMetrics = {}, 
    vehicleInfo = {},
    earningsData = { daily: [], byType: [] },
    recentDeliveries = [],
    performanceStats = {}
  } = data || {};
  
  const hasDeliveries = recentDeliveries.length > 0;
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };
  
  // If loading, show skeleton UI
  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Driver Dashboard</h2>
            <p className="text-muted-foreground">
              Your delivery performance overview
            </p>
          </div>
          <Skeleton className="h-10 w-[180px]" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array(4).fill(null).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-60" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
          
          <Card className="col-span-3">
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-60" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Array(3).fill(null).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // If there's an error, show a simple error message
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState
          icon={<Info className="h-10 w-10 text-destructive" />}
          title="Failed to load dashboard"
          description="There was an error loading your dashboard data. Please try refreshing the page."
        >
          <Button 
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            <RotateCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </EmptyState>
      </div>
    );
  }
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Driver Dashboard</h2>
          <p className="text-muted-foreground">
            Your delivery performance overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={timeRange}
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stats">Detailed Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{deliveryMetrics.completed || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Completed in {timeRange}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(deliveryMetrics.earnings || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  From {deliveryMetrics.completed || 0} deliveries
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
                <Navigation2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{deliveryMetrics.totalDistance?.toFixed(1) || 0} km</div>
                <p className="text-xs text-muted-foreground">
                  Traveled in {timeRange}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceStats.successRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  On-time: {performanceStats.onTimeDelivery || 0}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Recent Deliveries */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Earnings Chart */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Earnings Trend</CardTitle>
                <CardDescription>
                  Your earnings over the past {timeRange}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {earningsData.daily.length === 0 ? (
                  <EmptyState
                    icon={<BarChart className="h-4 w-4" />}
                    title="No earnings data"
                    description="Complete deliveries to see your earnings trend."
                  />
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={earningsData.daily}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip />
                        <Line
                          type="monotone"
                          dataKey="earnings"
                          stroke="#10b981"
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Deliveries */}
            <Card className="col-span-3">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Deliveries</CardTitle>
                  <CardDescription>
                    Your most recent completed deliveries
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="/driver/history">View All</a>
                </Button>
              </CardHeader>
              <CardContent>
                {!hasDeliveries ? (
                  <EmptyState
                    icon={<Package className="h-4 w-4" />}
                    title="No recent deliveries"
                    description="Complete deliveries to see them here."
                  />
                ) : (
                  <div className="space-y-4">
                    {recentDeliveries.map((delivery: any) => (
                      <div key={delivery.id} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {delivery.route}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {delivery.packages} packages • {delivery.distance.toFixed(1)} km
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {formatCurrency(delivery.earnings)}
                          </Badge>
                          <Badge variant="secondary">
                            {new Date(delivery.completedAt).toLocaleDateString()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* Vehicle Status */}
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Status</CardTitle>
                <CardDescription>
                  Current vehicle information
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!vehicleInfo.type ? (
                  <EmptyState
                    icon={<Truck className="h-4 w-4" />}
                    title="No vehicle information"
                    description="Add a vehicle to your profile to see status information."
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Type</span>
                      </div>
                      <span className="text-sm">{vehicleInfo.type}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Status</span>
                      </div>
                      <Badge variant={vehicleInfo.status === 'ACTIVE' ? 'default' : 'destructive'}>
                        {vehicleInfo.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <RotateCw className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Last Maintenance</span>
                      </div>
                      <span className="text-sm">
                        {vehicleInfo.lastMaintenance 
                          ? new Date(vehicleInfo.lastMaintenance).toLocaleDateString() 
                          : 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Boxes className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Next Maintenance</span>
                      </div>
                      <span className="text-sm">
                        {vehicleInfo.nextMaintenance 
                          ? new Date(vehicleInfo.nextMaintenance).toLocaleDateString() 
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Earnings Summary */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Earnings Summary</CardTitle>
                  <CardDescription>
                    Your earnings breakdown
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="/driver/earnings">View Details</a>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Total Earnings</span>
                    </div>
                    <span className="text-sm font-bold">{formatCurrency(deliveryMetrics.earnings || 0)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Base Amount</span>
                    </div>
                    <span className="text-sm">
                      {formatCurrency((deliveryMetrics.earnings || 0) * 0.7)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Bonus Amount</span>
                    </div>
                    <span className="text-sm">
                      {formatCurrency((deliveryMetrics.earnings || 0) * 0.3)}
                    </span>
                  </div>
                  
                  <div className="pt-4">
                    <Button className="w-full" asChild>
                      <a href="/driver/earnings" className="flex items-center justify-center">
                        View Earnings Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Statistics</CardTitle>
                <CardDescription>More detailed delivery and performance analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon={<BarChart className="h-10 w-10 text-muted-foreground" />}
                  title="Coming Soon"
                  description="Detailed statistics will be available in a future update"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 