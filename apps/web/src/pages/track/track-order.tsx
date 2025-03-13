import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '@/lib/axios';
import OrderStatusHeader from '@/pages/track/track-OrderStatusHeader';
import OrderDetailsCard from '@/pages/track/track-OrderDetailsCard';
import DeliveryMapTimeline from '@/pages/track/track-DeliveryMapTimeline';
import { Loader2 } from 'lucide-react';

interface OrderTrackingData {
  orderId: string;
  status: string;
  statusDescription: string;
  statusCategory: string;
  createdAt: string;
  updatedAt: string;
  customerInfo: {
    name: string;
    email: string;
    address: string;
    city: string;
    governorate: string;
    postalCode: string;
    phone: string;
  };
  sellerInfo: {
    businessName: string;
    city: string;
    governorate: string;
    phone: string;
    address: string;
  };
  currentLocation: {
    type: string;
    businessName: string;
    city: string;
    governorate: string;
  };
  estimatedDelivery: string;
  timeline: {
    status: string;
    timestamp: string;
    description: string;
  }[];
  itemsSummary: {
    name: string;
    quantity: number;
  }[];
  deliveryProgress: number;
  routeStops: {
    id: string;
    address: string;
    latitude: number;
    longitude: number;
    isPickup: boolean;
    sequenceOrder: number;
    isCompleted: boolean;
    completedAt: string | null;
    notes: string | null;
  }[];
  totalAmount: number;
  notes: string;
  batchInfo: {
    id: string;
    status: string;
    driver: {
      name: string;
      phone: string;
      rating: number;
      totalDeliveries: number;
      licenseType: string;
      status: string;
      vehicle: {
        type: string;
        model: string;
        make: string;
        plateNumber: string;
        year: number;
        capacity: number;
        status: string;
      };
    };
    routeInfo: {
      status: string;
      startedAt: string;
      completedAt: string | null;
      estimatedDuration: number;
      totalDistance: number;
      stops: any[];
    };
  };
  warehouseInfo: {
    name: string;
    address: string;
    city: string;
    governorate: string;
    phone: string;
    location: string;
  };
  isLocalDelivery: boolean;
}

const TrackOrderPage = () => {
  const { trackingId } = useParams<{ trackingId: string }>();
  const [orderData, setOrderData] = useState<OrderTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/orders/track/${trackingId}`);
        setOrderData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching order data:', err);
        setError('Failed to load order tracking information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (trackingId) {
      fetchOrderData();
    }
  }, [trackingId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="ml-2 text-lg font-medium">Loading order details...</span>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="container mx-auto mt-10 max-w-4xl rounded-lg border border-red-200 bg-red-50 p-8 text-center">
        <h2 className="mb-4 text-2xl font-bold text-red-700">Error</h2>
        <p className="text-red-600">{error || 'Order information not found'}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 lg:max-w-6xl mt-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold ">Track Your Order</h1>
        <p className="text-gray-600">Order ID: {orderData.orderId}</p>
      </div>

      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OrderStatusHeader orderData={orderData} />
          <DeliveryMapTimeline orderData={orderData} />
        </div>
        
        <div className="lg:col-span-1">
          <OrderDetailsCard orderData={orderData} />
        </div>
      </div>
    </div>
  );
};

export default TrackOrderPage;