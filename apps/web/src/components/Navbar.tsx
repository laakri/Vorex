import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full bg-background border-b z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full" />
            <span className="text-2xl font-bold text-primary">Vorex</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-muted-foreground hover:text-primary transition"
            >
              Home
            </Link>
            <Link
              to="/about"
              className="text-muted-foreground hover:text-primary transition"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="text-muted-foreground hover:text-primary transition"
            >
              Contact
            </Link>
          </div>

          {/* Platform Links */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link to="/seller">Seller Platform</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/warehouse">Warehouse</Link>
            </Button>
            <Button variant="default" asChild>
              <Link to="/delivery">Delivery</Link>
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/">Home</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/about">About</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/contact">Contact</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/seller">Seller Platform</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/warehouse">Warehouse</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/delivery">Delivery</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
