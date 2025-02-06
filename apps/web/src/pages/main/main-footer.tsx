import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

export function MainFooter() {
  return (
    <footer className="border-t">
      <div className="container py-12 md:py-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="space-y-6">
            <h4 className="text-lg font-semibold">Solutions</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {solutions.map((item) => (
                <li key={item.title}>
                  <Link to={item.href} className="hover:text-primary">
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="text-lg font-semibold">Company</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {company.map((item) => (
                <li key={item.title}>
                  <Link to={item.href} className="hover:text-primary">
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="text-lg font-semibold">Legal</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link to="/privacy" className="hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-primary">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="hover:text-primary">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="text-lg font-semibold">Connect</h4>
            <div className="flex space-x-4">
              <Link to="#" className="text-muted-foreground hover:text-primary">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link to="#" className="text-muted-foreground hover:text-primary">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link to="#" className="text-muted-foreground hover:text-primary">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link to="#" className="text-muted-foreground hover:text-primary">
                <Linkedin className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Vorex. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

const solutions = [
  { title: "For Sellers", href: "/seller" },
  { title: "For Warehouses", href: "/warehouse" },
  { title: "For Drivers", href: "/driver" },
  { title: "Pricing", href: "/pricing" },
];

const company = [
  { title: "About", href: "/about" },
  { title: "Careers", href: "/careers" },
  { title: "Contact", href: "/contact" },
  { title: "Blog", href: "/blog" },
];
