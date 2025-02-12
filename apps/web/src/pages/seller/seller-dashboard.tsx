import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  DollarSign,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Progress } from "@/components/ui/progress";

type OrderStatus = 'pending' | 'processing' | 'readyForPickup' | 'inTransit' | 'delivered' | 'cancelled';

type OrderMetrics = {
  [K in OrderStatus]: number;
} & {
  total: number;
  totalAmount: number;
};

type ProductMetrics = {
  totalProducts: number;
  lowStock: number;
  outOfStock: number;
};

type RevenueDataPoint = {
  date: string;
  amount: number;
  orders: number;
};

type GovernorateRevenue = {
  governorate: string;
  amount: number;
};

type TopProduct = {
  id: string;
  name: string;
  totalSold: number;
  revenue: number;
  currentStock: number;
};

type DashboardData = {
  orderMetrics: OrderMetrics;
  productMetrics: ProductMetrics;
  revenueData: {
    daily: RevenueDataPoint[];
    byGovernorate: GovernorateRevenue[];
  };
  topProducts: TopProduct[];
};

// Mock data with proper typing
const mockData: DashboardData = {
  orderMetrics: {
    total: 150,
    pending: 25,
    processing: 35,
    readyForPickup: 15,
    inTransit: 40,
    delivered: 30,
    cancelled: 5,
    totalAmount: 15000,
  },
  productMetrics: {
    totalProducts: 45,
    lowStock: 8,
    outOfStock: 3,
  },
  revenueData: {
    daily: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString(),
      amount: Math.floor(Math.random() * 5000) + 1000,
      orders: Math.floor(Math.random() * 30) + 10,
    })),
    byGovernorate: [
      { governorate: "Tunis", amount: 25000 },
      { governorate: "Sfax", amount: 18000 },
      { governorate: "Sousse", amount: 15000 },
    ],
  },
  topProducts: Array.from({ length: 5 }, (_, i) => ({
    id: `prod-${i + 1}`,
    name: `Product ${i + 1}`,
    totalSold: Math.floor(Math.random() * 100) + 20,
    revenue: Math.floor(Math.random() * 10000) + 1000,
    currentStock: Math.floor(Math.random() * 50) + 5,
  })),
};

const ordersByStatus = [
  { date: '01/03', pending: 12, processing: 8, delivered: 18 },
  { date: '02/03', pending: 15, processing: 10, delivered: 20 },
  { date: '03/03', pending: 10, processing: 12, delivered: 22 },
  { date: '04/03', pending: 8, processing: 15, delivered: 25 },
  { date: '05/03', pending: 14, processing: 11, delivered: 19 },
  { date: '06/03', pending: 16, processing: 9, delivered: 21 },
  { date: '07/03', pending: 11, processing: 13, delivered: 24 },
];

const recentOrders = [
  {
    id: '1',
    customerName: 'Ahmed Ben Ali',
    status: 'PENDING',
    amount: 250.00,
    items: 3,
    location: 'Tunis',
    date: new Date().toISOString(),
  },
  // Add more orders...
];

// Updated mock data for financial insights
const revenueByCategory = [
  { category: 'Electronics', revenue: 15800, percentage: 35 },
  { category: 'Fashion', revenue: 12400, percentage: 28 },
  { category: 'Home', revenue: 8900, percentage: 20 },
  { category: 'Sports', revenue: 7200, percentage: 17 },
];

const dailyRevenue = [
  { time: '00:00', revenue: 1200 },
  { time: '04:00', revenue: 800 },
  { time: '08:00', revenue: 2400 },
  { time: '12:00', revenue: 3800 },
  { time: '16:00', revenue: 4200 },
  { time: '20:00', revenue: 3100 },
];

const monthlyTrends = [
  { month: 'Jan', revenue: 42000, orders: 380 },
  { month: 'Feb', revenue: 38000, orders: 320 },
  { month: 'Mar', revenue: 45000, orders: 400 },
];

