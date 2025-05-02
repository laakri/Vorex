import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Route,
  Warehouse,
  Truck,
  BarChart3,
  Shield,
  Clock,
  CheckCircle2,
  User,
  ArrowRight,
  Zap,
  Box,
  Map,
} from "lucide-react";
import warehouse from "@/assets/warehouse.jpg";

export function MainHomePage() {
  return (
    <>
      <section className="relative min-h-screen overflow-hidden ">
        {/* 3D-like mesh grid background */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_rgba(var(--primary-rgb),0.03)_1px,_transparent_1px)] bg-[length:24px_24px]"></div>
        
        
        {/* Animated particles */}
        <div className="particle-container absolute inset-0 z-0 opacity-40">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i}
              className="absolute rounded-full bg-primary/20"
              style={{
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 20 + 10}s`,
                animationDelay: `${Math.random() * 5}s`
              }}
            ></div>
          ))}
        </div>

        {/* Hero content */}
        <div className="container relative z-10 mx-auto max-w-7xl px-4 py-20">
         
          
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 items-center mt-20">
            {/* Left content */}
            <div className="space-y-10">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
                  <Zap className="h-3.5 w-3.5" />
                  Next-Gen Logistics Platform
                </div>
                
                <h1 className="mt-6 font-bold text-5xl md:text-6xl lg:text-7xl tracking-tight leading-[1.1]">
                  Logistics at{" "}
                  <span className="relative">
                    <span className="relative z-10 bg-gradient-to-r from-primary to-red-500 bg-clip-text text-transparent">
                      lightspeed
                    </span>
                    <span className="absolute bottom-1 left-0 z-0 h-3 w-full bg-gradient-to-r from-primary/30 to-red-500/30 rounded-lg"></span>
                  </span>
                </h1>
                
                <p className="mt-6 text-xl text-muted-foreground leading-relaxed">
                  Experience the future of delivery infrastructure. Our AI-powered platform connects businesses with carriers through one unified dashboard.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {updatedClientLogos.map((logo, i) => (
                  <div key={i} className="flex h-10 items-center justify-center rounded-lg border bg-background/50 px-6 backdrop-blur-sm">
                    <span className="text-sm text-muted-foreground">{logo}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-5">
                <Button size="lg" className="h-14 rounded-xl text-base font-medium px-10 bg-gradient-to-r from-primary to-red-600 hover:from-primary/90 hover:to-red-600/90 shadow-lg shadow-primary/20">
                  <Link to="/register" className="flex items-center gap-2">
                    Start shipping now
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="h-14 rounded-xl text-base font-medium px-8 border-2">
                  <Link to="/demo">Watch demo</Link>
                </Button>
              </div>
            </div>
            
            {/* Right content - Interactive 3D-like shipping card */}
            <div className="relative aspect-[4/3] w-full">
              <div className="absolute -right-4 -top-4 h-full w-full rounded-2xl border-2 border-primary/10 bg-background/50 backdrop-blur-xl"></div>
              <div className="absolute -left-4 -bottom-4 h-full w-full rounded-2xl border-2 border-muted bg-muted/30 backdrop-blur-xl"></div>
              
              <div className="relative h-full w-full rounded-2xl border-2 border-border bg-background p-6 shadow-2xl">
                <div className="absolute -top-3 -right-3 rounded-lg bg-primary px-4 py-1 text-xs font-medium text-primary-foreground">
                  Live Tracking
                </div>
                
                <div className="flex h-full flex-col">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="font-semibold text-xl">Package Tracker</h3>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500"></span>
                      <span className="text-xs text-muted-foreground">Active</span>
                    </div>
                  </div>
                  
                  {/* Interactive map component */}
                  <div className="relative flex-1 rounded-lg bg-muted/40 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                      <Map className="h-full w-full stroke-[0.5]" />
                    </div>
                    
                    {/* Route visualization */}
                    <div className="absolute inset-0 p-4">
                      <div className="relative h-full w-full">
                        <div className="absolute top-1/4 left-1/5 h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
                        <div className="absolute top-1/3 left-2/5 h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
                        <div className="absolute top-1/2 right-2/5 h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
                        <div className="absolute bottom-1/4 right-1/5 h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
                        
                        <div className="absolute top-[28%] left-[25%] w-[15%] h-0.5 bg-red-500/50"></div>
                        <div className="absolute top-[33%] left-[40%] w-[20%] h-0.5 bg-red-500/50"></div>
                        <div className="absolute top-[42%] right-[40%] w-[15%] h-0.5 bg-red-500/50"></div>
                        
                        <div className="absolute w-4 h-4 bg-primary rounded-full top-1/2 right-1/4 shadow-lg shadow-primary/30 animate-ping"></div>
                        <div className="absolute w-3 h-3 bg-primary rounded-full top-1/2 right-1/4 shadow-lg shadow-primary/30 z-10"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Shipping data */}
                  <div className="mt-6 grid grid-cols-2 gap-6">
                    {trackingData.map((item, i) => (
                      <div key={i} className="space-y-1">
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className="font-medium">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  
                  {/* Delivery steps */}
                  <div className="mt-6 flex justify-between">
                    {updatedDeliverySteps.map((step, i) => (
                      <div key={i} className="flex flex-col items-center text-center">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${i <= 2 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          <step.icon className="h-5 w-5" />
                        </div>
                        <p className="mt-2 text-xs font-medium">{step.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Key metrics */}
          <div className="mt-24 grid grid-cols-2 gap-4 md:grid-cols-4">
            {updatedStats.map((stat, i) => (
              <div key={i} className="flex flex-col space-y-2 rounded-2xl border bg-background/50 p-6 backdrop-blur-sm">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-3xl font-bold">{stat.value}</h3>
                  {stat.trend && (
                    <div className={`text-xs ${stat.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {stat.trend > 0 ? '+' : ''}{stat.trend}%
                    </div>
                  )}
                </div>
              </div>
            ))}
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

// Updated data
const updatedClientLogos = [
  "Amazon",
  "Shopify",
  "Walmart",
  "Target",
  "FedEx",
  "DHL"
];

const trackingData = [
  { label: "Order Number", value: "VOX-9385-721" },
  { label: "Status", value: "In Transit" },
  { label: "Origin", value: "San Francisco, CA" },
  { label: "Destination", value: "New York, NY" },
];

const updatedDeliverySteps = [
  { label: "Pickup", icon: Box },
  { label: "Processing", icon: Warehouse },
  { label: "In Transit", icon: Truck },
  { label: "Delivered", icon: CheckCircle2 },
];

const updatedStats = [
  { label: "Active Users", value: "32K+", trend: 12 },
  { label: "Daily Deliveries", value: "87K+", trend: 8 },
  { label: "Service Uptime", value: "99.99%", trend: 0.5 },
  { label: "Service Areas", value: "650+", trend: 15 },
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
