import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  PackageSearch, Building2, MapPin, Truck, Package,
   User, Phone, Mail,  Timer, Star, Activity, AlertCircle
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Waypoint {
  name: string;
  status: "completed" | "current" | "pending";
  time: string;
  note: string;
}

interface OrderDetails {
  id: string;
  status: string;
  customerName: string;
  customerEmail: string;
  phone: string;
  address: string;
  city: string;
  governorate: string;
  postalCode: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery: string;
  notes: string;
  route: {
    distance: string;
    timeRemaining: string;
    currentLocation: string;
    waypoints: Waypoint[];
  };
  items: {
    id: string;
    product: {
      name: string;
      image: string;
      weight: string;
      dimensions: string;
      sku: string;
      category: string;
      condition: string;
      packaging: string;
    };
    quantity: number;
    price: number;
    status: string;
    insurance: string;
    specialHandling: boolean;
  }[];
  delivery: {
    driver: {
      id: string;
      fullName: string;
      rating: number;
      deliveries: number;
      vehicleType: string;
      vehiclePlate: string;
      currentSpeed: string;
      estimatedArrival: string;
      experience: string;
      languages: string[];
      certifications: string[];
      currentShift: string;
    };
    security: {
      sealed: boolean;
      lastScanned: string;
      temperature: string;
      humidity: string;
      shockDetection: string;
      tamperEvidence: string;
      gpsTracking: boolean;
      lockStatus: string;
      insuranceStatus: string;
      lastInspection: string;
    };
    tracking: {
      checkpoints: { location: string; time: string; status: string }[];
      events: { type: string; time: string; location: string }[];
    };
  };
  payment: {
    method: string;
    status: string;
    transactionId: string;
    subtotal: number;
    shipping: number;
    tax: number;
    insurance: number;
    total: number;
    currency: string;
    paidAt: string;
  };
  warehouse: {
    id: string;
    name: string;
    section: string;
    shelf: string;
    handler: string;
    processedAt: string;
  };
}

const mockOrder: OrderDetails = {
  id: "ORD-24-0123",
  status: "IN_TRANSIT",
  customerName: "John Doe",
  customerEmail: "john.doe@email.com",
  phone: "+216 99 999 999",
  address: "123 Main Street, Apartment 4B",
  city: "Tunis",
  governorate: "Tunis",
  postalCode: "1000",
  totalAmount: 1249.99,
  createdAt: "2024-03-10T10:00:00Z",
  updatedAt: "2024-03-10T15:30:00Z",
  estimatedDelivery: "2024-03-11T14:00:00Z",
  notes: "Please handle with care, fragile electronics",
  route: {
    distance: "120km",
    timeRemaining: "2 hours 15 minutes",
    currentLocation: "Route A1, KM 45",
    waypoints: [
      { name: "Tunis Central Hub", status: "completed", time: "10:00 AM", note: "Package received and sorted" },
      { name: "Sousse Warehouse", status: "current", time: "12:30 PM", note: "Transit processing" },
      { name: "Monastir Local Hub", status: "pending", time: "02:45 PM", note: "Awaiting arrival" },
      { name: "Final Destination", status: "pending", time: "03:30 PM", note: "Delivery pending" }
    ]
  },
  items: [
    {
      id: "ITEM-001",
      product: {
        name: "MacBook Pro M3 Max",
        image: "/laptop.png",
        weight: "2.5kg",
        dimensions: "35.57 x 24.13 x 1.68 cm",
        sku: "APP-MBP-24-001",
        category: "Electronics",
        condition: "New",
        packaging: "Original Box"
      },
      quantity: 1,
      price: 999.99,
      status: "secured",
      insurance: "Full Coverage",
      specialHandling: true
    },
    {
      id: "ITEM-002",
      product: {
        name: "Apple Magic Keyboard",
        image: "/keyboard.png",
        weight: "0.5kg",
        dimensions: "27.9 x 11.49 x 1.09 cm",
        sku: "APP-AKB-24-002",
        category: "Accessories",
        condition: "New",
        packaging: "Retail Box"
      },
      quantity: 2,
      price: 125.00,
      status: "secured",
      insurance: "Basic Coverage",
      specialHandling: false
    }
  ],
  delivery: {
    driver: {
      id: "DRV-001",
      fullName: "Ahmed Ben Ali",
      rating: 4.8,
      deliveries: 1289,
      vehicleType: "VAN",
      vehiclePlate: "123 TUN 4567",
      currentSpeed: "60 km/h",
      estimatedArrival: "14:30",
      experience: "5 years",
      languages: ["Arabic", "French", "English"],
      certifications: ["Hazmat", "Cold Chain"],
      currentShift: "08:00 - 16:00"
    },
    security: {
      sealed: true,
      lastScanned: "10 mins ago",
      temperature: "22°C",
      humidity: "45%",
      shockDetection: "Normal",
      tamperEvidence: "No alerts",
      gpsTracking: true,
      lockStatus: "Secured",
      insuranceStatus: "Active",
      lastInspection: "2024-03-10T14:30:00Z"
    },
    tracking: {
      checkpoints: [
        { location: "Tunis Hub", time: "10:00 AM", status: "Picked up" },
        { location: "Security Check", time: "10:15 AM", status: "Cleared" },
        { location: "Loading Bay", time: "10:30 AM", status: "Loaded" },
        { location: "Route A1", time: "11:00 AM", status: "In Transit" }
      ],
      events: [
        { type: "SCAN", time: "10:00 AM", location: "Tunis Hub" },
        { type: "SECURITY_CHECK", time: "10:15 AM", location: "Security Gate" },
        { type: "TEMPERATURE_LOG", time: "10:30 AM", location: "Security Gate" },
        { type: "ROUTE_UPDATE", time: "11:00 AM", location: "Entered Route A1" }
      ]
    }
  },
  payment: {
    method: "Credit Card",
    status: "Paid",
    transactionId: "TXN-24-0123",
    subtotal: 1249.99,
    shipping: 15.00,
    tax: 35.00,
    insurance: 25.00,
    total: 1324.99,
    currency: "TND",
    paidAt: "2024-03-10T09:45:00Z"
  },
  warehouse: {
    id: "WH-001",
    name: "Tunis Central Hub",
    section: "Electronics",
    shelf: "E-123",
    handler: "Mohamed Salah",
    processedAt: "2024-03-10T09:55:00Z"
  }
};

