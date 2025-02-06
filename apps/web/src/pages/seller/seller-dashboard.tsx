import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  PieChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import { Brain, AlertTriangle, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight, ChevronRight } from "lucide-react";

// Mock data - Replace with real data
const metrics = [
  {
    title: "Total Revenue",
    value: "12,450 DT",
    change: "+12.5%",
    trend: "up",
  },
  {
    title: "Active Orders",
    value: "25",
    change: "+3.2%",
    trend: "up",
  },
  {
    title: "Products Sold",
    value: "142",
    change: "-2.1%",
    trend: "down",
  },
  {
    title: "Pending Deliveries",
    value: "18",
    change: "+5.4%",
    trend: "up",
  },
];

// Mock data for charts
const revenueData = [
  { month: "Jan", revenue: 8400, orders: 45 },
  { month: "Feb", revenue: 9200, orders: 52 },
  { month: "Mar", revenue: 7800, orders: 48 },
  { month: "Apr", revenue: 12450, orders: 62 },
  { month: "May", revenue: 11200, orders: 55 },
  { month: "Jun", revenue: 15000, orders: 70 },
];

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  orders: {
    label: "Orders",
    color: "hsl(var(--chart-2))",
  },
};

// Enhanced AI insights
const aiInsights = {
  summary: {
    score: 87,
    trend: "up",
    changes: 12,
    recommendations: 5,
  },
  quickActions: [
    {
      title: "Optimize Pricing",
      description: "3 products need price adjustment",
      impact: "+15% potential revenue",
      confidence: 92,
      icon: TrendingUp,
      action: "Review Now",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Stock Alert",
      description: "Potential stockout in 5 days",
      impact: "Critical",
      confidence: 89,
      icon: AlertTriangle,
      action: "Order Stock",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
  ],
  opportunities: [
    {
      title: "Bundle Opportunity",
      description: "Create gaming accessories bundle",
      impact: "+₫8,500 per sale",
      confidence: 94,
      icon: Target,
      progress: 75,
    },
    {
      title: "Price Optimization",
      description: "Adjust pricing for competitive edge",
      impact: "+12% revenue potential",
      confidence: 88,
      icon: PieChart,
      progress: 65,
    },
  ],
};

export function SellerDashboard() {
  const [timeRange, setTimeRange] = useState("7d");

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, here's what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </p>
                {metric.trend === "up" ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <h3 className="text-2xl font-bold">{metric.value}</h3>
                <span
                  className={cn(
                    "text-sm",
                    metric.trend === "up" ? "text-green-500" : "text-red-500"
                  )}
                >
                  {metric.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 grid-cols-12">
        {/* AI Insights Section */}
        <Card className="col-span-12">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Business Insights</CardTitle>
                  <CardDescription>
                    AI-powered recommendations for your growth
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    AI Score: {aiInsights.summary.score}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid gap-6">
              {/* Quick Actions */}
              <div className="grid gap-4 grid-cols-2">
                {aiInsights.quickActions.map((action, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    className={cn(
                      "p-4 rounded-xl border space-y-4",
                      "hover:shadow-lg transition-all duration-200",
                      action.bgColor
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className={cn("p-2 rounded-lg", action.bgColor)}>
                        <action.icon className={cn("h-5 w-5", action.color)} />
                      </div>
                      <Badge variant="secondary" className="font-medium">
                        {action.confidence}% confidence
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-semibold">{action.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={action.color}>
                        {action.impact}
                      </Badge>
                      <Button variant="ghost" size="sm" className="gap-2">
                        {action.action} <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Growth Opportunities */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold">Growth Opportunities</h3>
                    <p className="text-sm text-muted-foreground">
                      AI-detected opportunities to grow your business
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-2">
                    View All <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-4 grid-cols-2">
                  {aiInsights.opportunities.map((opportunity, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl border space-y-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <opportunity.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{opportunity.title}</h4>
                            <Badge variant="outline">
                              {opportunity.confidence}% confidence
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {opportunity.description}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Progress
                          </span>
                          <span className="font-medium">
                            {opportunity.progress}%
                          </span>
                        </div>
                        <Progress
                          value={opportunity.progress}
                          className="h-2"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="font-medium">
                          {opportunity.impact}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          Take Action
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Section */}
        <div className="col-span-12 grid gap-4 grid-cols-2">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Monthly revenue and orders</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      padding={{ left: 20, right: 20 }}
                    />
                    <YAxis
                      yAxisId="left"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}DT`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--color-revenue)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="orders"
                      stroke="var(--color-orders)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
            <CardFooter className="flex justify-between text-sm text-muted-foreground">
              <div>
                Total Revenue:{" "}
                <span className="font-medium text-foreground">64,050 DT</span>
              </div>
              <div>332 Orders</div>
            </CardFooter>
          </Card>

          {/* Products Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Products Performance</CardTitle>
              <CardDescription>Top selling products</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-[300px]" config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: "Product A", value: 4500 },
                      { name: "Product B", value: 3800 },
                      { name: "Product C", value: 3200 },
                      { name: "Product D", value: 2800 },
                      { name: "Product E", value: 2200 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}DT`}
                    />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="value"
                      fill="hsl(var(--chart-1))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
            <CardFooter>
              <Button variant="link" className="ml-auto">
                View All Products
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
