import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/axios";
import {
  Map,
  PackageOpen,
  Truck,
  Package,
  Home,
  Clock,
  CalendarCheck,
  Building,
  CheckCircle2,
  AlertCircle,
  Layers,
  ArrowLeft,
  Share2,
  Zap,
  MapPin,
  Box,
  ShieldCheck,
  ChevronRight,
  Phone,
} from "lucide-react";

interface TrackingInfo {
  orderId: string;
  status: string;
  statusDescription: string;
  statusCategory: string;
  createdAt: string;
  updatedAt: string;
  customerInfo: {
    name: string;
    address: string;
    city: string;
    governorate: string;
  };
  sellerInfo: {
    businessName: string;
    city: string;
    governorate: string;
  };
  currentLocation: {
    type: string;
    businessName?: string;
    city?: string;
    governorate?: string;
  };
  estimatedDelivery: string | null;
  timeline: Array<{
    status: string;
    timestamp: string;
    description: string;
  }>;
  itemsSummary: Array<{
    name: string;
    quantity: number;
  }>;
  batchInfo?: {
    id: string;
    status: string;
    driver: {
      name: string;
      phone: string;
    } | null;
    routeInfo: {
      status: string;
      startedAt: string | null;
      estimatedDuration: number;
      totalDistance: number;
    } | null;
  };
  warehouseInfo?: {
    name: string;
    location: string;
  };
  isLocalDelivery: boolean;
}

