export class DashboardResponseDto {
  orderMetrics: {
    total: number;
    pending: number;
    processing: number;
    readyForPickup: number;
    inTransit: number;
    delivered: number;
    cancelled: number;
    totalAmount: number;
  };

  productMetrics: {
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
  };

  revenueData: {
    daily: {
      date: string;
      amount: number;
      orders: number;
    }[];
    byGovernorate: {
      governorate: string;
      amount: number;
    }[];
  };

  topProducts: {
    id: string;
    name: string;
    totalSold: number;
    revenue: number;
    currentStock: number;
  }[];
} 