export function SellerDashboard() {
  const [timeRange, setTimeRange] = useState<string>("7d");

  // Simplified mock data for the chart
  const chartData = [
    { name: 'Mon', revenue: 4000 },
    { name: 'Tue', revenue: 3000 },
    { name: 'Wed', revenue: 2000 },
    { name: 'Thu', revenue: 2780 },
    { name: 'Fri', revenue: 1890 },
    { name: 'Sat', revenue: 2390 },
    { name: 'Sun', revenue: 3490 },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Your store's performance overview
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
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Total Revenue",
                value: `${mockData.orderMetrics.totalAmount.toLocaleString()} DT`,
                icon: DollarSign,
              },
              {
                title: "Total Orders",
                value: mockData.orderMetrics.total.toString(),
                icon: ShoppingCart,
              },
              {
                title: "Products",
                value: mockData.productMetrics.totalProducts.toString(),
                icon: Package,
              },
              {
                title: "Average Order",
                value: `${(mockData.orderMetrics.totalAmount / mockData.orderMetrics.total).toFixed(2)} DT`,
                icon: TrendingUp,
              }
            ].map((metric) => (
              <Card key={metric.title}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between space-x-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                      <p className="text-2xl font-bold">{metric.value}</p>
                    </div>
                    <div className={`p-2 rounded-full bg-primary/10`}>
                      <metric.icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Revenue & Orders</CardTitle>
                <CardDescription>Daily revenue and order count</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockData.revenueData.daily}>
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
                        dataKey="amount"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest customer orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center">
                      <div className="space-y-1 flex-1">
                        <p className="text-sm font-medium leading-none">
                          {order.customerName}
                        </p>
                        <div className="flex items-center text-sm text-muted-foreground gap-2">
                          <Package className="h-4 w-4" />
                          <span>{order.items} items</span>
                          <span>•</span>
                          <span>{order.location}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge 
                          variant={order.status === 'pending' ? 'secondary' : 'default'}
                        >
                          {order.status}
                        </Badge>
                        <span className="font-bold">{order.amount} DT</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Orders by Status</CardTitle>
                <CardDescription>Daily order status distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ordersByStatus}>
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
                        dataKey="delivered"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="processing"
                        stroke="hsl(var(--primary)/0.6)"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="pending"
                        stroke="hsl(var(--primary)/0.3)"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>Best performing items</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockData.topProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.totalSold} sold
                        </p>
                      </div>
                      <div className="font-bold">
                        {product.revenue.toLocaleString()} DT
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
                <CardDescription>Distribution of earnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueByCategory.map((category) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{category.category}</p>
                        <div className="flex items-center gap-2">
                          <Progress value={category.percentage} className="w-[60px]" />
                          <span className="text-sm text-muted-foreground">
                            {category.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="font-bold">
                        {category.revenue.toLocaleString()} DT
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Revenue Pattern</CardTitle>
                <CardDescription>Revenue distribution by time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyRevenue}>
                      <XAxis 
                        dataKey="time" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value} DT`}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Performance</CardTitle>
                <CardDescription>Revenue vs Orders trend</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrends}>
                      <XAxis 
                        dataKey="month" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        yAxisId="left"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value} DT`}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="orders"
                        stroke="hsl(var(--primary)/0.3)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Revenue Chart - Full Width */}
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Daily revenue trend</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#888888"
                    />
                    <YAxis 
                      stroke="#888888"
                      tickFormatter={(value) => `${value} DT`}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* ... stats cards remain the same ... */}
              </div>
            </CardContent>
          </Card>

          {/* Two Column Layout */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
                <CardDescription>Current order distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(mockData.orderMetrics)
                    .filter(([key]) => key !== 'total' && key !== 'totalAmount')
                    .map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {status.replace(/([A-Z])/g, ' $1').trim()}
                          </Badge>
                          <span className="text-sm">{count} orders</span>
                        </div>
                        <Progress 
                          value={(count / mockData.orderMetrics.total) * 100} 
                          className="w-[100px]" 
                        />
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>Best performing items</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockData.topProducts.map(product => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.totalSold} sold
                        </p>
                      </div>
                      <div className="font-medium">
                        {product.revenue.toLocaleString()} DT
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders">
          {/* Orders specific content */}
        </TabsContent>

        <TabsContent value="products">
          {/* Products specific content */}
        </TabsContent>
      </Tabs>
    </div>
  );
}

