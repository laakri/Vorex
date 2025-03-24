import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Warehouse,
  Truck,
  Clock,

  ClipboardCheck,
  Layers,
  Plus,
  FileStack,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Tooltip,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle,DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

// Sample data for warehouse metrics and visualizations
const sampleWarehouseData = {
  warehouseMetrics: {
    capacityUtilization: 68,
    totalCapacity: 10000,
    currentLoad: 6800,
    sections: 12,
    piles: 48
  },
  orderMetrics: {
    pendingArrival: 42,
    inProcessing: 27,
    readyForDelivery: 35,
    total: 104
  },
  batchMetrics: {
    collecting: 5,
    processing: 3,
    readyForDelivery: 7,
    total: 15
  },
  sectionUtilization: [
    { name: 'General', capacity: 2500, used: 1750, percent: 70 },
    { name: 'Refrigerated', capacity: 1500, used: 1275, percent: 85 },
    { name: 'Oversized', capacity: 2000, used: 1100, percent: 55 },
    { name: 'Fragile', capacity: 1000, used: 650, percent: 65 },
    { name: 'High Value', capacity: 500, used: 425, percent: 85 },
    { name: 'Hazardous', capacity: 800, used: 480, percent: 60 },
  ],
  processingTimes: [
    { date: '01/04', inbound: 45, outbound: 38 },
    { date: '02/04', inbound: 52, outbound: 42 },
    { date: '03/04', inbound: 48, outbound: 40 },
    { date: '04/04', inbound: 61, outbound: 45 },
    { date: '05/04', inbound: 55, outbound: 48 },
    { date: '06/04', inbound: 67, outbound: 52 },
    { date: '07/04', inbound: 70, outbound: 58 },
  ],
  orderStatusDistribution: [
    { name: 'Pending Arrival', value: 42, color: '#1E88E5' },
    { name: 'In Processing', value: 27, color: '#FFA000' },
    { name: 'Ready for Delivery', value: 35, color: '#43A047' },
  ],
  recentArrivals: [
    { id: 'ORD-7829', origin: 'Tunis', destination: 'Sousse', status: 'CITY_ARRIVED_AT_SOURCE_WAREHOUSE', items: 4, timestamp: '2023-04-12T09:45:00Z' },
    { id: 'ORD-8102', origin: 'Sfax', destination: 'Tunis', status: 'CITY_ARRIVED_AT_DESTINATION_WAREHOUSE', items: 2, timestamp: '2023-04-12T10:15:00Z' },
    { id: 'ORD-7963', origin: 'Nabeul', destination: 'Monastir', status: 'CITY_ARRIVED_AT_SOURCE_WAREHOUSE', items: 6, timestamp: '2023-04-12T10:30:00Z' },
  ],
  pendingBatches: [
    { id: 'BAT-1245', type: 'LOCAL_WAREHOUSE_BUYERS', orders: 8, status: 'COLLECTING', dueBy: '2023-04-12T14:00:00Z' },
    { id: 'BAT-1253', type: 'INTERCITY', orders: 12, status: 'PROCESSING', dueBy: '2023-04-12T16:00:00Z' },
  ],
  staffActivity: [
    { name: 'Ahmed', tasks: 17, department: 'Receiving', efficiency: 92 },
    { name: 'Leila', tasks: 22, department: 'Sorting', efficiency: 88 },
    { name: 'Youssef', tasks: 15, department: 'Packing', efficiency: 95 },
  ]
};

