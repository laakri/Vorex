import { useState } from "react";
import {
  Truck,
  Package,
  Navigation2,
  CheckCircle,
  Route as RouteIcon,
  Wallet,
} from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { EmptyState } from "@/components/ui/empty-state";

// Dummy data structure
const DUMMY_DASHBOARD_DATA = {
  deliveryMetrics: {
    completed: 156,
    totalDistance: 2347,
    totalTime: 189,
    earnings: 4520,
  },
  vehicleInfo: {
    type: "VAN",
    status: "ACTIVE",
    lastMaintenance: "2024-03-01",
    fuelLevel: 75,
    nextMaintenanceDate: "2024-04-01",
    registrationNumber: "123 TN 4567",
  },
  earningsData: {
    daily: [
      { date: "2024-03-01", earnings: 650, deliveries: 12 },
      { date: "2024-03-02", earnings: 720, deliveries: 15 },
      { date: "2024-03-03", earnings: 550, deliveries: 10 },
      { date: "2024-03-04", earnings: 830, deliveries: 18 },
      { date: "2024-03-05", earnings: 690, deliveries: 14 },
      { date: "2024-03-06", earnings: 780, deliveries: 16 },
      { date: "2024-03-07", earnings: 300, deliveries: 8 },
    ],
    byType: [
      { name: "Local Delivery", percentage: 45, count: 70, earnings: 2034 },
      { name: "Local Pickup", percentage: 30, count: 47, earnings: 1356 },
      { name: "Intercity", percentage: 25, count: 39, earnings: 1130 },
    ],
  },
  recentDeliveries: [
    {
      id: "del_1",
      route: "Tunis Center → La Marsa",
      packages: 8,
      distance: 15.4,
      status: "COMPLETED",
      earnings: 45,
      timestamp: "2024-03-07T14:30:00Z",
      customerName: "Ahmed Ben Salem",
    },
    {
      id: "del_2",
      route: "Ariana → El Menzah",
      packages: 12,
      distance: 8.7,
      status: "COMPLETED",
      earnings: 35,
      timestamp: "2024-03-07T12:15:00Z",
      customerName: "Sarra Mansouri",
    },
    {
      id: "del_3",
      route: "La Soukra → Carthage",
      packages: 5,
      distance: 12.3,
      status: "COMPLETED",
      earnings: 40,
      timestamp: "2024-03-07T10:00:00Z",
      customerName: "Yassine Karoui",
    },
    {
      id: "del_4",
      route: "Les Berges du Lac → Sidi Bou Said",
      packages: 15,
      distance: 18.9,
      status: "COMPLETED",
      earnings: 55,
      timestamp: "2024-03-07T08:30:00Z",
      customerName: "Leila Ben Ammar",
    },
  ],
  performanceStats: {
    rating: 4.8,
    onTimeDelivery: 95,
    successRate: 98,
    customerFeedback: [
      { type: "Positive", count: 142 },
      { type: "Neutral", count: 12 },
      { type: "Negative", count: 2 },
    ],
    monthlyStats: {
      totalHours: 168,
      averageDeliveriesPerDay: 12,
      fuelConsumption: 280,
      maintenanceCount: 1,
    },
  },
  currentStatus: {
    status: "AVAILABLE",
    lastActive: "2024-03-07T15:00:00Z",
    currentLocation: {
      latitude: 36.8065,
      longitude: 10.1815,
      address: "Downtown Tunis",
    },
    shiftInfo: {
      type: "MORNING",
      startTime: "2024-03-07T06:00:00Z",
      endTime: "2024-03-07T14:00:00Z",
      breaksLeft: 1,
    },
  }
};

export function DriverDashboard() {
  const [timeRange, setTimeRange] = useState<string>("7d");
  
  // Use dummy data directly
  const {
    deliveryMetrics,
    vehicleInfo,
    earningsData,
    recentDeliveries,
    performanceStats
  } = DUMMY_DASHBOARD_DATA;

  const hasDeliveries = deliveryMetrics.completed > 0;

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
            onValueChange={(value: string) => setTimeRange(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
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
                value: `${deliveryMetrics.earnings.toLocaleString()} DT`,
                icon: Wallet,
              },
              {
                title: "Completed Deliveries",
                value: deliveryMetrics.completed.toString(),
                icon: Package,
              },
              {
                title: "Total Distance",
                value: `${deliveryMetrics.totalDistance} km`,
                icon: Navigation2,
              },
              {
                title: "Success Rate",
                value: `${performanceStats.successRate}%`,
                icon: CheckCircle,
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
                      <metric.icon className="h-5 w-5 text-primary" />
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
                {hasDeliveries ? (
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
                    icon={<Wallet />}
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
                    {recentDeliveries.map((delivery) => (
                      <div key={delivery.id} className="flex items-center">
                        <div className="space-y-1 flex-1">
                          <p className="text-sm font-medium leading-none">
                            {delivery.route}
                          </p>
                          <div className="flex items-center text-sm text-muted-foreground gap-2">
                            <Package className="h-4 w-4" />
                            <span>{delivery.packages} packages</span>
                            <span>•</span>
                            <span>{delivery.distance} km</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="default">
                            {delivery.status}
                          </Badge>
                          <span className="font-bold">{delivery.earnings} DT</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Package/>}
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
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Type</span>
                    <Badge variant="outline">{vehicleInfo.type}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Status</span>
                    <Badge 
                      variant={vehicleInfo.status === 'ACTIVE' ? 'default' : 'destructive'}
                    >
                      {vehicleInfo.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Maintenance</span>
                    <span className="text-sm">
                      {new Date(vehicleInfo.lastMaintenance).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
                <CardDescription>Delivery performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Rating</span>
                      <span className="font-medium">{performanceStats.rating}/5</span>
                    </div>
                    <Progress value={performanceStats.rating * 20} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">On-time Delivery</span>
                      <span className="font-medium">{performanceStats.onTimeDelivery}%</span>
                    </div>
                    <Progress value={performanceStats.onTimeDelivery} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Success Rate</span>
                      <span className="font-medium">{performanceStats.successRate}%</span>
                    </div>
                    <Progress value={performanceStats.successRate} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Types */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Types</CardTitle>
                <CardDescription>Distribution by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {earningsData.byType.map((type) => (
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stats">
          {/* Add detailed statistics content here */}
        </TabsContent>
      </Tabs>
    </div>
  );
} 