import { Link, Outlet, useLocation } from "react-router-dom";
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
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AiChat } from "@/pages/seller/ai-chat";
import { useAuthStore } from "@/stores/auth.store";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Badge } from "@/components/ui/badge";

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

interface UserData {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
  role: 'SELLER' | 'ADMIN' | 'WAREHOUSE_MANAGER' | 'DRIVER';
}

export function SellerLayout() {
  const location = useLocation();
  const { logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const { data: userData } = useQuery<UserData>({
    queryKey: ["userData"],
    queryFn: async () => {
      const response = await api.get("/users/me");
      return response.data;
    },
  });

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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

        {/* User Profile - Fixed height */}
        <div className="border-t shrink-0">
          <div
            className={cn(
              "flex items-center gap-3 p-4",
              collapsed && "justify-center"
            )}
          >
            {!collapsed && (
              <>
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={userData?.avatar} />
                  <AvatarFallback>{getInitials(userData?.fullName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium leading-none truncate">
                      {userData?.fullName || "Loading..."}
                    </p>
                    <Badge 
                      variant="outline"
                      className="px-1 h-4 text-[10px] font-medium border-primary/20 text-primary"
                    >
                      {userData?.role?.split('_').join(' ').toLowerCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {userData?.email || "Loading..."}
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
                  <AvatarImage src={userData?.avatar} />
                  <AvatarFallback>{getInitials(userData?.fullName)}</AvatarFallback>
                </Avatar>
                <div className="absolute left-full ml-2 pl-1 invisible group-hover:visible">
                  <Badge 
                    variant="outline"
                    className="whitespace-nowrap px-1 h-4 text-[10px] font-medium border-primary/20 text-primary"
                  >
                    {userData?.role?.split('_').join(' ').toLowerCase()}
                  </Badge>
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
