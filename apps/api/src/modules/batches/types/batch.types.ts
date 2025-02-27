export interface BatchConfig {
  maxOrdersPerBatch: number;
  maxWeightPerBatch: number;
  maxVolumePerBatch: number;
  maxDistanceRadius: number;
  timeWindow: number;
}

export interface BatchOrder {
  id: string;
  sellerId: string;
  warehouseId: string;
  status: string;
  totalAmount: number;
  address: string;
  city: string;
  governorate: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  orderItems: OrderItem[];
}

export interface OrderItem {
  id: string;
  quantity: number;
  weight: number;
  dimensions: string;
}

export interface BatchGroup {
  orders: BatchOrder[];
  totalWeight: number;
  totalVolume: number;
  zone: string;
}