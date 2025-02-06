import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Route,
  Warehouse,
  Truck,
  BarChart3,
  Shield,
  Clock,
  Package,
  CheckCircle2,
  User,
} from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import warehouse from "@/assets/warehouse.jpg";

export function MainHomePage() {
  return (
    <>
      <section className="relative min-h-screen flex items-center">
        {/* Background with overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/50" />
          <img
            src={heroBg}
            alt="Logistics Background"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Hero content */}
        <div className="container mx-auto max-w-7xl relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center justify-center pt-24">
          <div className="space-y-6 ">
            <h1 className="font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight">
              Ship smarter,
              <br />
              deliver{" "}
              <span className="text-primary relative">
                faster
                <span className="absolute bottom-2 left-0 w-full h-2 bg-primary/20 -z-10 rounded-lg" />
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-[600px]">
              Transform your delivery operations with our intelligent logistics
              platform. Connect with reliable carriers, optimize routes, and
              delight your customers.
            </p>
            <div className="flex gap-4">
              <Button asChild size="lg" className="text-base">
                <Link to="/register">Get started</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base">
                <Link to="/network">View our network</Link>
              </Button>
            </div>
          </div>

          {/* Delivery Status Stepper */}
          <div className=" w-max">
            <h3 className="font-semibold text-xl mb-6">How it works</h3>
            <div className="space-y-8">
              {deliverySteps.map((step, index) => (
                <div key={step.title} className="flex gap-4  w-max">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <step.icon className="w-4 h-4 text-primary" />
                    </div>
                    {index !== deliverySteps.length - 1 && (
                      <div className="w-0.5 h-full bg-border mt-2" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-medium">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container space-y-6 bg-slate-50 py-8 dark:bg-transparent md:py-12 lg:py-24">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
            Features
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Everything you need to manage your logistics operations efficiently
          </p>
        </div>
        <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="relative overflow-hidden rounded-lg border bg-background p-2"
            >
              <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                <feature.icon className="h-12 w-12" />
                <div className="space-y-2">
                  <h3 className="font-bold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/50">
        <div className="container py-24 sm:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat.label} className="space-y-2">
                <h3 className="text-4xl font-bold">{stat.value}</h3>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="container py-24 sm:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Why choose Vorex for your logistics?
            </h2>
            <p className="text-muted-foreground">
              We combine cutting-edge technology with years of logistics
              expertise to deliver the best possible service for your business.
            </p>
            <div className="space-y-4">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{benefit.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-background to-transparent z-10" />
            <img
              src={warehouse}
              alt="Modern Warehouse"
              className="rounded-lg object-cover w-full h-[600px]"
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container py-24 sm:py-32">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
            Trusted by Businesses
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            See what our customers say about their experience with Vorex
          </p>
        </div>
        <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] lg:grid-cols-3 mt-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.author}
              className="relative overflow-hidden rounded-lg border bg-background p-6"
            >
              <div className="space-y-4">
                <p className="text-muted-foreground">{testimonial.content}</p>
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-1 text-primary">
                    {testimonial.image}
                  </div>
                  <div>
                    <h4 className="font-semibold">{testimonial.author}</h4>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t">
        <div className="container flex flex-col items-center justify-center gap-4 py-24 text-center md:gap-10">
          <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
            Ready to Transform Your Deliveries?
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Join thousands of businesses that trust Vorex for their logistics
            needs
          </p>
          <Button asChild size="lg" className="mt-4">
            <Link to="/register">Get Started Today</Link>
          </Button>
        </div>
      </section>
    </>
  );
}

const deliverySteps = [
  {
    title: "Request Pickup",
    description: "Schedule a pickup from your location",
    icon: Package,
  },
  {
    title: "Warehouse Processing",
    description: "Package sorting and route optimization",
    icon: Warehouse,
  },
  {
    title: "In Transit",
    description: "Real-time tracking of your delivery",
    icon: Truck,
  },
  {
    title: "Delivered",
    description: "Confirmation and delivery proof",
    icon: CheckCircle2,
  },
];

const stats = [
  { value: "20K+", label: "Active Users" },
  { value: "500+", label: "Cities Covered" },
  { value: "99.9%", label: "Delivery Success" },
  { value: "24/7", label: "Customer Support" },
];

const benefits = [
  {
    title: "Advanced Route Optimization",
    description: "AI-powered algorithms for the most efficient delivery routes",
  },
  {
    title: "Real-time Tracking",
    description: "Monitor your shipments with precise GPS tracking",
  },
  {
    title: "Secure Handling",
    description: "Enterprise-grade security for your valuable cargo",
  },
  {
    title: "Cost Effective",
    description: "Competitive pricing with no hidden fees",
  },
];

const features = [
  {
    title: "Smart Routing",
    description: "AI-powered route optimization for maximum efficiency",
    icon: Route,
  },
  {
    title: "Warehouse Management",
    description: "Complete control over your inventory and storage",
    icon: Warehouse,
  },
  {
    title: "Fleet Management",
    description: "Track and manage your delivery fleet in real-time",
    icon: Truck,
  },
  {
    title: "Analytics",
    description: "Detailed insights and reporting for better decisions",
    icon: BarChart3,
  },
  {
    title: "Secure Platform",
    description: "Enterprise-grade security for your logistics operations",
    icon: Shield,
  },
  {
    title: "Real-time Tracking",
    description: "Live tracking and status updates for all deliveries",
    icon: Clock,
  },
];

const testimonials = [
  {
    content:
      "Vorex has revolutionized how we handle our deliveries. The real-time tracking and optimization features have saved us countless hours.",
    author: "Sarah Johnson",
    role: "Operations Manager",
    image: <User className="h-6 w-6" />,
  },
  {
    content:
      "The warehouse management system is intuitive and powerful. It's helped us reduce errors and improve efficiency by 40%.",
    author: "Michael Chen",
    role: "Warehouse Director",
    image: <User className="h-6 w-6" />,
  },
  {
    content:
      "As a driver, the mobile app makes my job so much easier. The route optimization is spot-on and the interface is user-friendly.",
    author: "Ahmed Hassan",
    role: "Senior Driver",
    image: <User className="h-6 w-6" />,
  },
];