export function TrackOrderPage() {
  const { trackingId } = useParams<{ trackingId: string }>();
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTrackingInfo = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/orders/track/${trackingId}`);
        console.log("Tracking data received:", response.data);
        setTrackingInfo(response.data);
        
        // Set active step based on timeline
        if (response.data?.timeline?.length) {
          setActiveStep(response.data.timeline.length - 1);
        }
        
        setError(null);
      } catch (err: any) {
        console.error("Error fetching tracking information:", err);
        setError(
          err.response?.data?.message || "Failed to fetch tracking information"
        );
        toast({
          title: "Tracking Error",
          description: "Could not find order with the provided tracking number.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (trackingId) {
      fetchTrackingInfo();
    }
  }, [trackingId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Order Created":
        return <Layers className="h-6 w-6" />;
      case "Driver Assigned":
        return <Truck className="h-6 w-6" />;
      case "Package Collected":
        return <PackageOpen className="h-6 w-6" />;
      case "In Transit":
        return <Truck className="h-6 w-6" />;
      case "Out for Delivery":
        return <Home className="h-6 w-6" />;
      case "Delivered":
        return <CheckCircle2 className="h-6 w-6" />;
      case "Cancelled":
        return <AlertCircle className="h-6 w-6" />;
      default:
        return <Package className="h-6 w-6" />;
    }
  };

  const getStatusColor = (category: string) => {
    switch (category) {
      case "PROCESSING":
        return "bg-blue-500 text-blue-500";
      case "PICKUP":
        return "bg-amber-500 text-amber-500";
      case "TRANSIT":
        return "bg-indigo-500 text-indigo-500";
      case "DELIVERY":
        return "bg-purple-500 text-purple-500";
      case "DELIVERED":
        return "bg-green-500 text-green-500";
      case "CANCELLED":
        return "bg-red-500 text-red-500";
      default:
        return "bg-gray-500 text-gray-500";
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied",
      description: "Tracking link copied to clipboard!",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 lg:py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto"
        >
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-5 w-64" />
            </div>
            <Skeleton className="h-10 w-28" />
          </div>

          <div className="mb-10">
            <Skeleton className="h-40 w-full rounded-xl mb-4" />
            <div className="flex justify-between">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-16 px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto text-center"
        >
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-red-100 p-4">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-4">Tracking Unavailable</h1>
          <p className="text-muted-foreground mb-8">
            We couldn't find any tracking information for the provided ID. Please check the ID and try again.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" size="lg" asChild>
              <Link to="/track">
                <ArrowLeft className="mr-2 h-4 w-4" /> Try Another ID
              </Link>
            </Button>
            <Button size="lg" asChild>
              <Link to="/">Go to Homepage</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!trackingInfo) {
    return null;
  }

  const deliveryProgress = (() => {
    // Calculate a percentage based on the timeline progress
    const timeline = trackingInfo.timeline || [];
    if (!timeline.length) return 0;
    
    const steps = trackingInfo.isLocalDelivery ? 3 : 5; // Local: Created->PickedUp->Delivered, Intercity: 5 steps
    return Math.min(100, Math.round((timeline.length / steps) * 100));
  })();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-background via-background to-background/95 pb-16"
    >
      {/* Hero section with gradient and pattern */}
      <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-background pt-8 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        
        <div className="container relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 pt-10">
            <div>
              <Link
                to="/track"
                className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-2"
              >
                <ArrowLeft className="mr-1 h-4 w-4" /> Back to Track
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-4">
                Track Your Package
              </h1>
              <p className="text-muted-foreground mt-1">
                Order ID: <span className="font-medium text-foreground">{trackingInfo.orderId}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={handleCopyLink}
              >
                <Share2 className="mr-2 h-4 w-4" /> Share
              </Button>
              <Button asChild className="h-9">
                <a href={`tel:${trackingInfo.batchInfo?.driver?.phone || '1800123456'}`}>
                  Contact Support
                </a>
              </Button>
            </div>
          </div>

          {/* Status card */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-muted">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${deliveryProgress}%` }}
                transition={{ delay: 0.5, duration: 1.5, ease: "easeOut" }}
                className={`h-full ${
                  trackingInfo.statusCategory === "DELIVERED"
                    ? "bg-green-500"
                    : trackingInfo.statusCategory === "CANCELLED"
                    ? "bg-red-500"
                    : "bg-primary"
                }`}
              />
            </div>

            <div className="p-6 pt-8 md:p-8 md:pt-10">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${getStatusColor(trackingInfo.statusCategory).split(' ')[0]}/10`}>
                      {getStatusIcon(trackingInfo.timeline[activeStep]?.status || "Package")}
                    </div>
                    <div>
                      <Badge 
                        className={`${
                          trackingInfo.statusCategory === "DELIVERED" 
                            ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                            : trackingInfo.statusCategory === "CANCELLED"
                            ? "bg-red-500/10 text-red-600 hover:bg-red-500/20"
                            : "bg-primary/10 text-primary hover:bg-primary/20"
                        }`}
                      >
                        {trackingInfo.statusCategory}
                      </Badge>
                      <h2 className="text-lg font-semibold mt-1">
                        {trackingInfo.statusDescription !== "Status information unavailable"
                          ? trackingInfo.statusDescription
                          : trackingInfo.timeline[activeStep]?.status || "Processing"}
                      </h2>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    Last updated: {formatDate(trackingInfo.updatedAt)}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 sm:gap-10 md:items-center">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Estimated Delivery</p>
                    <div className="flex items-center">
                      <CalendarCheck className="h-4 w-4 mr-2 text-primary" />
                      {trackingInfo.estimatedDelivery ? (
                        <span className="font-semibold">
                          {new Date(trackingInfo.estimatedDelivery).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      ) : (
                        <span className="font-semibold">Delivered</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Delivery Type</p>
                    <div className="flex items-center">
                      {trackingInfo.isLocalDelivery ? (
                        <>
                          <Zap className="h-4 w-4 mr-2 text-amber-500" />
                          <span className="font-semibold">Local Delivery</span>
                        </>
                      ) : (
                        <>
                          <Truck className="h-4 w-4 mr-2 text-blue-500" />
                          <span className="font-semibold">Intercity Delivery</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="overflow-hidden">
              <div className="border-b p-6">
                <h2 className="text-xl font-semibold">Delivery Timeline</h2>
              </div>
              <div className="p-6 relative" ref={timelineRef}>
                {trackingInfo.timeline && trackingInfo.timeline.length > 0 ? (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute top-0 bottom-0 left-6 w-px bg-border" />
                    
                    {trackingInfo.timeline.map((step, index) => (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        key={index}
                        className={`relative flex gap-4 pb-8 last:pb-0 ${
                          index === activeStep ? "opacity-100" : "opacity-80"
                        }`}
                        onClick={() => setActiveStep(index)}
                      >
                        <div className="relative flex items-center justify-center">
                          <div className={`absolute h-12 w-12 rounded-full ${
                            index === activeStep
                              ? getStatusColor(trackingInfo.statusCategory).split(' ')[0] + "/15"
                              : "bg-muted"
                          }`} />
                          <div className={`z-10 flex h-6 w-6 items-center justify-center rounded-full border ${
                            index === activeStep
                              ? `border-background ${getStatusColor(trackingInfo.statusCategory).split(' ')[0]}`
                              : "bg-background border-border"
                          }`}>
                            {index === activeStep ? (
                              <div className={`h-2 w-2 rounded-full ${getStatusColor(trackingInfo.statusCategory).split(' ')[0]}`} />
                            ) : (
                              <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <h3 className={`font-semibold ${
                              index === activeStep
                                ? getStatusColor(trackingInfo.statusCategory).split(' ')[1]
                                : ""
                            }`}>
                              {step.status}
                            </h3>
                            <time className="text-sm text-muted-foreground">
                              {formatDate(step.timestamp)}
                            </time>
                          </div>
                          <p className="mt-1 text-muted-foreground">
                            {step.description}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                      <Clock className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      Tracking Just Started
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      We're setting up tracking for your package. Check back soon for
                      live updates on your delivery.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Interactive Map Visualization */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6"
            >
              <Card className="overflow-hidden">
                <div className="border-b p-6">
                  <h2 className="text-xl font-semibold">Delivery Route</h2>
                </div>
                <div className="p-4 aspect-video bg-primary/5 relative flex items-center justify-center rounded-lg m-4">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* Animated delivery path visualization */}
                    <div className="relative w-4/5 h-4/5">
                      {/* Origin */}
                      <div className="absolute top-[15%] left-[10%] flex flex-col items-center">
                        <div className="h-4 w-4 rounded-full bg-amber-500 mb-2 shadow-lg shadow-amber-500/20"></div>
                        <div className="text-sm font-medium">{trackingInfo.sellerInfo?.city || "Origin"}</div>
                      </div>
                      
                      {/* Destination */}
                      <div className="absolute bottom-[15%] right-[10%] flex flex-col items-center">
                        <div className="h-4 w-4 rounded-full bg-green-500 mb-2 shadow-lg shadow-green-500/20"></div>
                        <div className="text-sm font-medium">{trackingInfo.customerInfo?.city || "Destination"}</div>
                      </div>
                      
                      {/* Path between origin and destination */}
                      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#10b981" />
                          </linearGradient>
                        </defs>
                        
                        {/* Route path */}
                        <path 
                          d="M 15% 20% Q 50% 10%, 85% 80%" 
                          fill="none" 
                          stroke="url(#routeGradient)" 
                          strokeWidth="2"
                          strokeDasharray="5,5"
                          className="animate-dash"
                        />
                      </svg>
                      
                      {/* Current position */}
                      {trackingInfo.statusCategory !== "DELIVERED" && trackingInfo.statusCategory !== "CANCELLED" && (
                        <motion.div 
                          initial={{ left: "15%", top: "20%" }}
                          animate={{ 
                            left: trackingInfo.statusCategory === "PROCESSING" ? "15%" : 
                                  trackingInfo.statusCategory === "PICKUP" ? "25%" :
                                  trackingInfo.statusCategory === "TRANSIT" ? "50%" :
                                  trackingInfo.statusCategory === "DELIVERY" ? "70%" : "85%",
                            top: trackingInfo.statusCategory === "PROCESSING" ? "20%" : 
                                 trackingInfo.statusCategory === "PICKUP" ? "30%" :
                                 trackingInfo.statusCategory === "TRANSIT" ? "45%" :
                                 trackingInfo.statusCategory === "DELIVERY" ? "65%" : "80%",
                          }}
                          transition={{ duration: 1, ease: "easeInOut" }}
                          className="absolute flex flex-col items-center"
                        >
                          <div className="relative">
                            <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
                            <div className="relative h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                              <Truck className="h-3 w-3 text-white" />
                            </div>
                          </div>
                        </motion.div>
                      )}
                      
                      {/* Warehouse(s) */}
                      {trackingInfo.warehouseInfo && !trackingInfo.isLocalDelivery && (
                        <div className="absolute top-[45%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                          <div className="h-4 w-4 rounded-full bg-indigo-500 mb-2 shadow-lg shadow-indigo-500/20"></div>
                          <div className="text-sm font-medium">{trackingInfo.warehouseInfo.name}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-center text-muted-foreground">
                    <Map className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p className="text-xs opacity-70">Interactive map visualization</p>
                    {trackingInfo.batchInfo?.routeInfo?.totalDistance && (
                      <p className="text-sm font-medium mt-2">
                        Approximate distance: {Math.round(trackingInfo.batchInfo.routeInfo.totalDistance)} km
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>

          {/* Right sidebar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Shipping Details Card */}
            <Card className="overflow-hidden">
              <div className="border-b p-6">
                <h2 className="text-xl font-semibold">Shipping Details</h2>
              </div>
              <div className="divide-y">
                <div className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
                      <Home className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Delivery Address</h3>
                      <p className="font-medium">{trackingInfo.customerInfo?.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {trackingInfo.customerInfo?.address}, {trackingInfo.customerInfo?.city}, {trackingInfo.customerInfo?.governorate}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10">
                      <Building className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Seller</h3>
                      <p className="font-medium">{trackingInfo.sellerInfo?.businessName}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {trackingInfo.sellerInfo?.city}, {trackingInfo.sellerInfo?.governorate}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
                      <MapPin className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Current Location</h3>
                      <p className="font-medium">
                        {trackingInfo.currentLocation?.type === "SELLER" 
                          ? `At seller: ${trackingInfo.sellerInfo?.businessName || 'Unknown Seller'}`
                          : trackingInfo.currentLocation?.type === "WAREHOUSE" && trackingInfo.warehouseInfo
                          ? `At warehouse: ${trackingInfo.warehouseInfo.name}`
                          : trackingInfo.currentLocation?.type === "TRANSIT"
                          ? "In transit"
                          : "Location information unavailable"}
                      </p>
                      {trackingInfo.currentLocation?.city && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {trackingInfo.currentLocation.city}, {trackingInfo.currentLocation.governorate}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {trackingInfo.warehouseInfo && (
                  <div className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/10">
                        <Building className="h-4 w-4 text-indigo-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Processing Warehouse</h3>
                        <p className="font-medium">{trackingInfo.warehouseInfo.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{trackingInfo.warehouseInfo.location}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
            
            {/* Order Items Card */}
            <Card className="overflow-hidden">
              <div className="border-b p-6">
                <h2 className="text-xl font-semibold">Order Items</h2>
              </div>
              <div className="p-4">
                {trackingInfo.itemsSummary && trackingInfo.itemsSummary.length > 0 ? (
                  <div className="divide-y">
                    {trackingInfo.itemsSummary.map((item, index) => (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        key={index}
                        className="p-4 flex justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Box className="h-5 w-5 text-primary" />
                          </div>
                          <span className="font-medium line-clamp-1">{item.name}</span>
                        </div>
                        <span className="text-muted-foreground">×{item.quantity}</span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No items information available.</p>
                  </div>
                )}
              </div>
            </Card>
            
            {/* Driver Info Card */}
            {trackingInfo.batchInfo?.driver && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="overflow-hidden">
                  <div className="border-b p-6">
                    <h2 className="text-xl font-semibold">Driver Information</h2>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Truck className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{trackingInfo.batchInfo.driver.name}</h3>
                        <p className="text-sm text-muted-foreground">Professional Driver</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Phone className="mr-2 h-4 w-4" /> 
                        {trackingInfo.batchInfo.driver.phone}
                      </Button>
                      <Button variant="secondary" size="sm" className="w-full">
                        Contact Driver
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
            
            {/* Call-to-action section */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-6"
            >
              <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background overflow-hidden border-primary/20">
                <div className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Delivery Protection</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Your delivery is protected with our premium insurance and tracking technology.
                    </p>
                    <Button size="sm" className="w-full">
                      Learn More <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
} 