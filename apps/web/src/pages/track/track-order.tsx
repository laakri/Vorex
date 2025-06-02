import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import api from '@/lib/axios';
import OrderStatusHeader from '@/pages/track/track-OrderStatusHeader';
import OrderDetailsCard from '@/pages/track/track-OrderDetailsCard';
import DeliveryMapTimeline from '@/pages/track/track-DeliveryMapTimeline';
import { Loader2, ArrowLeft, MapPin, Calendar } from 'lucide-react';

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
  const navigate = useNavigate();

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

  const formatEstimatedDelivery = () => {
    if (!orderData?.estimatedDelivery) return 'Not available';
    
    const estimatedDate = new Date(orderData.estimatedDelivery);
    const today = new Date();
    
    if (estimatedDate.toDateString() === today.toDateString()) {
      return `Today, ${format(estimatedDate, 'h:mm a')}`;
    }
    
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    if (estimatedDate.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${format(estimatedDate, 'h:mm a')}`;
    }
    
    return `${format(estimatedDate, 'MMM d, yyyy')}, ${format(estimatedDate, 'h:mm a')}`;
  };

  const getStatusColor = () => {
    const category = orderData?.statusCategory;
    
    switch (category) {
      case 'PICKUP':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'TRANSIT':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'DELIVERED':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'DELAYED':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const handleGoBack = () => {
    navigate(-1); // Go back to the previous page in history
  };

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
          onClick={handleGoBack}
          className="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/90">
      <div className="container mx-auto px-4 py-8 md:px-6 lg:max-w-6xl">
        {/* Header with back button */}
        <div className="mb-6 flex items-center">
          <button 
            onClick={handleGoBack}
            className="mr-4 flex items-center text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold">Order Tracking</h1>
            <p className="text-sm text-muted-foreground">ID: {orderData.orderId}</p>
          </div>
        </div>

        {/* Estimated Delivery Banner */}
        <div className="mb-8 overflow-hidden rounded-xl border border-primary/20 bg-primary/5 shadow-sm">
          <div className="flex flex-col items-center justify-center p-6 text-center md:flex-row md:justify-between md:p-8">
            <div className="mb-4 flex items-center md:mb-0">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-semibold">Estimated Delivery</h2>
                <p className="text-2xl font-bold text-primary">{formatEstimatedDelivery()}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className={`rounded-full px-4 py-2 text-sm font-medium ${getStatusColor()}`}>
                {orderData.status.replace(/_/g, ' ')}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <OrderStatusHeader orderData={orderData} />
            <DeliveryMapTimeline orderData={orderData} />
          </div>
          
          <div className="lg:col-span-1">
            <OrderDetailsCard orderData={orderData} />
          </div>
        </div>

        {/* Delivery Progress */}
        <div className="mt-8 overflow-hidden rounded-xl border border-border/40 bg-background/50 shadow-sm backdrop-blur-sm">
          <div className="border-b border-border/40 bg-muted/30 px-6 py-4">
            <h2 className="text-xl font-semibold text-foreground">Delivery Progress</h2>
          </div>
          
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Progress</span>
              <span className="text-sm font-medium text-primary">{orderData.deliveryProgress}%</span>
            </div>
            
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div 
                className="h-full rounded-full bg-primary transition-all duration-500 ease-in-out" 
                style={{ width: `${orderData.deliveryProgress}%` }}
              ></div>
            </div>
            
            <div className="mt-6">
              <h3 className="mb-4 text-sm font-medium text-foreground">Current Location</h3>
              <div className="flex items-start gap-3 rounded-lg border border-border/40 bg-muted/20 p-4">
                <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">
                    {orderData.currentLocation.businessName || 'In Transit'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {orderData.currentLocation.city}, {orderData.currentLocation.governorate}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackOrderPage;