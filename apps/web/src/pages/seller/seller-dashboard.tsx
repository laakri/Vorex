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
  BarChart,
  Clock,
  Calendar,
  PieChart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  Tooltip,
} from "recharts";
import { Progress } from "@/components/ui/progress";
import api from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

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
];




export function SellerDashboard() {
  const [timeRange, setTimeRange] = useState<string>("7d");

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['sellerDashboard', timeRange],
    queryFn: async () => {
      const response = await api.get(`/sellers/dashboard?timeRange=${timeRange}`);
      return response.data;
    }
  });

  // Loading states for different sections
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
    orderMetrics,
    productMetrics,
    revenueData,
    topProducts
  } = dashboardData || {
    orderMetrics: { total: 0, totalAmount: 0 },
    productMetrics: { totalProducts: 0 },
    revenueData: { daily: [], byGovernorate: [] },
    topProducts: []
  };

  const hasOrders = orderMetrics.total > 0;
  const hasProducts = productMetrics.totalProducts > 0;
  const hasRevenue = orderMetrics.totalAmount > 0;

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
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Total Revenue",
                value: hasRevenue ? `${orderMetrics.totalAmount.toLocaleString()} DT` : "0 DT",
                icon: DollarSign,
              },
              {
                title: "Total Orders",
                value: orderMetrics.total.toString(),
                icon: ShoppingCart,
              },
              {
                title: "Products",
                value: productMetrics.totalProducts.toString(),
                icon: Package,
              },
              {
                title: "Average Order",
                value: `${(orderMetrics.totalAmount / orderMetrics.total).toFixed(2)} DT`,
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
                    <div className={`p-2 rounded-full ${hasRevenue ? 'bg-primary/10' : 'bg-muted'}`}>
                      <metric.icon className={`h-5 w-5 ${hasRevenue ? 'text-primary' : 'text-muted-foreground'}`} />
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
                {hasOrders ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueData.daily}>
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
                ) : (
                  <EmptyState
                    icon={<BarChart />}
                    title="No Revenue Data"
                    description="Start making sales to see your revenue trends here"
                    className="h-[300px]"
                  />
                )}
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest customer orders</CardDescription>
              </CardHeader>
              <CardContent>
                {hasOrders ? (
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
                ) : (
                  <EmptyState
                    icon={<Package/>}
                    title="No Orders Yet" 
                    description="Your recent orders will appear here"
                  />
                )}
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
                {hasOrders ? (
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
                ) : (
                  <EmptyState
                    icon={<BarChart/>}
                    title="No Order Data"
                    description="Order status trends will appear here"
                    className="h-[300px]"
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>Best performing items</CardDescription>
              </CardHeader>
              <CardContent>
                {hasProducts ? (
                  <div className="space-y-4">
                    {topProducts.map((product :any) => (
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
                ) : (
                  <EmptyState
                  icon={<Package/>}
                  title="No Products"
                    description="Add products to see performance metrics"
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Revenue by Category
                </CardTitle>
                <CardDescription>Distribution of earnings</CardDescription>
              </CardHeader>
              <CardContent>
                {hasRevenue ? (
                  <div className="space-y-4">
                    {revenueData.byCategory.map((category:any) => (
                      <div key={category.category} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {category.category}
                          </p>
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
                ) : (
                  <EmptyState
                    icon={<PieChart />}
                    title="No Category Data"
                    description="Add products and make sales to see category distribution"
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Daily Revenue Pattern
                </CardTitle>
                <CardDescription>Revenue distribution by time</CardDescription>
              </CardHeader>
              <CardContent>
                {hasRevenue ? (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={revenueData.dailyPattern}>
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
                        <Bar
                          dataKey="revenue"
                          fill="hsl(var(--primary))"
                          radius={[4, 4, 0, 0]}
                        />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState
                    icon={<Clock />}
                    title="No Daily Patterns"
                    description="Make sales to see daily revenue patterns"
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Monthly Performance
                </CardTitle>
                <CardDescription>Revenue vs Orders trend</CardDescription>
              </CardHeader>
              <CardContent>
                {hasRevenue ? (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueData.monthlyPerformance}>
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
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="revenue"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="orders"
                          stroke="hsl(var(--primary)/0.3)"
                          strokeWidth={2}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload?.length) {
                              return (
                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="flex flex-col">
                                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                                        Revenue
                                      </span>
                                      <span className="font-bold text-muted-foreground">
                                        {payload[0].value} DT
                                      </span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                                        Orders
                                      </span>
                                      <span className="font-bold text-muted-foreground">
                                        {payload[1].value}
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
                ) : (
                  <EmptyState
                    icon={<Calendar />}
                    title="No Monthly Data"
                    description="Make sales to see monthly performance"
                  />
                )}
              </CardContent>
            </Card>
          </div>


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
                  {Object.entries(orderMetrics)
                    .filter(([key]) => key !== 'total' && key !== 'totalAmount')
                    .map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {String(status).replace(/([A-Z])/g, ' $1').trim()}
                          </Badge>
                          <span className="text-sm">{Number(count)} orders</span>
                        </div>
                        <Progress 
                          value={(Number(count) / orderMetrics.total) * 100} 
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
                  {topProducts.map((product :any) => (
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

