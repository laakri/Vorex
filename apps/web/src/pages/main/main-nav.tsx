import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Menu, X, Package, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { Logo } from "@/components/logo";
import { ModeToggle } from "@/components/mode-toggle";
import { useAuthStore } from "@/stores/auth.store";

const solutions = [
  {
    title: "For Sellers",
    description: "Manage your products and orders efficiently",
    href: "/seller",
  },
  {
    title: "For Warehouses",
    description: "Optimize your storage and inventory",
    href: "/warehouse",
  },
  {
    title: "For Drivers",
    description: "Join our delivery network",
    href: "/delivery",
  },
];

const company = [
  { title: "About", href: "/about" },
  { title: "Network", href: "/network" },
  { title: "Contact", href: "/contact" },
];

const transparentNavigationTrigger = cn(
  navigationMenuTriggerStyle(),
  "bg-transparent hover:bg-transparent focus:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent"
);

export function MainNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const { isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <>
      {/* Status banner with operational status */}
      {showBanner && (
        <div className={`relative w-full secondary-bg border-b py-1 transition-transform duration-300 ${scrolled ? '-translate-y-full' : 'translate-y-0'}`}>
          <div className="container flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
              <span className="text-foreground">Platform Status: Operational</span>
              <span className="text-muted-foreground ml-2">|</span>
              <span className="text-muted-foreground ml-2">Currently under development</span>
            </div>
            <button 
              onClick={() => setShowBanner(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close banner"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
      
      {/* Main Header */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          scrolled
            ? "bg-background/95 backdrop-blur-sm shadow-sm border-b"
            : "bg-transparent border-transparent"
        }`}
      >
        <nav className="container flex h-16 items-center justify-between">
          {/* Left section with Logo and Primary Navigation */}
          <div className="flex items-center gap-8">
            <Link to="/" className="-m-1.5 p-1.5">
              <Logo />
            </Link>

            {/* Primary Navigation */}
            <div className="hidden lg:flex lg:items-center lg:gap-6">
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger
                      className={transparentNavigationTrigger}
                    >
                      Solutions
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                        {solutions.map((solution) => (
                          <NavigationMenuLink
                            key={solution.title}
                            asChild
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <Link to={solution.href}>
                              <div className="text-sm font-medium leading-none">
                                {solution.title}
                              </div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                {solution.description}
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        ))}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>

              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger
                      className={transparentNavigationTrigger}
                    >
                      Company
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid w-[200px] gap-3 p-4">
                        {company.map((item) => (
                          <NavigationMenuLink
                            key={item.title}
                            asChild
                            className="block select-none rounded-md p-3 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <Link to={item.href}>{item.title}</Link>
                          </NavigationMenuLink>
                        ))}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
              {/* Direct Links */}
              <Link
                to="/pricing"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Pricing
              </Link>
            </div>
          </div>

          {/* Right section with Actions */}
          <div className="flex items-center gap-4">
            {/* Track Shipment Quick Access */}
            <div className="hidden lg:block">
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <Link to="/track">
                  <Package className="h-4 w-4" />
                  Track Shipment
                </Link>
              </Button>
            </div>

            {/* Auth Buttons */}
            <div className="hidden lg:flex lg:items-center lg:gap-2">
              {isAuthenticated ? (
                <>
                  <Button
                    asChild
                    variant="secondary"
                    size="sm"
                    className="gap-2"
                  >
                    <Link to="/role-selection">
                      <User className="h-4 w-4" />
                      Access App
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="text-sm font-medium"
                  >
                    <Link to="/auth/sign-in">Sign in</Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                  >
                    <Link to="/auth/sign-up">Start shipping</Link>
                  </Button>
                </>
              )}
              <ModeToggle />
            </div>

            {/* Mobile Menu Button */}
            <div className="flex lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Menu className="h-5 w-5" aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden">
              <div className="fixed inset-x-0 top-16 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                <div className="container py-4">
                  <div className="space-y-1">
                    <div className="px-2 py-3 font-medium text-sm text-muted-foreground">
                      Solutions
                    </div>
                    {solutions.map((solution) => (
                      <Link
                        key={solution.title}
                        to={solution.href}
                        className="block px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground"
                      >
                        {solution.title}
                      </Link>
                    ))}

                    <div className="px-2 py-3 font-medium text-sm text-muted-foreground">
                      Company
                    </div>
                    {company.map((item) => (
                      <Link
                        key={item.title}
                        to={item.href}
                        className="block px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground"
                      >
                        {item.title}
                      </Link>
                    ))}
                  </div>

                  <div className="mt-6 px-3 space-y-2">
                    {isAuthenticated ? (
                      <>
                        <Button
                          asChild
                          variant="outline"
                          className="w-full justify-center gap-2"
                        >
                          <Link to="/role-selection">
                            <User className="h-4 w-4" />
                            Access App
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-center gap-2"
                          onClick={handleLogout}
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          asChild
                          variant="outline"
                          className="w-full justify-center"
                        >
                          <Link to="/auth/sign-in">Sign in</Link>
                        </Button>
                        <Button asChild className="w-full justify-center">
                          <Link to="/auth/sign-up">Start shipping</Link>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>
    </>
  );
}
