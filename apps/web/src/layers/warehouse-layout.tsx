import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import {
  LayoutDashboard,
  Package,
  Truck,
  Users,
  Warehouse as WarehouseIcon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Brain,
  Bell,
  X,
  Settings,
  HelpCircle,
  Zap,
  
  Calendar,
  CheckCircle2,
  BookOpen,
  Video,
  Route as RouteIcon,
  BarChart3,
  Timer,
  Layers,
  FileStack,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
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
import { Progress } from "@/components/ui/progress";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/warehouse/dashboard",
  },
  {
    title: "Incoming Orders",
    icon: Package,
    href: "/warehouse/incoming-orders",
  },
  {
    title: "Outgoing Orders",
    icon: Truck,
    href: "/warehouse/outgoing-orders",
  },
  {
    title: "Batches",
    icon: FileStack,
    href: "/warehouse/batches",
  },
  {
    title: "Routes",
    icon: RouteIcon,
    href: "/warehouse/routes",
  },
  {
    title: "Warehouse Sections",
    icon: Layers,
    href: "/warehouse/sections",
  },
  {
    title: "Inventory",
    icon: FileStack,
    href: "/warehouse/inventory",
  },
  {
    title: "Staff",
    icon: Users,
    href: "/warehouse/staff",
  },
  {
    title: "Analytics",
    icon: BarChart3,
    href: "/warehouse/analytics",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/warehouse/settings",
  },
];

