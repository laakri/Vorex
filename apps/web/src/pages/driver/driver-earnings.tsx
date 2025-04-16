import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet,
  Calendar,
  CheckCircle,
  Download,
  Filter,
  Info,
  BarChart,
  Boxes,
} from "lucide-react";
import api from "@/lib/axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Progress } from "@/components/ui/progress";

// TypeScript interfaces
interface Earning {
  id: string;
  orderId: string;
  routeId: string;
  batchId: string;
  baseAmount: number;
  bonusAmount: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  order: {
    id: string;
    status: string;
    createdAt: string;
    isLocalDelivery: boolean;
  };
  route: {
    id: string;
    status: string;
    totalDistance: number;
  };
}

interface EarningsByStatus {
  status: string;
  count: number;
  amount: number;
}

interface EarningsByType {
  type: string;
  count: number;
  amount: number;
}

export function DriverEarnings() {
  const [timeRange, setTimeRange] = useState<string>("30d");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();
  
  // Fetch earnings data from API
  const { data, isLoading, error } = useQuery({
    queryKey: ["driver-earnings", timeRange, filterStatus],
    queryFn: async () => {
      try {
        const response = await api.get(`/drivers/earnings?timeRange=${timeRange}&status=${filterStatus}`);
        console.log("earnings", response.data);
        return response.data;
      } catch (err) {
        toast({
          title: "Error loading earnings",
          description: "Failed to load earnings data. Please try again.",
          variant: "destructive"
        });
        throw err;
      }
    }
  });
  
  // Destructure data for easier access
  const { 
    earnings = [], 
    summary = {
      totalEarnings: 0,
      baseAmount: 0,
      bonusAmount: 0,
      pendingAmount: 0,
      paidAmount: 0,
      earningsByStatus: [],
      earningsByType: [],
    }
  } = data || {};
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!earnings.length) return [];

    // Group earnings by date
    const earningsByDate = earnings.reduce((acc: Record<string, number>, earning: Earning) => {
      const date = new Date(earning.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      
      if (!acc[date]) {
        acc[date] = 0;
      }
      
      acc[date] += earning.totalAmount;
      return acc;
    }, {});

    // Sort dates
    const sortedDates = Object.keys(earningsByDate).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA.getTime() - dateB.getTime();
    });

    return sortedDates.map(date => ({
      date,
      earnings: earningsByDate[date]
    }));
  };

  // If loading, show skeleton UI
  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 overflow-auto">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Driver Earnings</h2>
            <p className="text-muted-foreground">
              Track your earnings and payment status
            </p>
          </div>
          <div className="h-10 w-[180px] bg-muted animate-pulse rounded-md" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded-full" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-24 bg-muted animate-pulse rounded-md mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <div className="h-6 w-32 bg-muted animate-pulse rounded-md" />
              <div className="h-4 w-48 bg-muted animate-pulse rounded-md mt-2" />
            </CardHeader>
            <CardContent>
              <div className="h-[300px] bg-muted animate-pulse rounded-md" />
            </CardContent>
          </Card>
          
          <Card className="col-span-3">
            <CardHeader>
              <div className="h-6 w-32 bg-muted animate-pulse rounded-md" />
              <div className="h-4 w-48 bg-muted animate-pulse rounded-md mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded-md" />
                    <div className="h-4 w-16 bg-muted animate-pulse rounded-md" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded-md mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded-md" />
                  <div className="h-4 w-16 bg-muted animate-pulse rounded-md" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // If error, show error state
  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 overflow-auto">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Driver Earnings</h2>
            <p className="text-muted-foreground">
              Track your earnings and payment status
            </p>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="rounded-full bg-destructive/10 p-3">
                <Info className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Error Loading Earnings</h3>
                <p className="text-sm text-muted-foreground">
                  There was an error loading your earnings data. Please try again later.
                </p>
              </div>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 overflow-auto">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Driver Earnings</h2>
          <p className="text-muted-foreground">
            Track your earnings and payment status
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select
            value={timeRange}
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={filterStatus}
            onValueChange={setFilterStatus}
          >
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalEarnings)}</div>
            <p className="text-xs text-muted-foreground">
              From {earnings.length} deliveries
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Base Amount</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.baseAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {((summary.baseAmount / summary.totalEarnings) * 100).toFixed(0)}% of total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bonus Amount</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.bonusAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {((summary.bonusAmount / summary.totalEarnings) * 100).toFixed(0)}% of total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payment</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {summary.earningsByStatus.find((s: EarningsByStatus) => s.status === 'PENDING')?.count || 0} pending payments
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Earnings Trend</CardTitle>
            <CardDescription>
              Your earnings over the past {timeRange}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {earnings.length === 0 ? (
              <EmptyState
                icon={<BarChart className="h-8 w-8" />}
                title="No earnings data"
                description="Complete deliveries to see your earnings trend."
              />
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={prepareChartData()}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <XAxis dataKey="date" />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <RechartsTooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Earnings']}
                    />
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
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Earnings by Type</CardTitle>
            <CardDescription>
              Distribution of earnings by delivery type
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summary.earningsByType.length === 0 ? (
              <EmptyState
                icon={<Boxes className="h-8 w-8" />}
                title="No type data"
                description="Complete deliveries to see type distribution."
              />
            ) : (
              <div className="space-y-4">
                {summary.earningsByType.map((type: EarningsByType) => (
                  <div key={type.type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{type.type}</span>
                      <span className="text-sm">{formatCurrency(type.amount)}</span>
                    </div>
                    <Progress 
                      value={(type.amount / summary.totalEarnings) * 100} 
                      className="h-2" 
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Earnings History</CardTitle>
          <CardDescription>
            Detailed list of all your earnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {earnings.length === 0 ? (
            <EmptyState
              icon={<Wallet className="h-8 w-8" />}
              title="No earnings history"
              description="Complete deliveries to see your earnings history."
            />
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Base Amount</TableHead>
                    <TableHead>Bonus Amount</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earnings.map((earning: Earning) => (
                    <TableRow key={earning.id}>
                      <TableCell>{formatDate(earning.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{earning.order.id.substring(0, 8)}</span>
                          <span className="text-xs text-muted-foreground">
                            {earning.order.status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">Route {earning.route.id.substring(0, 8)}</span>
                          <span className="text-xs text-muted-foreground">
                            {earning.route.totalDistance ? `${earning.route.totalDistance.toFixed(1)} km` : 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(earning.baseAmount)}</TableCell>
                      <TableCell>{formatCurrency(earning.bonusAmount)}</TableCell>
                      <TableCell className="font-bold">
                        {formatCurrency(earning.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={earning.status === 'PAID' ? 'default' : 'secondary'}>
                          {earning.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 