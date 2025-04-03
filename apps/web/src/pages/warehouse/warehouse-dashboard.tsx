import { useState } from "react";
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
import { format } from "date-fns";
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

interface Audit {
  id: string;
  date: string;
  action: string;
  findings: string;
  managerName: string;
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
  recentAudits: Audit[];
  activeBatches: Batch[];
  managers: Manager[];
  dailyOrderData: DailyOrderData[];
}

// Chart data types
interface PieChartData {
  name: string;
  value: number;
}

interface BarChartData {
  name: string;
  value: number;
}

export function WarehouseDashboard(): JSX.Element {
  const [timeRange, setTimeRange] = useState<string>("7d");
  const { user } = useAuthStore();
  
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['warehouseDashboard', timeRange, user?.warehouseId],
    queryFn: async () => {
      if (!user?.warehouseId) throw new Error("No warehouse ID found");
      const response = await api.get(`/warehouse/${user.warehouseId}/dashboard?timeRange=${timeRange}`);
      return response.data as DashboardData;
    },
    enabled: !!user?.warehouseId
  });

  // Create a safe version of the dashboard data
  const dashboardData: DashboardData = data || {
    warehouse: {
      id: '',
      name: '',
      address: '',
      city: '',
      governorate: '',
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
    recentAudits: [],
    activeBatches: [],
    managers: [],
    dailyOrderData: []
  };

  // Calculate utilization percentage
  const utilizationPercentage = Math.round(dashboardData.warehouse.capacityUtilization);

  // Prepare section utilization data for chart
  const sectionUtilizationData: BarChartData[] = dashboardData.sections.map(section => ({
    name: section.name,
    value: Math.round(section.utilization)
  }));

  // Prepare order status data for pie chart
  const orderStatusData: PieChartData[] = [
    { name: 'Incoming', value: dashboardData.orderStats.incomingOrders },
    { name: 'Ready', value: dashboardData.orderStats.readyForDelivery },
    { name: 'Outgoing', value: dashboardData.orderStats.outgoingOrders },
    { name: 'Processing', value: Math.round((dashboardData.orderStats.incomingOrders + dashboardData.orderStats.outgoingOrders) / 3) }
  ];

  // Helper function to determine batch status color
  const getStatusColor = (status: string): string => {
    switch (status.toUpperCase()) {
      case 'COLLECTING':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-6 flex flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Loading Dashboard</h2>
        <p className="text-muted-foreground mb-4">
          {error instanceof Error ? error.message : "Failed to load warehouse data"}
        </p>
        <button
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight">Warehouse Dashboard</h2>
        <p className="text-muted-foreground">
          Monitor warehouse operations, inventory, and order processing
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <WarehouseIcon className="h-5 w-5 text-muted-foreground" />
          <span className="text-lg font-medium">{dashboardData.warehouse.name}</span>
          <Badge variant="outline" className="ml-2">
            {dashboardData.warehouse.city}, {dashboardData.warehouse.governorate}
          </Badge>
        </div>
        
        <Select value={timeRange} onValueChange={setTimeRange}>
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

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacity Utilization</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{utilizationPercentage}%</div>
            <Progress value={utilizationPercentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {dashboardData.warehouse.currentLoad.toLocaleString()} / {dashboardData.warehouse.capacity.toLocaleString()} units
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incoming Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.orderStats.incomingOrders}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Orders arriving at warehouse
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outgoing Orders</CardTitle>
            <TruckIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.orderStats.outgoingOrders}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Orders leaving warehouse
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Order Flow Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Order Flow</CardTitle>
              <CardDescription>Daily incoming and outgoing orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dashboardData.dailyOrderData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="incoming" stroke="#0088FE" name="Incoming" />
                    <Line type="monotone" dataKey="outgoing" stroke="#00C49F" name="Outgoing" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest warehouse operations</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData.recentAudits.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.recentAudits.map((audit) => (
                      <div key={audit.id} className="flex items-start space-x-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{audit.action}</p>
                          <p className="text-xs text-muted-foreground">{audit.findings}</p>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <span>{audit.managerName}</span>
                            <span className="mx-1">•</span>
                            <span>{format(new Date(audit.date), 'MMM dd, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Clock className="h-6 w-6 text-muted-foreground" />}
                    title="No Recent Activity"
                    description="Recent warehouse activities will appear here"
                  />
                )}
              </CardContent>
            </Card>

            {/* Active Batches */}
            <Card>
              <CardHeader>
                <CardTitle>Active Batches</CardTitle>
                <CardDescription>Currently processing batches</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData.activeBatches.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.activeBatches.map((batch) => (
                      <div key={batch.id} className="flex items-start space-x-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Package className="h-4 w-4 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <p className="text-sm font-medium mr-2">Batch #{batch.id.substring(0, 8)}</p>
                            <Badge className={getStatusColor(batch.status)}>
                              {batch.status}
                            </Badge>
                          </div>
                          <p className="text-xs">
                            {batch.orderCount} orders • {batch.type.replace(/_/g, ' ')}
                          </p>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <span>Driver: {batch.driverName}</span>
                            <span className="mx-1">•</span>
                            <span>
                              {batch.scheduledTime ? format(new Date(batch.scheduledTime), 'MMM dd, HH:mm') : 'Not scheduled'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Package className="h-6 w-6 text-muted-foreground" />}
                    title="No Active Batches"
                    description="Active batches will appear here"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          {/* Warehouse Sections */}
          <Card>
            <CardHeader>
              <CardTitle>Warehouse Sections</CardTitle>
              <CardDescription>Storage areas and their utilization</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData.sections.length > 0 ? (
                <div className="space-y-6">
                  {dashboardData.sections.map((section) => (
                    <div key={section.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{section.name}</p>
                          <p className="text-sm text-muted-foreground">{section.type}</p>
                        </div>
                        <Badge variant="outline">
                          {section.pileCount} piles
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>{Math.round(section.utilization)}% utilized</span>
                        <span>{section.currentLoad} / {section.capacity} units</span>
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
              {dashboardData.managers.length > 0 ? (
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