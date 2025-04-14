import { format } from 'date-fns';
import { Package, Clock, MapPin, Truck } from 'lucide-react';

interface OrderStatusHeaderProps {
  orderData: any;
}

const OrderStatusHeader = ({ orderData }: OrderStatusHeaderProps) => {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not available';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return format(date, 'PPP');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not available';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid time';
      return format(date, 'p');
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Invalid time';
    }
  };

  const formatEstimatedDelivery = () => {
    if (!orderData?.estimatedDelivery) return 'Not available';
    
    try {
      const estimatedDate = new Date(orderData.estimatedDelivery);
      if (isNaN(estimatedDate.getTime())) return 'Invalid date';
      
      const today = new Date();
      
      if (estimatedDate.toDateString() === today.toDateString()) {
        return `Today, ${formatTime(orderData.estimatedDelivery)}`;
      }
      
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      
      if (estimatedDate.toDateString() === tomorrow.toDateString()) {
        return `Tomorrow, ${formatTime(orderData.estimatedDelivery)}`;
      }
      
      return `${formatDate(orderData.estimatedDelivery)}, ${formatTime(orderData.estimatedDelivery)}`;
    } catch (error) {
      console.error('Error formatting estimated delivery:', error);
      return 'Invalid date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'processing':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'shipped':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'delivered':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <Package className="h-5 w-5" />;
      case 'processing':
        return <Clock className="h-5 w-5" />;
      case 'shipped':
        return <Truck className="h-5 w-5" />;
      case 'delivered':
        return <MapPin className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };


  // Helper function to safely render address
  const renderAddress = (address: any) => {
    if (!address || typeof address !== 'object') return 'Not available';
    
    const parts = [];
    if (address.city) parts.push(address.city);
    if (address.governorate) parts.push(address.governorate);
    
    return parts.length > 0 ? parts.join(', ') : 'Not available';
  };

  return (
    <div className="rounded-xl border border-border/40 bg-background/50 shadow-sm backdrop-blur-sm">
      <div className="border-b border-border/40 bg-muted/30 px-6 py-4">
        <h2 className="text-xl font-semibold text-foreground">Order Status</h2>
      </div>
      
      <div className="p-6">
        <div className="flex flex-col gap-6">
          {/* Status Badge */}
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 rounded-full border px-4 py-2 ${getStatusColor(orderData?.status)}`}>
              {getStatusIcon(orderData?.status)}
              <span className="font-medium">{orderData?.status || 'Unknown'}</span>
            </div>
            
            <div className="h-4 w-px bg-border/40" />
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Order placed on {formatDate(orderData?.createdAt)}</span>
            </div>
          </div>
          
          {/* Estimated Delivery */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span className="font-medium text-foreground">Estimated Delivery:</span>
            </div>
            <p className="mt-2 text-lg font-semibold text-primary">{formatEstimatedDelivery()}</p>
          </div>
          
          {/* Current Location */}
          {orderData?.currentLocation && (
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 text-primary/70" />
              <div>
                <span className="text-sm text-muted-foreground">Current Location:</span>
                <p className="font-medium text-foreground">
                  {typeof orderData.currentLocation === 'string' 
                    ? orderData.currentLocation 
                    : renderAddress(orderData.currentLocation)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Last updated: {formatTime(orderData?.lastLocationUpdate)}
                </p>
              </div>
            </div>
          )}
          
          {/* Delivery Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Delivery Progress</span>
              <span className="font-medium text-foreground">{orderData?.deliveryProgress || 0}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted/30">
              <div 
                className="h-full rounded-full bg-primary transition-all duration-500 ease-in-out" 
                style={{ width: `${orderData?.deliveryProgress || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusHeader; 