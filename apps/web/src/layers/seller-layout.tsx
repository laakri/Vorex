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
  ChevronRight,
  Brain,
  X,
  Settings,
  HelpCircle,
  Zap,
  Activity,
  TrendingUp,
  Calendar,
  CheckCircle2,
  BookOpen,
  Video,
  Code,
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
import { AddProductModal } from "@/pages/seller/products/add-product-modal";
import NotificationButton from "@/pages/notification/NotificationButton";

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
  {
    title: "Guide",
    icon: BookOpen,
    href: "/seller/guide",
  },
  {
    title: "API Access",
    icon: Code,
    href: "/seller/api",
  },
];

export function SellerLayout() {
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const [showInfoCard, setShowInfoCard] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  // Add responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1080) {
        setCollapsed(true);
        setShowInfoCard(false);
        setIsRightSidebarOpen(false);
      } else {
        setCollapsed(false);
        setShowInfoCard(true);
        setIsRightSidebarOpen(true);
      }
    };

    // Initial check
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update info card visibility when sidebar is collapsed
  useEffect(() => {
    if (collapsed) {
      setShowInfoCard(false);
    }
  }, [collapsed]);

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
    else if (value === "warehouse") {
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

        {/* Informational Card about Driver Role - Hide on small screens and when collapsed */}
        {showInfoCard && !collapsed && (
          <div className="px-3 py-2 hidden md:block">
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
              <Button onClick={() => handlePlatformChange("driver")} className="mt-2 text-md" size="sm">
                Switch to Driver
              </Button>
            </Card>
          </div>
        )}

        <NotificationButton collapsed={collapsed} />


        {/* Platform Selector - Improved UI and Position, Hide when collapsed */}
        <div className={cn("px-3 py-2", collapsed && "hidden")}>
          <Select onValueChange={handlePlatformChange} defaultValue="seller">
            <SelectTrigger>
              <SelectValue placeholder="Change platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="seller" className="text-default hover:bg-muted">
                Seller 
              </SelectItem>
              <SelectItem value="driver" className="text-default hover:bg-muted">
                Driver 
              </SelectItem>
              <SelectItem value="warehouse" className="text-default hover:bg-muted">
                Warehouse 
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

      {/* Mobile sidebar toggle button - Only visible on small screens */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setCollapsed(!collapsed)}
        className="fixed top-4 left-4 z-30 h-8 w-8 p-0 rounded-full shadow-md border bg-background md:hidden"
      >
        <ChevronRight
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            !collapsed && "rotate-180"
          )}
        />
      </Button>

      {/* Main Content - Add backdrop for mobile */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Backdrop for mobile sidebar */}
        {!collapsed && (
          <div 
            className="fixed inset-0 bg-black/30 z-10 md:hidden" 
            onClick={() => setCollapsed(true)}
          />
        )}
        
        <main className={cn("flex-1 overflow-auto relative", !isRightSidebarOpen && "w-full")}>
          <div className="p-6">
            <Outlet />
          </div>

          {/* Toggle Right Sidebar Button - Only show on larger screens */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
            className="fixed top-4 right-4 h-8 w-8 p-0 rounded-full shadow-md border z-10 bg-background hidden md:flex"
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
            {/* Activity Overview */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Activity className="h-4 w-4" />
                Activity Overview
              </h3>
              <Card className="p-4 bg-background/50">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Today's Activity</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date().toLocaleDateString()}
                      </div>
                    </div>
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Active Time</p>
                      <p className="text-sm font-medium">2h 15m</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Sessions</p>
                      <p className="text-sm font-medium">3</p>
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
                <Button 
                  variant="outline" 
                  className="w-full h-auto py-4 flex flex-col gap-1"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <Package className="h-4 w-4" />
                  <span className="text-xs">New Product</span>
                </Button>
                <Link to="/seller/orders">
                  <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-1">
                    <ShoppingCart className="h-4 w-4" />
                    <span className="text-xs">View Orders</span>
                  </Button>
                </Link>
                <Link to="/seller/settings">
                  <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-1">
                    <Settings className="h-4 w-4" />
                    <span className="text-xs">Settings</span>
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="w-full h-auto py-4 flex flex-col gap-1"
                  onClick={() => setIsAIChatOpen(true)}
                >
                  <HelpCircle className="h-4 w-4" />
                  <span className="text-xs">Help Center</span>
                </Button>
              </div>
            </div>

            {/* System Status */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                System Status
              </h3>
              <Card className="divide-y divide-border/40">
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-sm">API Services</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Operational</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-sm">Payment Processing</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Operational</span>
                </div>
              </Card>
            </div>

           
            {/* Learning Resources */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                Learning Resources
              </h3>
              <Card className="divide-y divide-border/40">
                <div className="p-3 flex items-center gap-3 hover:bg-muted/50 cursor-pointer">
                  <Video className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Product Photography Tips</p>
                    <p className="text-xs text-muted-foreground">5 min video tutorial</p>
                  </div>
                </div>
                <div className="p-3 flex items-center gap-3 hover:bg-muted/50 cursor-pointer">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">SEO Best Practices</p>
                    <p className="text-xs text-muted-foreground">Quick guide</p>
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
                  <p className="text-sm font-medium">AI Assistant</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Get instant help with your store management. Click the AI button below to start a conversation.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </aside>
      </div>

      {/* Add Product Modal */}
      <AddProductModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
