import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  MapPin,
  Clock,
  AlertCircle,
} from "lucide-react";

// Import your image
import trackingHero from "@/assets/tracking-hero.jpg";

const trackingSteps = [
  {
    icon: Package,
    title: "Package Received",
    description: "Order confirmed and picked up",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Truck,
    title: "In Transit",
    description: "On its way to destination",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    icon: CheckCircle2,
    title: "Delivered",
    description: "Successfully delivered",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
];

const trackingFeatures = [
  {
    icon: Clock,
    title: "Real-time Updates",
    description: "Track your package's journey live",
  },
  {
    icon: MapPin,
    title: "Location Tracking",
    description: "See exactly where your package is",
  },
  {
    icon: AlertCircle,
    title: "Instant Notifications",
    description: "Get updates via SMS or email",
  },
];

export function MainTrack() {
  return (
    <>
      {/* Hero Section with Background */}
      <div className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img
            src={trackingHero}
            alt="Tracking"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-background" />
        </div>

        {/* Content */}
        <div className="relative container max-w-4xl text-center text-white space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Track Your Delivery
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            Real-time tracking for your shipments across Tunisia
          </p>

          {/* Improved Tracking Input */}
          <div className="max-w-xl mx-auto mt-8">
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardContent className="p-3">
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter your tracking number"
                    className="h-14 bg-white/90 border-0 text-black placeholder:text-gray-500 text-lg px-4"
                  />
                  <Button className="h-14 px-8 bg-primary hover:bg-primary/90 text-base font-medium">
                    <Search className="h-5 w-5 mr-2 stroke-[2]" />
                    Track
                  </Button>
                </div>
              </CardContent>
            </Card>
            <p className="text-sm text-white/60 mt-3">
              Example: VRX-1234567890
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-24">
        {/* Tracking Steps */}
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            Simple Tracking Process
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {trackingSteps.map((step, index) => (
              <div
                key={step.title}
                className="relative p-6 rounded-xl border bg-card/40 backdrop-blur"
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`${step.bgColor} p-3 rounded-xl mb-4`}>
                    <step.icon className={`h-6 w-6 ${step.color}`} />
                  </div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                {index !== trackingSteps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 left-full w-8 border-t border-dashed border-muted-foreground/30 -translate-y-1/2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8">
            {trackingFeatures.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col items-center text-center p-6"
              >
                <div className="rounded-full bg-primary/10 p-3 mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-24 text-center">
          <Card className="max-w-2xl mx-auto bg-primary/5 border-primary/20">
            <CardContent className="py-8">
              <h3 className="text-xl font-semibold mb-2">
                Need to Send a Package?
              </h3>
              <p className="text-muted-foreground mb-6">
                Get started with Vorex delivery services today
              </p>
              <Button className="bg-primary hover:bg-primary/90">
                Start Shipping
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
