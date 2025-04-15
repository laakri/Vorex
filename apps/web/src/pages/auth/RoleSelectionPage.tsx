import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { Brain, ShoppingCart, Truck, Warehouse } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";

type UserRole = "ADMIN" | "SELLER" | "WAREHOUSE_MANAGER" | "DRIVER";

export function RoleSelectionPage() {
  // Get user roles from auth store
  const { user } = useAuthStore();
  const userRoles = user?.role || [];

  // Define available platforms based on user roles
  const platforms = [
    { 
      name: "Seller", 
      path: "/seller", 
      icon: ShoppingCart, 
      role: "SELLER" as UserRole
    },
    { 
      name: "Driver", 
      path: "/driver", 
      icon: Truck, 
      role: "DRIVER" as UserRole
    },
    { 
      name: "Admin", 
      path: "/admin", 
      icon: Brain, 
      role: "ADMIN" as UserRole
    },
    { 
      name: "Warehouse", 
      path: "/warehouse", 
      icon: Warehouse, 
      role: "WAREHOUSE_MANAGER" as UserRole
    },
  ].filter(platform => userRoles.includes(platform.role));

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background p-6">
      <Logo className="mb-8" />
      <h1 className="text-4xl font-bold text-primary-foreground mb-2">Welcome!</h1>
      <p className="text-lg text-muted-foreground mb-6">Select the platform you want to access:</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-lg">
        {platforms.map(platform => (
          <Card key={platform.name} className="flex flex-col items-center p-6 shadow-md rounded-lg transition-transform transform hover:scale-105">
            <platform.icon className="h-16 w-16 text-primary mb-4" />
            <Link to={platform.path} className="w-full">
              <Button className="w-full ">
                {platform.name}
              </Button>
            </Link>
          </Card>
        ))}
      </div>
      <footer className="mt-8 text-sm text-muted-foreground">
        <p>© 2023 Your Company Name. All rights reserved.</p>
      </footer>
    </div>
  );
} 