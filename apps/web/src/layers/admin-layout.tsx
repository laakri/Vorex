import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  Search,
  HelpCircle,
  Warehouse as WarehouseIcon,
  ShieldCheck,
  Truck,
  BarChart3,
  FileText,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const adminMenuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin/dashboard",
  },
  {
    title: "User Management",
    icon: Users,
    href: "/admin/users",
    submenu: [
      { title: "All Users", href: "/admin/users" },
      { title: "Add User", href: "/admin/users/add" },
      { title: "Roles & Permissions", href: "/admin/users/roles" },
    ]
  },
  {
    title: "Warehouses",
    icon: WarehouseIcon,
    href: "/admin/warehouses",
    submenu: [
      { title: "All Warehouses", href: "/admin/warehouses" },
      { title: "Add Warehouse", href: "/admin/warehouses/add" },
      { title: "Warehouse Managers", href: "/admin/warehouses-managers" },
    ]
  },
  {
    title: "Logistics",
    icon: Truck,
    href: "/admin/logistics",
    submenu: [
      { title: "Routes", href: "/admin/logistics/routes" },
      { title: "Vehicles", href: "/admin/logistics/vehicles" },
      { title: "Drivers", href: "/admin/logistics/drivers" },
    ]
  },
  {
    title: "Analytics",
    icon: BarChart3,
    href: "/admin/analytics",
  },
  {
    title: "System Settings",
    icon: Settings,
    href: "/admin/settings",
    submenu: [
      { title: "General", href: "/admin/settings/general" },
      { title: "Security", href: "/admin/settings/security" },
      { title: "Integrations", href: "/admin/settings/integrations" },
    ]
  },
  {
    title: "Audit Logs",
    icon: FileText,
    href: "/admin/audit-logs",
  },
];

export function AdminLayout() {
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  
  // Add responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
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
    if (!name) return "A";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const toggleSubmenu = (title: string) => {
    if (expandedMenu === title) {
      setExpandedMenu(null);
    } else {
      setExpandedMenu(title);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "border-r bg-background transition-all duration-300 flex flex-col h-screen z-30",
          collapsed ? "w-[70px]" : "w-64",
          "lg:static fixed"
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between border-b px-4 shrink-0">
          {collapsed ? (
            <ShieldCheck className="h-8 w-8 text-primary" />
          ) : (
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">Admin Portal</span>
            </div>
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

        {/* Navigation */}
        <div className="overflow-y-auto flex-1 py-4">
          <nav className="grid gap-1 px-2">
            {adminMenuItems.map((item) => (
              <div key={item.href} className="mb-1">
                {item.submenu ? (
                  <>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        location.pathname.startsWith(item.href)
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50 hover:text-accent-foreground",
                        collapsed && "justify-center px-0"
                      )}
                      onClick={() => !collapsed && toggleSubmenu(item.title)}
                    >
                      <item.icon className={cn("h-5 w-5", collapsed && "h-5 w-5")} />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{item.title}</span>
                          <ChevronLeft className={cn(
                            "h-4 w-4 transition-transform",
                            expandedMenu === item.title && "rotate-90"
                          )} />
                        </>
                      )}
                    </Button>
                    {!collapsed && expandedMenu === item.title && (
                      <div className="ml-9 mt-1 grid gap-1">
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.href}
                            to={subItem.href}
                            className={cn(
                              "rounded-md px-3 py-1.5 text-sm transition-colors",
                              location.pathname === subItem.href
                                ? "bg-accent/70 text-accent-foreground"
                                : "text-muted-foreground hover:bg-accent/40 hover:text-accent-foreground"
                            )}
                          >
                            {subItem.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      location.pathname === item.href
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50 hover:text-accent-foreground",
                      collapsed && "justify-center px-0"
                    )}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <item.icon className={cn("h-5 w-5", collapsed && "h-5 w-5")} />
                        </TooltipTrigger>
                        {collapsed && <TooltipContent side="right">{item.title}</TooltipContent>}
                      </Tooltip>
                    </TooltipProvider>
                    {!collapsed && <span>{item.title}</span>}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* User Profile */}
        <div className="border-t shrink-0 p-4">
          <div
            className={cn(
              "flex items-center gap-3",
              collapsed && "justify-center"
            )}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-0 h-auto">
                  <Avatar className={cn("h-9 w-9 cursor-pointer ring-2 ring-primary/10", collapsed && "h-10 w-10")}>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(user?.fullName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.fullName || "Admin User"}</p>
                    <p className="text-xs text-muted-foreground">{user?.email || "admin@example.com"}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/admin/profile")}>
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/admin/settings")}>
                  System Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {!collapsed && (
              <div className="flex-1">
                <p className="text-sm font-medium leading-none">
                  {user?.fullName || "Admin User"}
                </p>
                <div className="flex items-center mt-1">
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    Administrator
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navigation */}
        <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search across the admin portal..."
                className="w-full pl-9 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <HelpCircle className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="container py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
} 