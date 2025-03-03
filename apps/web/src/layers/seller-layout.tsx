import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Store,
  LogOut,
  ChevronLeft,
  Brain,
  Bell,
  X,
  Info,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AiChat } from "@/pages/seller/ai-chat";
import { useAuthStore } from "@/stores/auth.store";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/seller/dashboard",
  },
  {
    title: "Products",
    icon: Package,
    href: "/seller/products",
  },
  {
    title: "Orders",
    icon: ShoppingCart,
    href: "/seller/orders",
  },
  {
    title: "Store Settings",
    icon: Store,
    href: "/seller/settings",
  },
  
 
];

export function SellerLayout() {
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const [showInfoCard, setShowInfoCard] = useState(true);
  const notificationsCount = 1;

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handlePlatformChange = (value: string) => {
    if (value === "driver") {
      navigate("/driver");
    } else if (value === "seller") {
      navigate("/seller");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Fixed height */}
      <aside
        className={cn(
          "border-r bg-background transition-all duration-300 flex flex-col h-screen",
          collapsed ? "w-[70px]" : "w-64"
        )}
      >
        {/* Header - Fixed height */}
        <div className="h-14 flex items-center justify-between border-b px-3 shrink-0">
          {!collapsed && (
            <Link to="/seller/dashboard" className="flex-1 px-1">
              <Logo />
            </Link>
          )}
          <span className={cn("text-xs mt-2 text-muted-foreground", collapsed && "hidden")}>Seller Platform</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="h-7 w-7 p-0 hover:bg-muted"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                collapsed && "rotate-180"
              )}
            />
          </Button>
        </div>

        {/* Menu - Fixed height, no scroll */}
        <nav className="flex-1 py-3 flex flex-col justify-between">
          <div className="px-3 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md transition-colors",
                  "min-h-[40px] px-2",
                  location.pathname === item.href
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  collapsed && "justify-center px-0"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    location.pathname === item.href && "text-primary"
                  )}
                />
                {!collapsed && <span className="text-sm">{item.title}</span>}
              </Link>
            ))}
          </div>
        </nav>

        {/* Informational Card about Driver Role */}
        {showInfoCard && (
          <div className="px-3 py-2">
            <Card className="p-4 bg-card shadow-md relative">
              <h2 className="text-md font-semibold">Did you know?</h2>
              <p className="text-sm text-muted-foreground mb-2">
                You can also be a driver! Switch to the driver platform to manage your deliveries.
              </p>
              <Button
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => setShowInfoCard(false)}
                title="Close"
                size="icon"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button onClick={() => handlePlatformChange("driver")} className="mt-2 text-md " size="sm">
                Switch to Driver
              </Button>
            </Card>
          </div>
        )}

        {/* Notification Button with Count - Full Width */}
        <div className="flex items-center justify-center p-3">
          <Button variant="secondary" className="flex items-center gap-2 w-full">
            <Bell className="h-5 w-5" />
            <span className="text-sm">Notifications</span>
            {notificationsCount > 0 && (
              <span className="ml-1 bg-red-500 text-white rounded-full px-2 text-xs">
                {notificationsCount}
              </span>
            )}
          </Button>
        </div>

       

        {/* Platform Selector - Improved UI and Position */}
        <div className="px-3 py-2">
          <Select onValueChange={handlePlatformChange} defaultValue="seller">
            <SelectTrigger>
              <SelectValue placeholder="Change platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="seller" className="text-default hover:bg-muted">
                Seller Platform
              </SelectItem>
              <SelectItem value="driver" className="text-default hover:bg-muted">
                Driver Platform
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* User Profile - Fixed height */}
        <div className="border-t shrink-0">
          <div className={cn("flex items-center gap-3 p-4", collapsed && "justify-center")}>
            {!collapsed && user && (
              <>
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium leading-none truncate">
                      {user.fullName || "Loading..."}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {user.email || "Loading..."}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => {
                    logout();
                  }}
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            )}
            {collapsed && (
              <div className="group relative">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getInitials(user?.fullName)}</AvatarFallback>
                </Avatar>
                <div className="absolute left-full ml-2 pl-1 invisible group-hover:visible flex flex-col gap-1">
                  {user?.role?.map((role) => (
                    <Badge 
                      key={role}
                      variant="outline"
                      className="whitespace-nowrap px-1 h-4 text-[10px] font-medium border-primary/20 text-primary"
                    >
                      {role.toLowerCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-auto relative">
        <div className="p-6">
          <Outlet />
        </div>

        {/* Floating AI Chat Button */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="icon"
              className="fixed bottom-14 right-6 h-12 w-12 rounded-full shadow-lg"
            >
              <Brain className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] sm:w-[540px]">
            <div className="h-full py-6">
              <AiChat />
            </div>
          </SheetContent>
        </Sheet>
      </main>
    </div>
  );
}