export function WarehouseLayout() {
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const [showInfoCard, setShowInfoCard] = useState(true);
  const notificationsCount = 3;
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  
  // Add responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
        setShowInfoCard(false);
      } else {
        setCollapsed(false);
        setShowInfoCard(true);
      }
    };

    // Initial check
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    } else if (value === "warehouse") {
      navigate("/warehouse");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Fixed height with responsive classes */}
      <aside
        className={cn(
          "border-r bg-background-secondary transition-all duration-300 flex flex-col h-screen",
          collapsed ? "w-[70px]" : "w-64",
          "md:static absolute z-20"
        )}
      >
        {/* Header - Fixed height */}
        <div className="h-14 flex items-center justify-between border-b px-3 shrink-0">
          {collapsed ? (
            <WarehouseIcon className="h-8 w-8 text-primary" />
          ) : (
            <Logo className="h-8" />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                collapsed && "rotate-180"
              )}
            />
          </Button>
        </div>

        {/* Navigation - Scrollable */}
        <div className="overflow-y-auto flex-1 py-2">
          <nav className="grid gap-1 px-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  location.pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50 hover:text-accent-foreground",
                  collapsed && "justify-center px-0"
                )}
              >
                <item.icon className={cn("h-5 w-5", collapsed && "h-5 w-5")} />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            ))}
          </nav>
        </div>

        {/* Multi-platform info card */}
        {showInfoCard && (
          <div className="px-3 py-2 hidden md:block">
            <Card className="p-4 bg-card shadow-md relative">
              <h2 className="text-md font-semibold">Warehouse Operations</h2>
              <p className="text-sm text-muted-foreground mb-2">
                Manage orders, batches, and inventory all in one place!
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
            </Card>
          </div>
        )}

        {/* Notification Button - Responsive */}
        <div className={cn("flex items-center justify-center p-3", collapsed && "p-2")}>
          <Button variant="secondary" className={cn("flex items-center gap-2", collapsed ? "w-auto p-2" : "w-full")}>
            <Bell className="h-5 w-5" />
            {!collapsed && <span className="text-sm">Notifications</span>}
            {notificationsCount > 0 && (
              <span className={cn("bg-red-500 text-white rounded-full px-2 text-xs", !collapsed && "ml-1")}>
                {notificationsCount}
              </span>
            )}
          </Button>
        </div>

        {/* Platform Selector - Improved UI and Position, Hide when collapsed */}
        <div className={cn("px-3 py-2", collapsed && "hidden")}>
          <Select onValueChange={handlePlatformChange} defaultValue="warehouse">
            <SelectTrigger>
              <SelectValue placeholder="Change platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="warehouse" className="text-default hover:bg-muted">
                Warehouse Platform
              </SelectItem>
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
          <div
            className={cn(
              "flex items-center gap-2 p-3",
              collapsed && "justify-center"
            )}
          >
            {!collapsed && (
              <>
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getInitials(user?.fullName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium leading-none truncate">
                    {user?.fullName || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email || "user@example.com"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => logout()}
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
      <main className={cn("flex-1 overflow-auto relative", !isRightSidebarOpen && "w-full")}>
        <div className="p-6">
          <Outlet />
        </div>

        {/* Toggle Right Sidebar Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
          className="fixed top-4 right-4 h-8 w-8 p-0 rounded-full shadow-md border z-10 bg-background"
          title={isRightSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <ChevronRight
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              !isRightSidebarOpen && "rotate-180"
            )}
          />
        </Button>

        {/* AI Chat Sheet */}
        <Sheet open={isAIChatOpen} onOpenChange={setIsAIChatOpen}>
          <SheetContent className="w-[400px] sm:w-[540px]">
            <div className="h-full py-6">
              <AiChat />
            </div>
          </SheetContent>
        </Sheet>

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

      {/* Enhanced Right Sidebar */}
      <aside 
        className={cn(
          "border-l border-border/90 bg-background overflow-y-auto transition-all duration-300",
          isRightSidebarOpen ? "w-80" : "w-0 border-l-0"
        )}
      >
        <div className={cn("p-4 space-y-6", !isRightSidebarOpen && "hidden")}>
          {/* Warehouse Capacity */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <WarehouseIcon className="h-4 w-4" />
              Warehouse Capacity
            </h3>
            <Card className="p-4 bg-background/50">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Current Utilization</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date().toLocaleDateString()}
                    </div>
                  </div>
                  <span className="text-md font-bold text-amber-500">78%</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Total Capacity</span>
                    <span>78% used</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Total Items</p>
                    <p className="text-sm font-medium">1,248</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Sections</p>
                    <p className="text-sm font-medium">12 active</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Zap className="h-4 w-4" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/warehouse/incoming-orders">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-1">
                  <Package className="h-4 w-4" />
                  <span className="text-xs">Process Orders</span>
                </Button>
              </Link>
              <Link to="/warehouse/sections">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-1">
                  <Layers className="h-4 w-4" />
                  <span className="text-xs">Manage Sections</span>
                </Button>
              </Link>
              <Link to="/warehouse/batches">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-1">
                  <FileStack className="h-4 w-4" />
                  <span className="text-xs">Create Batch</span>
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="w-full h-auto py-4 flex flex-col gap-1"
                onClick={() => setIsAIChatOpen(true)}
              >
                <HelpCircle className="h-4 w-4" />
                <span className="text-xs">Get Help</span>
              </Button>
            </div>
          </div>

          {/* Order Processing Queue */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Timer className="h-4 w-4" />
              Order Processing Queue
            </h3>
            <Card className="divide-y divide-border/40">
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-sm">Priority Orders</span>
                </div>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-red-100 text-red-800">12</span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-sm">Pending Arrivals</span>
                </div>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-amber-100 text-amber-800">35</span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-sm">Ready for Delivery</span>
                </div>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800">24</span>
              </div>
            </Card>
          </div>

          {/* System Status */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              Warehouse Status
            </h3>
            <Card className="divide-y divide-border/40">
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-sm">Scanning Systems</span>
                </div>
                <span className="text-xs text-muted-foreground">Operational</span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-sm">Sorting Equipment</span>
                </div>
                <span className="text-xs text-muted-foreground">Operational</span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-sm">Conveyors</span>
                </div>
                <span className="text-xs text-muted-foreground">Maintenance</span>
              </div>
            </Card>
          </div>

          {/* Warehouse Resources */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              Warehouse Resources
            </h3>
            <Card className="divide-y divide-border/40">
              <div className="p-3 flex items-center gap-3 hover:bg-muted/50 cursor-pointer">
                <Video className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Optimizing Warehouse Layout</p>
                  <p className="text-xs text-muted-foreground">7 min video tutorial</p>
                </div>
              </div>
              <div className="p-3 flex items-center gap-3 hover:bg-muted/50 cursor-pointer">
                <BookOpen className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Barcode Scanning Guide</p>
                  <p className="text-xs text-muted-foreground">Quick reference</p>
                </div>
              </div>
            </Card>
          </div>

          {/* AI Assistant Promo */}
          <Card className="p-4 bg-primary/5 border-primary/10">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Warehouse Assistant</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Need help optimizing warehouse operations? Ask our AI for recommendations on inventory placement, route planning, and more.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </aside>
    </div>
  );
} 