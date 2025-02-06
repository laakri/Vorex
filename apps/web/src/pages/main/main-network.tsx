import {
  MapPin,
  Building2,
  Truck,
  Users,
  Clock,
  Shield,
  Package,
  Route,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const regions = [
  {
    name: "North",
    cities: ["Bizerte", "Béja", "Jendouba", "Le Kef", "Siliana", "Zaghouan"],
    hub: "Bizerte",
    deliveryTime: "Same day - 24h",
    coverage: "98%",
  },
  {
    name: "Central",
    cities: ["Sousse", "Monastir", "Mahdia", "Kairouan", "Kasserine"],
    hub: "Sousse",
    deliveryTime: "Same day - 48h",
    coverage: "95%",
  },
  {
    name: "South",
    cities: ["Sfax", "Gabès", "Médenine", "Tataouine", "Gafsa", "Tozeur"],
    hub: "Sfax",
    deliveryTime: "24h - 72h",
    coverage: "92%",
  },
];

const networkStats = [
  { icon: Building2, label: "Warehouses", value: "3" },
  { icon: MapPin, label: "Cities", value: "24+" },
  { icon: Truck, label: "Active Drivers", value: "500+" },
  { icon: Users, label: "Daily Deliveries", value: "2000+" },
];

const deliveryFeatures = [
  {
    icon: Clock,
    title: "Express Delivery",
    description: "Same-day delivery in major cities",
  },
  {
    icon: Route,
    title: "Smart Routing",
    description: "AI-powered route optimization",
  },
  {
    icon: Shield,
    title: "Secure Handling",
    description: "End-to-end package protection",
  },
  {
    icon: Package,
    title: "Real-time Tracking",
    description: "Live updates and notifications",
  },
];

const networkMetrics = [
  { metric: "Average Delivery Time", value: "22 hours" },
  { metric: "On-time Delivery Rate", value: "98.5%" },
  { metric: "Customer Satisfaction", value: "4.8/5" },
  { metric: "Coverage Area", value: "95%" },
  { metric: "Active Partners", value: "1000+" },
  { metric: "Monthly Deliveries", value: "60,000+" },
];

export function MainNetwork() {
  return (
    <div className="py-24">
      <div className="container">
        {/* Header with border */}
        <div className="mx-auto max-w-4xl text-center pb-8 border-b">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Our Delivery <span className="text-primary">Network</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Covering all major cities in Tunisia with strategic warehouse
            locations for efficient deliveries
          </p>
        </div>

        {/* Network Overview Text */}
        <div className="mt-12 text-center max-w-3xl mx-auto">
          <p className="text-sm text-muted-foreground leading-relaxed">
            At Vorex, we've built Tunisia's most comprehensive delivery
            infrastructure. Our strategic network of warehouses and delivery
            hubs ensures fast, reliable service across the country, from major
            cities to rural areas.
          </p>
        </div>

        {/* Stats with border */}
        <div className="mt-12 p-8 border rounded-xl bg-card/40">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {networkStats.map((stat) => (
              <div
                key={stat.label}
                className="text-center p-4 border-r last:border-r-0"
              >
                <div className="flex flex-col items-center">
                  <stat.icon className="h-6 w-6 text-primary mb-2" />
                  <div className="text-xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regional Coverage */}
        <div className="mt-24">
          <h2 className="text-2xl font-bold text-center mb-8">
            Regional Coverage
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {regions.map((region) => (
              <Card key={region.name} className="border-none shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-primary">
                      {region.name}
                    </h3>
                    <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {region.coverage}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Hub: {region.hub}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Delivery: {region.deliveryTime}
                  </p>
                  <div className="space-y-2">
                    {region.cities.map((city) => (
                      <div
                        key={city}
                        className="flex items-center gap-2 text-sm"
                      >
                        <MapPin className="h-3 w-3 text-primary" />
                        {city}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Delivery Features */}
        <div className="mt-16 border-t pt-16">
          <h2 className="text-2xl font-bold text-center mb-8">
            Network Capabilities
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            {deliveryFeatures.map((feature) => (
              <div key={feature.title} className="flex items-start gap-4 p-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Network Metrics */}
        <div className="mt-16 border-t pt-16">
          <h2 className="text-2xl font-bold text-center mb-8">
            Network Performance
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {networkMetrics.map((item) => (
              <div key={item.metric} className="p-4 text-center">
                <div className="text-xl font-bold text-primary">
                  {item.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {item.metric}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Network Expansion */}
        <div className="mt-24 border-t pt-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-6">Growing Together</h2>
            <p className="text-muted-foreground mb-8">
              Our network is continuously expanding to meet the growing demands
              of e-commerce and business logistics in Tunisia. We're committed
              to providing the most comprehensive delivery coverage across the
              country.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div className="p-4 rounded-lg bg-primary/5">
                <h3 className="font-medium mb-2">Last Mile Coverage</h3>
                <p className="text-muted-foreground">
                  Reaching even the most remote areas with our dedicated local
                  partners
                </p>
              </div>
              <div className="p-4 rounded-lg bg-primary/5">
                <h3 className="font-medium mb-2">Hub Expansion</h3>
                <p className="text-muted-foreground">
                  New strategic locations being added to optimize delivery
                  routes
                </p>
              </div>
              <div className="p-4 rounded-lg bg-primary/5">
                <h3 className="font-medium mb-2">Partner Network</h3>
                <p className="text-muted-foreground">
                  Collaborating with local businesses to strengthen our presence
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Button className="bg-primary hover:bg-primary/90">
            <span>Join Our Network</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
