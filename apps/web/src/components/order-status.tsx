import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Package, Truck, CheckCircle, AlertCircle } from "lucide-react";

const statusConfig = {
  PENDING: {
    icon: Package,
    color: "bg-yellow-500",
    message: "Order is being processed",
  },
  PROCESSING: {
    icon: Package,
    color: "bg-blue-500",
    message: "Preparing your order",
  },
  READY_FOR_PICKUP: {
    icon: Package,
    color: "bg-purple-500",
    message: "Ready for pickup",
  },
  IN_TRANSIT: {
    icon: Truck,
    color: "bg-indigo-500",
    message: "On the way",
  },
  DELIVERED: {
    icon: CheckCircle,
    color: "bg-green-500",
    message: "Delivered successfully",
  },
  CANCELLED: {
    icon: AlertCircle,
    color: "bg-red-500",
    message: "Order cancelled",
  },
};

interface OrderStatusProps {
  order: {
    status: keyof typeof statusConfig;
    updatedAt: string | Date;
  };
}

export function OrderStatus({ order }: OrderStatusProps) {
  const status = statusConfig[order.status];

  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`p-3 rounded-full ${status.color}`}
        >
          <status.icon className="h-6 w-6 text-white" />
        </motion.div>
        <div>
          <h2 className="text-2xl font-semibold">{status.message}</h2>
          <p className="text-muted-foreground">
            Last updated: {new Date(order.updatedAt).toLocaleString()}
          </p>
        </div>
      </div>
    </Card>
  );
}