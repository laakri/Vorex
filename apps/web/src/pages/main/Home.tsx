import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Package, Truck, BarChart3 } from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="w-full py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Modern Delivery for
              <span className="text-primary"> Modern Business</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Streamline your logistics with our comprehensive delivery
              management system. Connect sellers, warehouses, and drivers in one
              unified platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/seller">
                  Start Selling <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Package className="h-8 w-8 text-primary" />}
              title="Seller Platform"
              description="Manage your products, track orders, and grow your business with powerful analytics."
            />
            <FeatureCard
              icon={<Truck className="h-8 w-8 text-primary" />}
              title="Delivery System"
              description="Efficient route planning and real-time tracking for seamless deliveries."
            />
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8 text-primary" />}
              title="Warehouse Management"
              description="Optimize inventory and streamline operations with our warehouse solutions."
            />
          </div>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => {
  return (
    <div className="bg-card p-6 rounded-lg shadow-sm border hover:shadow-md transition">
      <div className="flex flex-col items-center text-center">
        {icon}
        <h3 className="mt-4 text-xl font-semibold">{title}</h3>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};

export default Home;
