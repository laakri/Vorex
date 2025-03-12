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
  Route,
  Boxes,
  RotateCw,
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
import { Progress } from "@/components/ui/progress";
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
            {[
              {
                title: "Total Earnings",
                value: `${deliveryMetrics.earnings?.toLocaleString() || '0'} DT`,
                icon: <Wallet className="h-5 w-5 text-primary" />,
              },
              {
                title: "Completed Deliveries",
                value: deliveryMetrics.completed?.toString() || '0',
                icon: <Package className="h-5 w-5 text-primary" />,
              },
              {
                title: "Total Distance",
                value: `${deliveryMetrics.totalDistance || '0'} km`,
                icon: <Navigation2 className="h-5 w-5 text-primary" />,
              },
              {
                title: "Success Rate",
                value: `${performanceStats.successRate || '0'}%`,
                icon: <CheckCircle className="h-5 w-5 text-primary" />,
              }
            ].map((metric) => (
              <Card key={metric.title}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between space-x-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {metric.title}
                      </p>
                      <p className="text-2xl font-bold">{metric.value}</p>
                    </div>
                    <div className="p-2 bg-primary/10 rounded-full">
                      {metric.icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts and Recent Deliveries */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Earnings Chart */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Earnings & Deliveries</CardTitle>
                <CardDescription>Daily earnings and delivery count</CardDescription>
              </CardHeader>
              <CardContent>
                {hasDeliveries && earningsData.daily?.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={earningsData.daily}>
                        <XAxis
                          dataKey="date"
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${value} DT`}
                        />
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="flex flex-col">
                                      <span className="text-xs text-muted-foreground">Earnings</span>
                                      <span className="font-bold text-sm">{payload[0].value} DT</span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-xs text-muted-foreground">Deliveries</span>
                                      <span className="font-bold text-sm">{payload[0].payload.deliveries}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="earnings"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState
                    icon={<Wallet className="h-10 w-10 text-muted-foreground" />}
                    title="No Earnings Data"
                    description="Complete deliveries to see your earnings trend"
                    className="h-[300px]"
                  />
                )}
              </CardContent>
            </Card>

            {/* Recent Deliveries */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Deliveries</CardTitle>
                <CardDescription>Latest completed routes</CardDescription>
              </CardHeader>
              <CardContent>
                {hasDeliveries ? (
                  <div className="space-y-8">
                    {recentDeliveries.map((delivery: any) => (
                      <div key={delivery.id} className="flex items-center">
                        <div className="space-y-1 flex-1">
                          <p className="text-sm font-medium leading-none">
                            {delivery.route || 'Route ID: ' + delivery.id.substring(0, 8)}
                          </p>
                          <div className="flex items-center text-sm text-muted-foreground gap-2">
                            <Package className="h-4 w-4" />
                            <span>{delivery.packages || 0} packages</span>
                            <span>•</span>
                            <span>{delivery.distance || 0} km</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="default">
                            {delivery.status || 'COMPLETED'}
                          </Badge>
                          <span className="font-bold">{delivery.earnings || 0} DT</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Package className="h-10 w-10 text-muted-foreground" />}
                    title="No Recent Deliveries"
                    description="Your recent deliveries will appear here"
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* Vehicle Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Vehicle Status
                </CardTitle>
                <CardDescription>Current vehicle information</CardDescription>
              </CardHeader>
              <CardContent>
                {vehicleInfo ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Type</span>
                      <Badge variant="outline">{vehicleInfo.type || 'N/A'}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Status</span>
                      <Badge 
                        variant={vehicleInfo.status === 'ACTIVE' ? 'default' : 'destructive'}
                      >
                        {vehicleInfo.status || 'UNKNOWN'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Last Maintenance</span>
                      <span className="text-sm">
                        {vehicleInfo.lastMaintenance 
                          ? new Date(vehicleInfo.lastMaintenance).toLocaleDateString() 
                          : 'Not available'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Next Maintenance</span>
                      <span className="text-sm font-medium">
                        {vehicleInfo.nextMaintenance
                          ? new Date(vehicleInfo.nextMaintenance).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={<Truck className="h-10 w-10 text-muted-foreground" />}
                    title="No Vehicle Data"
                    description="Vehicle information not available"
                  />
                )}
              </CardContent>
            </Card>

            {/* Performance Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
                <CardDescription>Delivery performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {performanceStats ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Rating</span>
                        <span className="font-medium">{performanceStats.rating || 0}/5</span>
                      </div>
                      <Progress value={(performanceStats.rating || 0) * 20} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">On-time Delivery</span>
                        <span className="font-medium">{performanceStats.onTimeDelivery || 0}%</span>
                      </div>
                      <Progress value={performanceStats.onTimeDelivery || 0} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Success Rate</span>
                        <span className="font-medium">{performanceStats.successRate || 0}%</span>
                      </div>
                      <Progress value={performanceStats.successRate || 0} />
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={<BarChart className="h-10 w-10 text-muted-foreground" />}
                    title="No Performance Data"
                    description="Complete deliveries to see performance metrics"
                  />
                )}
              </CardContent>
            </Card>

            {/* Delivery Types */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Types</CardTitle>
                <CardDescription>Distribution by type</CardDescription>
              </CardHeader>
              <CardContent>
                {earningsData?.byType?.length > 0 ? (
                  <div className="space-y-4">
                    {earningsData.byType.map((type:any) => (
                      <div key={type.name} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {type.name}
                          </p>
                          <div className="flex items-center gap-2">
                            <Progress value={type.percentage} className="w-[60px]" />
                            <span className="text-sm text-muted-foreground">
                              {type.percentage}%
                            </span>
                          </div>
                        </div>
                        <div className="font-bold">
                          {type.count} deliveries
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Boxes className="h-10 w-10 text-muted-foreground" />}
                    title="No Delivery Types"
                    description="Complete deliveries to see type distribution"
                  />
                )}
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