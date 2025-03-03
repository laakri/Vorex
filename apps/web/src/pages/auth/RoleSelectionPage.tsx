import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { Brain, ShoppingCart, Truck, Warehouse } from "lucide-react";

export function RoleSelectionPage() {
  // Dummy user data for testing
  const user = {
    role: ["seller", "driver", "admin", "warehouse"], 
  };

  // Define available platforms based on user roles
  const platforms = [
    { name: "Seller", path: "/seller", icon: ShoppingCart, roles: user.role },
    { name: "Driver", path: "/driver", icon: Truck, roles: user.role },
    { name: "Admin", path: "/admin", icon: Brain, roles: user.role },
    { name: "Warehouse", path: "/warehouse", icon: Warehouse, roles: user.role },
  ].filter(platform => platform.roles?.includes(platform.name.toLowerCase()));

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