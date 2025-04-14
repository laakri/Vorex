import { format } from 'date-fns';
import { Phone, MapPin, Package, Truck, User, Building, Calendar, Clock } from 'lucide-react';

interface OrderDetailsCardProps {
  orderData: any;
}

const OrderDetailsCard = ({ orderData }: OrderDetailsCardProps) => {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP');
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'p');
  };

  const formatEstimatedDelivery = () => {
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
    <div className="rounded-xl border border-border/40 bg-background/50 shadow-sm backdrop-blur-sm">
      <div className="border-b border-border/40 bg-muted/30 px-6 py-4">
        <h2 className="text-xl font-semibold text-foreground">Order Details</h2>
      </div>
      
      <div className="divide-y divide-border/40">
        {/* Order Info */}
        <div className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-foreground">
            <Package className="h-5 w-5 text-primary" />
            Order Information
          </h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order ID:</span>
              <span className="font-medium text-foreground">{orderData.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Date:</span>
              <span className="font-medium text-foreground">{formatDate(orderData.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-medium text-foreground">${orderData.totalAmount.toFixed(2)}</span>
            </div>
            {orderData.notes && (
              <div className="pt-2">
                <span className="text-muted-foreground">Notes:</span>
                <p className="mt-1 rounded-md bg-muted/20 p-2 font-medium text-foreground">{orderData.notes}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Estimated Delivery */}
        <div className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-foreground">
            <Calendar className="h-5 w-5 text-primary" />
            Delivery Information
          </h3>
          
          <div className="space-y-4">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground">Estimated Delivery:</span>
              </div>
              <p className="mt-2 text-lg font-semibold text-primary">{formatEstimatedDelivery()}</p>
            </div>
            
            <div className="flex items-start gap-2">
              <Truck className="mt-0.5 h-4 w-4 text-primary/70" />
              <div>
                <span className="text-muted-foreground">Delivery Type:</span>
                <p className="font-medium text-foreground">
                  {orderData.isLocalDelivery ? 'Local Delivery' : 'Intercity Delivery'}
                </p>
              </div>
            </div>
            
            {orderData.batchInfo?.driver && (
              <div className="flex items-start gap-2">
                <User className="mt-0.5 h-4 w-4 text-primary/70" />
                <div>
                  <span className="text-muted-foreground">Driver:</span>
                  <p className="font-medium text-foreground">{orderData.batchInfo.driver.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Vehicle: {orderData.batchInfo.driver.vehicle.make} {orderData.batchInfo.driver.vehicle.model} 
                    ({orderData.batchInfo.driver.vehicle.plateNumber})
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Items */}
        <div className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-foreground">
            <Package className="h-5 w-5 text-primary" />
            Items
          </h3>
          
          <ul className="space-y-3">
            {orderData.itemsSummary.map((item: any, index: number) => (
              <li key={index} className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 p-3">
                <span className="font-medium text-foreground">{item.name}</span>
                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  Qty: {item.quantity}
                </span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Customer Info */}
        <div className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-foreground">
            <User className="h-5 w-5 text-primary" />
            Customer Information
          </h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <User className="mt-0.5 h-4 w-4 text-primary/70" />
              <div>
                <span className="text-muted-foreground">Name:</span>
                <p className="font-medium text-foreground">{orderData.customerInfo.name}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 text-primary/70" />
              <div>
                <span className="text-muted-foreground">Phone:</span>
                <p className="font-medium text-foreground">{orderData.customerInfo.phone}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-primary/70" />
              <div>
                <span className="text-muted-foreground">Address:</span>
                <p className="font-medium text-foreground">
                  {orderData.customerInfo.address}, {orderData.customerInfo.city}, {orderData.customerInfo.governorate} {orderData.customerInfo.postalCode}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Seller Info */}
        <div className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-foreground">
            <Building className="h-5 w-5 text-primary" />
            Seller Information
          </h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Building className="mt-0.5 h-4 w-4 text-primary/70" />
              <div>
                <span className="text-muted-foreground">Business:</span>
                <p className="font-medium text-foreground">{orderData.sellerInfo.businessName}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 text-primary/70" />
              <div>
                <span className="text-muted-foreground">Phone:</span>
                <p className="font-medium text-foreground">{orderData.sellerInfo.phone}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-primary/70" />
              <div>
                <span className="text-muted-foreground">Address:</span>
                <p className="font-medium text-foreground">
                  {orderData.sellerInfo.address}, {orderData.sellerInfo.city}, {orderData.sellerInfo.governorate}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsCard; 