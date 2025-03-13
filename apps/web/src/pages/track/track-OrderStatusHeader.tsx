import {  format } from 'date-fns';
import { Package, Truck, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface OrderStatusHeaderProps {
  orderData: any;
}

const OrderStatusHeader = ({ orderData }: OrderStatusHeaderProps) => {
  const getStatusIcon = () => {
    const category = orderData.statusCategory;
    
    switch (category) {
      case 'PICKUP':
        return <Package className="h-10 w-10 text-amber-500" />;
      case 'TRANSIT':
        return <Truck className="h-10 w-10 text-blue-500" />;
      case 'DELIVERED':
        return <CheckCircle className="h-10 w-10 text-green-500" />;
      case 'DELAYED':
        return <AlertTriangle className="h-10 w-10 text-red-500" />;
      default:
        return <Clock className="h-10 w-10 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    const category = orderData.statusCategory;
    
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'PPP');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'p');
  };

  const getEstimatedDelivery = () => {
    if (!orderData.estimatedDelivery) return 'Not available';
    
    const estimatedDate = new Date(orderData.estimatedDelivery);
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
  };

  return (
    <div className="mb-8 overflow-hidden rounded-xl border border-border/40 bg-background/50 shadow-sm backdrop-blur-sm">
      <div className="border-b border-border/40 bg-muted/30 px-6 py-4">
        <h2 className="text-xl font-semibold text-foreground">Order Status</h2>
      </div>
      
      <div className="p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            {getStatusIcon()}
            <div>
              <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${getStatusColor()}`}>
                {orderData.status.replace(/_/g, ' ')}
              </span>
              <p className="mt-1 text-muted-foreground">{orderData.statusDescription}</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 rounded-lg border border-border/40 bg-muted/20 p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Estimated Delivery:</span>
            </div>
            <p className="text-lg font-semibold text-foreground">{getEstimatedDelivery()}</p>
          </div>
        </div>
        
        <div className="mt-6">
          <div className="mb-2 flex justify-between">
            <span className="text-sm text-muted-foreground">Delivery Progress</span>
            <span className="text-sm font-medium text-foreground">{orderData.deliveryProgress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted/50">
            <div 
              className="h-full rounded-full bg-primary transition-all duration-500 ease-in-out" 
              style={{ width: `${orderData.deliveryProgress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusHeader; 