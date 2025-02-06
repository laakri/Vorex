import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Package, Truck, Scale, MapPin, Calculator } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Box, Shield, Code } from "lucide-react";
// Example pricing calculation
const examplePackages = [
  {
    name: "Small Package",
    icon: Package,
    weight: "Up to 5kg",
    dimensions: "30x20x15cm",
    examples: ["Documents", "Small electronics", "Clothing"],
    basePrice: 5,
  },
  {
    name: "Medium Package",
    icon: Box,
    weight: "Up to 15kg",
    dimensions: "50x40x30cm",
    examples: ["Home appliances", "Multiple items", "Medium boxes"],
    basePrice: 12,
  },
  {
    name: "Large Package",
    icon: Truck,
    weight: "Up to 30kg",
    dimensions: "80x60x50cm",
    examples: ["Furniture", "Large appliances", "Multiple boxes"],
    basePrice: 25,
  },
];

const distanceRates = [
  { range: "0-30km", price: 1 },
  { range: "31-100km", price: 2 },
  { range: "101-300km", price: 3 },
  { range: ">300km", price: 4 },
];

const additionalServices = [
  {
    name: "Express Delivery",
    price: "Additional dt 20",
    description: "Same-day delivery for urgent shipments",
  },
  {
    name: "Weekend Delivery",
    price: "Additional dt 15",
    description: "Saturday and Sunday deliveries",
  },
  {
    name: "Insurance Plus",
    price: "1% of declared value",
    description: "Extended coverage up to dt 5000",
  },
  {
    name: "Special Handling",
    price: "Additional dt 10",
    description: "For fragile or special care items",
  },
];

export function MainPricing() {
  return (
    <div className="py-24">
      <div className="container">
        {/* Header with consistent styling */}
        <div className="mx-auto max-w-4xl text-center pb-8 border-b">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Fair & Transparent <span className="text-primary">Pricing</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Pay only for what you ship. Our prices are calculated based on
            package size, weight, and delivery distance.
          </p>
        </div>

        {/* Interactive Price Calculator */}
        <div className="mt-16 mx-auto max-w-5xl">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Shipping Cost Calculator
              </CardTitle>
              <CardDescription>
                See how our pricing works with this interactive calculator
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Package Types */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    Package Types & Base Prices
                  </h3>
                  <div className="space-y-4">
                    {examplePackages.map((pkg) => (
                      <div
                        key={pkg.name}
                        className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                      >
                        <pkg.icon className="h-8 w-8 text-primary shrink-0" />
                        <div>
                          <h4 className="font-medium">{pkg.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {pkg.weight} • {pkg.dimensions}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Perfect for: {pkg.examples.join(", ")}
                          </p>
                          <p className="text-sm font-medium mt-2">
                            Base price: dt {pkg.basePrice}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Distance Rates */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Distance Rates (per km)
                  </h3>
                  <div className="relative">
                    {/* Distance visualization */}
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-primary/20 rounded-lg" />
                    <div className="relative space-y-4 p-4">
                      {distanceRates.map((rate) => (
                        <div
                          key={rate.range}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm font-medium">
                            {rate.range}
                          </span>
                          <span className="text-sm font-medium">
                            dt {rate.price}/km
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Example calculation */}
                  <div className="mt-8 p-4 rounded-lg border bg-card">
                    <h4 className="font-medium mb-2">Example Calculation</h4>
                    <p className="text-sm text-muted-foreground">
                      Medium package (15kg) shipped 150km:
                    </p>
                    <ul className="text-sm mt-2 space-y-1">
                      <li>Base price: dt 12</li>
                      <li>Distance rate: dt 3/km × 150km = dt 450</li>
                      <li className="font-medium pt-2">Total: dt 462</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Methods */}
        <div className="mt-24 mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold mb-8">Payment Methods</h2>
          <div className="inline-flex items-center gap-8 justify-center flex-wrap">
            <div className="text-sm">Credit/Debit Cards</div>
            <div className="text-sm">Bank Transfer</div>
            <div className="text-sm">Cash on Delivery</div>
            <div className="text-sm">Corporate Billing</div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Flexible payment options to suit your business needs
          </p>
        </div>
      </div>
    </div>
  );
}
