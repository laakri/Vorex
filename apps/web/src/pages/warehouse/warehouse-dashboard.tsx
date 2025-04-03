import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Package, 
  TruckIcon, 
  WarehouseIcon, 
  Layers, 
  Users,
  Clock,
  AlertCircle
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth.store";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

// Color constants for charts
const COLORS: string[] = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Types based on the schema
interface WarehouseInfo {
  id: string;
  name: string;
  address: string;
  city: string;
  governorate: string;
  capacity: number;
  currentLoad: number;
  capacityUtilization: number;
}

interface WarehouseSection {
  id: string;
  name: string;
  type: string;
  capacity: number;
  currentLoad: number;
  utilization: number;
  pileCount: number;
}

interface OrderStats {
  incomingOrders: number;
  outgoingOrders: number;
  readyForDelivery: number;
}

interface ActivityItem {
  id: string;
  date: string;
  type: string;
  status: string;
  description: string;
}

interface Batch {
  id: string;
  type: string;
  status: string;
  orderCount: number;
  driverName: string;
  scheduledTime: string | null;
}

interface Manager {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  securityClearance: string;
  shiftPreference: string;
}

interface DailyOrderData {
  date: string;
  incoming: number;
  outgoing: number;
}

interface DashboardData {
  warehouse: WarehouseInfo;
  sections: WarehouseSection[];
  orderStats: OrderStats;
  recentActivity: ActivityItem[];
  activeBatches: Batch[];
  managers: Manager[];
  dailyOrders: DailyOrderData[];
}

// Chart data types
interface PieChartData {
  name: string;
  value: number;
}

