import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import {
  LayoutDashboard,
  Route as RouteIcon,
  Clock,
  Settings,
  Car,
  Calendar,
  LogOut,
  ChevronLeft,
  Navigation,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth.store";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/driver/dashboard",
  },
  {
    title: "Available Routes",
    icon: RouteIcon,
    href: "/driver/available-routes",
    badge: "New",
  },
  {
    title: "Active Delivery",
    icon: Navigation,
    href: "/driver/active-delivery",
  },
  {
    title: "Schedule",
    icon: Calendar,
    href: "/driver/schedule",
  },
  {
    title: "History",
    icon: Clock,
    href: "/driver/history",
  },
  {
    title: "Vehicle Info",
    icon: Car,
    href: "/driver/vehicle",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/driver/settings",
  },
];

export function DriverLayout() {
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

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
      {/* Left Sidebar */}
      <aside className={cn("border-r bg-background-secondary transition-all duration-300 flex flex-col h-screen", 
        collapsed ? "w-[70px]" : "w-64"
      )}>
        {/* Header - Fixed height */}
        <div className="h-14 flex items-center justify-between border-b px-3 shrink-0">
          {!collapsed && (
            <Link to="/driver/dashboard" className="flex-1 px-1">
              <Logo />
            </Link>
          )}
          <span className={cn("text-xs mt-2 text-muted-foreground", collapsed && "hidden")}>Driver Platform</span>
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

        {/* Updated Menu Items */}
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
                {!collapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span className="text-sm">{item.title}</span>
                    {item.badge && (
                      <span className="text-[10px] font-medium bg-primary/10 text-primary px-1.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </nav>

        {/* Platform Selector - Improved UI and Position */}
        <div className="px-3 py-2">
          <Select onValueChange={handlePlatformChange} defaultValue="driver">
            <SelectTrigger >
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent >
              <SelectItem value="driver" className="text-default hover:bg-muted">
                Driver
              </SelectItem>
              <SelectItem value="seller" className="text-default hover:bg-muted">
                Seller
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
