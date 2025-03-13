import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { MapPin, Truck, CheckCircle, Clock } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface DeliveryMapTimelineProps {
  orderData: any;
}

const DeliveryMapTimeline = ({ orderData }: DeliveryMapTimelineProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  
  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;
    
    // Get stops from order data
    const stops = orderData.routeStops || [];
    
    // Default center position (Tunisia)
    const defaultPosition: [number, number] = [36.8065, 10.1815];
    
    // Use first stop as center if available
    const centerPosition: [number, number] = stops.length > 0 
      ? [stops[0].latitude, stops[0].longitude] 
      : defaultPosition;
    
    // Create map instance
    const mapInstance = L.map('delivery-map', {
      center: centerPosition,
      zoom: 10,
      zoomControl: true,
    });
    
    // Store map instance in ref
    mapRef.current = mapInstance;
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance);
    
    // Create custom icons
    const createCustomIcon = (color: string, borderColor: string) => {
      return L.divIcon({
        html: `
          <div class="marker-pin">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="${borderColor}" stroke-width="1">
              <path d="M12 0C7.802 0 4 3.403 4 7.602C4 11.8 7.469 16.812 12 24C16.531 16.812 20 11.8 20 7.602C20 3.403 16.199 0 12 0ZM12 11C10.343 11 9 9.657 9 8C9 6.343 10.343 5 12 5C13.657 5 15 6.343 15 8C15 9.657 13.657 11 12 11Z"/>
            </svg>
          </div>
        `,
        className: 'custom-div-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });
    };
    
    const pickupIcon = createCustomIcon('#f59e0b', '#d97706'); // amber
    const deliveryIcon = createCustomIcon('#10b981', '#059669'); // green
    const warehouseIcon = createCustomIcon('#3b82f6', '#2563eb'); // blue
    
    // Add markers for all stops
    const markers: L.Marker[] = [];
    const coordinates: [number, number][] = [];
    
    stops.forEach((stop: any) => {
      const icon = stop.isPickup ? pickupIcon : deliveryIcon;
      const marker = L.marker([stop.latitude, stop.longitude], { 
        icon: icon,
        riseOnHover: true
      }).addTo(mapInstance);
      
      marker.bindPopup(`
        <strong>${stop.isPickup ? 'Pickup Point' : 'Delivery Point'}</strong><br>
        ${stop.address}<br>
        ${stop.isCompleted ? 'Completed' : 'Pending'}
      `);
      
      markers.push(marker);
      coordinates.push([stop.latitude, stop.longitude]);
    });
    
    // Add warehouse marker if not local delivery
    if (!orderData.isLocalDelivery && orderData.warehouseInfo) {
      // For demo purposes, use fixed position for warehouse
      // In a real app, you would use actual warehouse coordinates
      const warehouseLat = 35.8256; // Example coordinates for Sousse
      const warehouseLng = 10.6381;
      
      const warehouseMarker = L.marker([warehouseLat, warehouseLng], { 
        icon: warehouseIcon,
        riseOnHover: true
      }).addTo(mapInstance);
      
      warehouseMarker.bindPopup(`
        <strong>Warehouse</strong><br>
        ${orderData.warehouseInfo.name}<br>
        ${orderData.warehouseInfo.address}
      `);
      
      markers.push(warehouseMarker);
      coordinates.push([warehouseLat, warehouseLng]);
    }
    
    // Store markers in ref
    markersRef.current = markers;
    
    // Create a polyline connecting all stops
    if (coordinates.length > 1) {
      const polyline = L.polyline(coordinates, { 
        color: 'var(--primary, #6366f1)', 
        weight: 3,
        opacity: 0.7,
        dashArray: '5, 10'
      }).addTo(mapInstance);
    }
    
    // Fit map to show all markers
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      mapInstance.fitBounds(group.getBounds().pad(0.2));
    }
    
    // Cleanup
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      mapInstance.remove();
    };
  }, [orderData]); // Re-run when orderData changes
  
  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Pending';
    return format(new Date(dateString), 'PPp');
  };

  return (
    <div className="space-y-8">
      {/* Map Section */}
      <div className="overflow-hidden rounded-xl border border-border/40 bg-background/50 shadow-sm backdrop-blur-sm">
        <div className="border-b border-border/40 bg-muted/30 px-6 py-4">
          <h2 className="text-xl font-semibold text-foreground">Delivery Route</h2>
        </div>
        
        <div id="delivery-map" className="h-[400px] w-full relative" />
        
        <div className="border-t border-border/40 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-amber-500"></div>
              <span className="text-sm text-muted-foreground">Pickup Point</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-muted-foreground">Delivery Point</span>
            </div>
            
            {!orderData.isLocalDelivery && (
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-muted-foreground">Warehouse</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Timeline Section */}
      <div className="overflow-hidden rounded-xl border border-border/40 bg-background/50 shadow-sm backdrop-blur-sm">
        <div className="border-b border-border/40 bg-muted/30 px-6 py-4">
          <h2 className="text-xl font-semibold text-foreground">Delivery Timeline</h2>
        </div>
        
        <div className="p-6">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 h-full w-0.5 bg-border/40"></div>
            
            <div className="space-y-8">
              {/* Combine timeline events from the API with expected future events */}
              {[
                ...orderData.timeline,
                // Add expected future events based on the current status
                ...(orderData.statusCategory !== 'DELIVERED' ? [
                  orderData.statusCategory === 'PICKUP' ? {
                    status: 'In Transit',
                    timestamp: null,
                    description: 'Package will be in transit to destination'
                  } : null,
                  {
                    status: 'Out for Delivery',
                    timestamp: null,
                    description: 'Package will be out for final delivery'
                  },
                  {
                    status: 'Delivered',
                    timestamp: null,
                    description: 'Package will be delivered to recipient'
                  }
                ].filter(Boolean) : [])
              ].map((event, index) => (
                <div key={index} className="relative flex gap-4">
                  <div className="relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-background">
                    {event.timestamp ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <Clock className="h-6 w-6 text-muted-foreground/40" />
                    )}
                  </div>
                  
                  <div className="flex-1 pt-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className={`text-base font-medium ${event.timestamp ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                        {event.status}
                      </h3>
                      <time className={`text-sm ${event.timestamp ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                        {event.timestamp ? formatDateTime(event.timestamp) : 'Pending'}
                      </time>
                    </div>
                    <p className={`mt-1 text-sm ${event.timestamp ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                      {event.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Route Details Section */}
      {orderData.batchInfo?.routeInfo && (
        <div className="overflow-hidden rounded-xl border border-border/40 bg-background/50 shadow-sm backdrop-blur-sm">
          <div className="border-b border-border/40 bg-muted/30 px-6 py-4">
            <h2 className="text-xl font-semibold text-foreground">Route Details</h2>
          </div>
          
          <div className="p-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-lg border border-border/40 bg-muted/20 p-4 text-center">
                <Truck className="mx-auto h-6 w-6 text-primary" />
                <h3 className="mt-2 text-sm font-medium text-muted-foreground">Total Distance</h3>
                <p className="text-xl font-semibold text-foreground">{orderData.batchInfo.routeInfo.totalDistance.toFixed(1)} km</p>
              </div>
              
              <div className="rounded-lg border border-border/40 bg-muted/20 p-4 text-center">
                <Clock className="mx-auto h-6 w-6 text-primary" />
                <h3 className="mt-2 text-sm font-medium text-muted-foreground">Estimated Duration</h3>
                <p className="text-xl font-semibold text-foreground">{orderData.batchInfo.routeInfo.estimatedDuration} min</p>
              </div>
              
              <div className="rounded-lg border border-border/40 bg-muted/20 p-4 text-center">
                <MapPin className="mx-auto h-6 w-6 text-primary" />
                <h3 className="mt-2 text-sm font-medium text-muted-foreground">Total Stops</h3>
                <p className="text-xl font-semibold text-foreground">{orderData.batchInfo.routeInfo.stops.length}</p>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="mb-4 text-lg font-medium text-foreground">Stops Sequence</h3>
              
              <div className="space-y-4">
                {orderData.batchInfo.routeInfo.stops.map((stop: any, index: number) => (
                  <div key={stop.id} className="flex items-start gap-4 rounded-lg border border-border/40 bg-muted/20 p-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-background text-center text-sm font-medium text-foreground shadow-sm">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {stop.isPickup ? (
                          <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-500">
                            Pickup
                          </span>
                        ) : (
                          <span className="rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500">
                            Delivery
                          </span>
                        )}
                        
                        {stop.isCompleted && (
                          <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-500">
                            Completed
                          </span>
                        )}
                      </div>
                      
                      <p className="mt-1 text-sm font-medium text-foreground">{stop.address}</p>
                      
                      {stop.completedAt && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Completed at: {formatDateTime(stop.completedAt)}
                        </p>
                      )}
                      
                      {stop.notes && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Notes: {stop.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryMapTimeline; 