export default function OrderPage() {
  const { orderId } = useParams();
  const { data: order = mockOrder } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => mockOrder,
  });

  return (
    <div className="min-h-screen bg-background pt-12">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Order Status Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <PackageSearch className="h-5 w-5 text-yellow-600" />
              <span className="text-sm text-muted-foreground">
                Order placed on {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-3xl font-bold">#{order.id}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-4 py-1.5 bg-yellow-600/10 text-yellow-600 rounded-full text-sm font-medium">
              {order.status}
            </span>
            <span className="text-sm text-muted-foreground">
              ${order.totalAmount}
            </span>
          </div>
        </div>

        {/* Journey Visualization */}
        <div className="mb-12 h-[300px] w-full relative rounded-xl bg-black/20">
          <svg className="w-full h-full" viewBox="0 0 1200 300" fill="none">
            <motion.path
              d="M100,150 Q600,50 1100,150"
              stroke="url(#journeyGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
            
            <motion.circle
              cx="0"
              cy="0"
              r="4"
              fill="#CA8A04"
              animate={{
                cx: [100, 600, 1100],
                cy: [150, 50, 150],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            
            <defs>
              <linearGradient id="journeyGradient" x1="0" y1="0" x2="100%" y2="0">
                <stop offset="0%" stopColor="#CA8A04" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#CA8A04" />
                <stop offset="100%" stopColor="#CA8A04" stopOpacity="0.2" />
              </linearGradient>
            </defs>
          </svg>

          {/* Waypoints */}
          {order.route.waypoints.map((point, index) => (
            <div
              key={point.name}
              className="absolute bg-background/95 backdrop-blur-sm rounded-lg p-3"
              style={{
                left: `${(index / (order.route.waypoints.length - 1)) * 80 + 10}%`,
                top: index === 1 ? "20%" : "50%",
                transform: "translate(-50%, -50%)"
              }}
            >
              <div className="flex items-center gap-2">
                {index === 0 ? (
                  <Building2 className="h-5 w-5 text-yellow-600" />
                ) : index === order.route.waypoints.length - 1 ? (
                  <MapPin className="h-5 w-5 text-yellow-600" />
                ) : (
                  <Truck className="h-5 w-5 text-yellow-600" />
                )}
                <span className="font-medium">{point.name}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="col-span-8 space-y-6">
            {/* Package Details */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Package Details</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 p-4 rounded-lg bg-muted/30">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                      <Package className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{item.product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity} × ${item.price}
                          </p>
                        </div>
                        <span className="text-sm font-medium">
                          ${item.quantity * item.price}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{item.product.weight}</span>
                        <span>•</span>
                        <span>{item.product.dimensions}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Delivery Progress */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Delivery Progress</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-yellow-600" />
                    <span>Current Status</span>
                  </div>
                  <span className="text-muted-foreground">{order.delivery.driver.currentSpeed}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-yellow-600" />
                    <span>Estimated Arrival</span>
                  </div>
                  <span className="text-muted-foreground">{order.delivery.driver.estimatedArrival}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span>Distance Remaining</span>
                  </div>
                  <span className="text-muted-foreground">{order.route.distance}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="col-span-4 space-y-6">
            {/* Driver Info */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Driver Information</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">{order.delivery.driver.fullName}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="h-3 w-3 fill-yellow-600 text-yellow-600" />
                      <span>{order.delivery.driver.rating}</span>
                      <span>•</span>
                      <span>{order.delivery.driver.deliveries} deliveries</span>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vehicle Type</span>
                    <span>{order.delivery.driver.vehicleType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Temperature</span>
                    <span>{order.delivery.security.temperature}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Humidity</span>
                    <span>{order.delivery.security.humidity}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Customer Info */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Delivery Details</h2>
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{order.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customerEmail}</span>
                </div>
                <Separator />
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{order.address}, {order.city}, {order.governorate}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}