export function WarehouseDashboard() {
  const [timeRange, setTimeRange] = useState<string>("7d");
  const [isNewSectionModalOpen, setIsNewSectionModalOpen] = useState(false);
  const [isNewPileModalOpen, setIsNewPileModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // For real implementation, replace this with actual data fetching
  const { data: warehouseData, isLoading } = useQuery({
    queryKey: ['warehouseDashboard', timeRange],
    queryFn: async () => {
      // In a real implementation, you would fetch from your API:
      // const response = await api.get(`/warehouse/dashboard?timeRange=${timeRange}`);
      // return response.data;
      
      // For now, return sample data
      return sampleWarehouseData;
    },
    initialData: sampleWarehouseData // Remove this in production
  });

  const { register: registerSection, handleSubmit: handleSubmitSection, reset: resetSection } = useForm();
  const { register: registerPile, handleSubmit: handleSubmitPile, reset: resetPile } = useForm();

  const onSubmitSection = async (data: any) => {
    try {
      // await api.post('/warehouse/sections', data);
      console.log('Section created:', data);
      setIsNewSectionModalOpen(false);
      resetSection();
      // Refetch warehouse data or update local state
    } catch (error) {
      console.error('Error creating section:', error);
    }
  };

  const onSubmitPile = async (data: any) => {
    try {
      // await api.post('/warehouse/piles', { ...data, sectionId: selectedSection });
      console.log('Pile created:', { ...data, sectionId: selectedSection });
      setIsNewPileModalOpen(false);
      resetPile();
      // Refetch warehouse data or update local state
    } catch (error) {
      console.error('Error creating pile:', error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-[120px] w-full" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="col-span-4 h-[400px]" />
          <Skeleton className="col-span-3 h-[400px]" />
        </div>
      </div>
    );
  }

  const {
    warehouseMetrics,
    orderMetrics,
    batchMetrics,
    sectionUtilization,
    processingTimes,
    orderStatusDistribution,
    recentArrivals,
    pendingBatches,
    staffActivity
  } = warehouseData;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Warehouse Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor warehouse operations and performance
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

      {/* Top Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Capacity Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Capacity Utilization
            </CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warehouseMetrics.capacityUtilization}%</div>
            <Progress value={warehouseMetrics.capacityUtilization} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {warehouseMetrics.currentLoad} / {warehouseMetrics.totalCapacity} kg used
            </p>
          </CardContent>
        </Card>

        {/* Order Processing Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Orders in Warehouse
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderMetrics.total}</div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs flex flex-col">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-medium">{orderMetrics.pendingArrival}</span>
              </div>
              <div className="text-xs flex flex-col">
                <span className="text-muted-foreground">Processing</span>
                <span className="font-medium">{orderMetrics.inProcessing}</span>
              </div>
              <div className="text-xs flex flex-col">
                <span className="text-muted-foreground">Ready</span>
                <span className="font-medium">{orderMetrics.readyForDelivery}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Batch Status Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Batches
            </CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batchMetrics.total}</div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs flex flex-col">
                <span className="text-muted-foreground">Collecting</span>
                <span className="font-medium">{batchMetrics.collecting}</span>
              </div>
              <div className="text-xs flex flex-col">
                <span className="text-muted-foreground">Processing</span>
                <span className="font-medium">{batchMetrics.processing}</span>
              </div>
              <div className="text-xs flex flex-col">
                <span className="text-muted-foreground">Ready</span>
                <span className="font-medium">{batchMetrics.readyForDelivery}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warehouse Structure Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Warehouse Structure
            </CardTitle>
            <FileStack className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{warehouseMetrics.sections}</div>
                <p className="text-xs text-muted-foreground">Sections</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{warehouseMetrics.piles}</div>
                <p className="text-xs text-muted-foreground">Piles</p>
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs flex items-center"
                onClick={() => setIsNewSectionModalOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" /> Add Section
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs flex items-center"
                onClick={() => setIsNewPileModalOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" /> Add Pile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="batches">Batches</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Processing Times Chart */}
          <div className="grid gap-4 md:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Processing Times (minutes)</CardTitle>
                <CardDescription>Average time to process orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={processingTimes}>
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
                      />
                      <Line
                        type="monotone"
                        dataKey="inbound"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        name="Inbound"
                      />
                      <Line
                        type="monotone"
                        dataKey="outbound"
                        stroke="hsl(var(--primary)/0.3)"
                        strokeWidth={2}
                        name="Outbound"
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload?.length) {
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex flex-col">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                      Inbound
                                    </span>
                                    <span className="font-bold text-muted-foreground">
                                      {payload[0].value} mins
                                    </span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                      Outbound
                                    </span>
                                    <span className="font-bold text-muted-foreground">
                                      {payload[1].value} mins
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Order Status Distribution */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
                <CardDescription>Current distribution by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={orderStatusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {orderStatusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload?.length) {
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="flex flex-col">
                                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                                    {payload[0].name}
                                  </span>
                                  <span className="font-bold text-muted-foreground">
                                    {payload[0].value} orders ({Math.round((payload[0].value / orderMetrics.total) * 100)}%)
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  {orderStatusDistribution.map((status) => (
                    <div key={status.name} className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
                      <span className="text-xs">{status.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Three Column Layout */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Recent Arrivals */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Arrivals</CardTitle>
                <CardDescription>Latest orders received</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentArrivals.map((order) => (
                    <div key={order.id} className="flex items-center justify-between border-b pb-2">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{order.id}</p>
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {order.items} items
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Truck className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {order.origin} → {order.destination}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {order.status.replace(/([A-Z])/g, ' $1').replace('_', ' ').trim()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="w-full">View All Arrivals</Button>
              </CardFooter>
            </Card>

            {/* Pending Batches */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Batches</CardTitle>
                <CardDescription>Batches requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingBatches.map((batch) => (
                    <div key={batch.id} className="flex items-center justify-between border-b pb-2">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{batch.id}</p>
                        <div className="flex items-center gap-1">
                          <Layers className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {batch.orders} orders
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            Due in {Math.floor((new Date(batch.dueBy).getTime() - new Date().getTime()) / (1000 * 60))} minutes
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={batch.status === 'COLLECTING' ? 'outline' : 'secondary'} 
                        className="text-xs"
                      >
                        {batch.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="w-full">View All Batches</Button>
              </CardFooter>
            </Card>

            {/* Staff Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Staff Activity</CardTitle>
                <CardDescription>Top performing staff</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staffActivity.map((staff) => (
                    <div key={staff.name} className="flex items-center justify-between border-b pb-2">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{staff.name}</p>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {staff.department}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <ClipboardCheck className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {staff.tasks} tasks completed
                          </p>
                        </div>
                      </div>
                      <div className="text-sm font-medium">
                        {staff.efficiency}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="w-full">View All Staff</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sections" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Warehouse Sections</h3>
            <Button 
              onClick={() => setIsNewSectionModalOpen(true)}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Add Section
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sectionUtilization.map((section) => (
              <Card key={section.name} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-md">{section.name}</CardTitle>
                  <CardDescription>
                    {section.used} / {section.capacity} kg used
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Utilization</span>
                      <span className="text-sm font-medium">{section.percent}%</span>
                    </div>
                    <Progress value={section.percent} />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSelectedSection('section-id-' + section.name.toLowerCase());
                      setIsNewPileModalOpen(true);
                    }}
                  >
                    Add Pile
                  </Button>
                  <Button variant="ghost" size="sm">View Details</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <div className="p-8 flex justify-center items-center">
            <EmptyState
              icon={<Package className="h-10 w-10" />}
              title="Order Management"
              description="Order management functionality would go here"
            />
          </div>
        </TabsContent>

        <TabsContent value="batches">
          <div className="p-8 flex justify-center items-center">
            <EmptyState
              icon={<Layers className="h-10 w-10" />}
              title="Batch Management"
              description="Batch management functionality would go here"
            />
          </div>
        </TabsContent>

        <TabsContent value="staff">
          <div className="p-8 flex justify-center items-center">
            <EmptyState
              icon={<Users className="h-10 w-10" />}
              title="Staff Management"
              description="Staff management functionality would go here"
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* New Section Dialog */}
      <Dialog open={isNewSectionModalOpen} onOpenChange={setIsNewSectionModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Warehouse Section</DialogTitle>
            <DialogDescription>
              Add a new section to organize your warehouse inventory.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitSection(onSubmitSection)}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Section Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Electronics, Refrigerated, etc."
                  {...registerSection('name', { required: true })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the purpose and contents of this section"
                  {...registerSection('description')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="capacity">Capacity (kg)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="0"
                    placeholder="Maximum weight capacity"
                    {...registerSection('capacity', { required: true, min: 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sectionType">Section Type</Label>
                  <Select {...registerSection('sectionType', { required: true })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STANDARD">Standard</SelectItem>
                      <SelectItem value="REFRIGERATED">Refrigerated</SelectItem>
                      <SelectItem value="FRAGILE">Fragile Items</SelectItem>
                      <SelectItem value="OVERSIZED">Oversized</SelectItem>
                      <SelectItem value="HIGH_VALUE">High Value</SelectItem>
                      <SelectItem value="HAZARDOUS">Hazardous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsNewSectionModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Section</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Pile Dialog */}
      <Dialog open={isNewPileModalOpen} onOpenChange={setIsNewPileModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Pile</DialogTitle>
            <DialogDescription>
              Add a new pile to a warehouse section for more granular organization.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPile(onSubmitPile)}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="sectionId">Warehouse Section</Label>
                <Select 
                  defaultValue={selectedSection || undefined}
                  onValueChange={(value) => setSelectedSection(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectionUtilization.map((section) => (
                      <SelectItem 
                        key={section.name}
                        value={'section-id-' + section.name.toLowerCase()}
                      >
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Pile Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., A1, Fast-Moving, etc."
                  {...registerPile('name', { required: true })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe this pile's purpose"
                  {...registerPile('description')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="capacity">Capacity (kg)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="0"
                    placeholder="Maximum weight capacity"
                    {...registerPile('capacity', { required: true, min: 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pileType">Pile Type</Label>
                  <Select {...registerPile('pileType', { required: true })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STANDARD">Standard</SelectItem>
                      <SelectItem value="HIGH_PRIORITY">High Priority</SelectItem>
                      <SelectItem value="OVERSIZED">Oversized</SelectItem>
                      <SelectItem value="FRAGILE">Fragile</SelectItem>
                      <SelectItem value="SPECIAL_HANDLING">Special Handling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsNewPileModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Pile</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 