export default function WarehouseDashboard() {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState<string>("7d");
  const { user } = useAuthStore();
  
  // Default empty dashboard data
  const emptyDashboardData: DashboardData = {
    warehouse: {
      id: "",
      name: "",
      address: "",
      city: "",
      governorate: "",
      capacity: 0,
      currentLoad: 0,
      capacityUtilization: 0
    },
    sections: [],
    orderStats: {
      incomingOrders: 0,
      outgoingOrders: 0,
      readyForDelivery: 0
    },
    recentActivity: [],
    activeBatches: [],
    managers: [],
    dailyOrders: []
  };
  
  // Get warehouse ID from user (assuming warehouse manager role)
  const warehouseId = user?.warehouseId || "";
  
  // Fetch dashboard data
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['warehouseDashboard', warehouseId, timeRange],
    queryFn: async () => {
      if (!warehouseId) {
        toast({
          title: "Error",
          description: "No warehouse ID found. Please ensure you're logged in as a warehouse manager.",
          variant: "destructive"
        });
        throw new Error("No warehouse ID found");
      }
      
      try {
        const response = await api.get(`/warehouse/${warehouseId}/dashboard?timeRange=${timeRange}`);
        return response.data as DashboardData;
      } catch (err: any) {
        toast({
          title: "Failed to load dashboard data",
          description: err.message || "An unknown error occurred",
          variant: "destructive"
        });
        throw err;
      }
    },
    enabled: !!warehouseId,
    refetchInterval: 300000, // Refresh every 5 minutes
  });
  
  // Use empty data if data is undefined
  const dashboardData = data || emptyDashboardData;
  
  // Prepare data for charts
  const orderStatusData: PieChartData[] = [
    { name: 'Incoming', value: dashboardData.orderStats.incomingOrders },
    { name: 'Outgoing', value: dashboardData.orderStats.outgoingOrders },
    { name: 'Ready for Delivery', value: dashboardData.orderStats.readyForDelivery }
  ];
  
  const sectionUtilizationData = dashboardData.sections.map(section => ({
    name: section.name,
    value: section.utilization
  }));
  
  // If loading, show skeleton UI
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            <Skeleton className="h-10 w-64" />
          </h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  // If error, show error message
  if (isError) {
    return (
      <div className="container mx-auto py-6 flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Failed to load dashboard</h2>
        <p className="text-muted-foreground mb-6">{error?.message || "An unknown error occurred"}</p>
        <button 
          onClick={() => refetch()} 
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{dashboardData.warehouse.name || "Warehouse"} Dashboard</h1>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last Quarter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Capacity Utilization</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.warehouse.capacityUtilization.toFixed(1)}%</div>
            <Progress value={dashboardData.warehouse.capacityUtilization} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {dashboardData.warehouse.currentLoad.toFixed(1)} / {dashboardData.warehouse.capacity.toFixed(1)} kg
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Incoming Orders</CardTitle>
            <TruckIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.orderStats.incomingOrders}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Orders arriving at this warehouse
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Outgoing Orders</CardTitle>
            <WarehouseIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.orderStats.outgoingOrders}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Orders leaving this warehouse
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs for different dashboard views */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest warehouse operations</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData.recentActivity && dashboardData.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4">
                      <div className="rounded-full p-2 bg-muted">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{activity.status}</Badge>
                          <span className="text-xs text-muted-foreground">{activity.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Clock className="h-6 w-6 text-muted-foreground" />}
                  title="No Recent Activity"
                  description="Recent warehouse operations will appear here"
                />
              )}
            </CardContent>
          </Card>
          
          {/* Daily Orders Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Orders</CardTitle>
              <CardDescription>Incoming vs outgoing orders over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dashboardData.dailyOrders}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="incoming" stroke="#8884d8" name="Incoming" />
                    <Line type="monotone" dataKey="outgoing" stroke="#82ca9d" name="Outgoing" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Active Batches */}
          <Card>
            <CardHeader>
              <CardTitle>Active Batches</CardTitle>
              <CardDescription>Currently processing order batches</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData.activeBatches && dashboardData.activeBatches.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Scheduled</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData.activeBatches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell className="font-medium">{batch.type}</TableCell>
                        <TableCell>
                          <Badge variant={batch.status === 'PROCESSING' ? 'default' : 'secondary'}>
                            {batch.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{batch.orderCount}</TableCell>
                        <TableCell>{batch.driverName}</TableCell>
                        <TableCell>{batch.scheduledTime || 'Not scheduled'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  icon={<Package className="h-6 w-6 text-muted-foreground" />}
                  title="No Active Batches"
                  description="Active order batches will appear here"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="inventory" className="space-y-6">
          {/* Warehouse Sections */}
          <Card>
            <CardHeader>
              <CardTitle>Warehouse Sections</CardTitle>
              <CardDescription>Storage areas and their utilization</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData.sections && dashboardData.sections.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.sections.map((section) => (
                    <div key={section.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{section.name}</p>
                          <p className="text-xs text-muted-foreground">{section.type} • {section.pileCount} piles</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{section.utilization.toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">
                            {section.currentLoad.toFixed(1)} / {section.capacity.toFixed(1)} kg
                          </p>
                        </div>
                      </div>
                      <Progress value={section.utilization} />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Layers className="h-6 w-6 text-muted-foreground" />}
                  title="No Sections Found"
                  description="Warehouse sections will appear here"
                />
              )}
            </CardContent>
          </Card>

          {/* Section Utilization Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Section Utilization</CardTitle>
              <CardDescription>Capacity usage by section</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sectionUtilizationData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: 'Utilization %', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" name="Utilization %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          {/* Warehouse Managers */}
          <Card>
            <CardHeader>
              <CardTitle>Warehouse Managers</CardTitle>
              <CardDescription>Staff with warehouse management access</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData.managers && dashboardData.managers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Security Level</TableHead>
                      <TableHead>Shift</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData.managers.map((manager) => (
                      <TableRow key={manager.id}>
                        <TableCell className="font-medium">{manager.name}</TableCell>
                        <TableCell>{manager.employeeId}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {manager.securityClearance.toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{manager.shiftPreference}</TableCell>
                        <TableCell className="text-muted-foreground">{manager.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  icon={<Users className="h-6 w-6 text-muted-foreground" />}
                  title="No Managers Found"
                  description="Warehouse managers will appear here"
                />
              )}
            </CardContent>
          </Card>

          {/* Order Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status Distribution</CardTitle>
              <CardDescription>Current orders by status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {orderStatusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}