import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Truck,
  Map,
  CheckCircle2,
  Clock,
  Shield,
  BarChart3,
  User,
  ArrowRight,
  Package,
  Zap,
} from "lucide-react";

export function MainHomePage() {
  return (
    <>
      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center bg-background text-foreground overflow-hidden">
        {/* Cinematic dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-black opacity-90 z-0" />
        {/* Subtle gold/yellow radial highlight */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[80vw] h-[40vw] bg-[radial-gradient(ellipse_at_center,_rgba(255,215,0,0.08)_0%,_transparent_80%)] z-0" />
        <div className="container relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16 py-24">
          {/* Left: Headline & CTA */}
          <div className="max-w-xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary shadow">
              <Zap className="h-4 w-4" />
              Unified Shipment Platform
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
              Ship with <span className="text-primary">Confidence</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Real-time tracking, instant quotes, and seamless management for all your shipments—one dashboard, every carrier.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button size="lg" className="bg-primary text-primary-foreground font-semibold px-10 py-6 text-base rounded-xl shadow-lg hover:bg-primary/90">
                <Link to="/register" className="flex items-center gap-2">
                  Start Shipping
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="border-primary text-primary font-semibold px-8 py-6 rounded-xl">
                <Link to="/track">Track a Package</Link>
              </Button>
            </div>
            <div className="flex gap-4 mt-8 opacity-80">
              {clientLogos.map((logo, i) => (
                <span key={i} className="text-xs font-medium text-muted-foreground bg-card/60 px-3 py-1 rounded shadow border border-border">
                  {logo}
                </span>
              ))}
            </div>
          </div>
          {/* Right: Shipment Card Preview */}
          <div className="relative w-full max-w-md">
            <div className="rounded-2xl border-2 border-primary/20 bg-card/80 shadow-2xl p-8 flex flex-col gap-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-primary font-bold text-lg flex items-center gap-2">
                  <Truck className="h-5 w-5" /> Live Shipment
                </span>
                <span className="text-xs text-muted-foreground">In Transit</span>
              </div>
              <div className="relative h-32 w-full rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden">
                <Map className="absolute inset-0 w-full h-full opacity-10" />
                <div className="relative z-10 flex flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground">Tracking #</span>
                  <span className="font-mono text-lg font-bold tracking-wider">VOX-9385-721</span>
                  <span className="mt-2 flex items-center gap-2 text-sm text-primary">
                    <Package className="h-4 w-4" /> San Francisco → New York
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <span className="font-semibold text-green-400 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> In Transit</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground">ETA</span>
                  <span className="font-semibold flex items-center gap-1"><Clock className="h-4 w-4 text-primary" /> 2d 4h</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="container py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="rounded-xl bg-card/80 border border-border p-6 flex flex-col items-center shadow">
              <span className="text-3xl font-bold text-primary">{stat.value}</span>
              <span className="text-sm text-muted-foreground mt-2">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="container py-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Why Choose Us?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, i) => (
            <div key={i} className="rounded-xl bg-card/70 border border-border p-6 flex flex-col items-center gap-4 shadow">
              <feature.icon className="h-10 w-10 text-primary" />
              <span className="font-semibold text-lg text-foreground text-center">{feature.title}</span>
              <span className="text-sm text-muted-foreground text-center">{feature.description}</span>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="container py-16">
        <h2 className="text-3xl font-bold mb-8 text-center">What Our Clients Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <div key={i} className="rounded-xl bg-card/80 border border-border p-6 flex flex-col gap-4 shadow">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2 text-primary">{testimonial.image}</div>
                <div>
                  <span className="font-semibold text-foreground">{testimonial.author}</span>
                  <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
              <p className="text-muted-foreground text-sm">{testimonial.content}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="border-t border-border bg-background py-16">
        <div className="container flex flex-col items-center justify-center gap-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold">Ready to Ship Smarter?</h2>
          <p className="text-muted-foreground max-w-xl">
            Join thousands of businesses that trust our platform for their logistics and shipment needs.
          </p>
          <Button asChild size="lg" className="bg-primary text-primary-foreground font-semibold px-10 py-6 text-base rounded-xl shadow-lg hover:bg-primary/90 mt-4">
            <Link to="/register">Get Started Today</Link>
          </Button>
        </div>
      </section>
    </>
  );
}

const clientLogos = [
  "Amazon",
  "Shopify",
  "Walmart",
  "FedEx",
  "DHL",
  "UPS",
];

const stats = [
  { value: "20K+", label: "Active Shippers" },
  { value: "500+", label: "Cities Covered" },
  { value: "99.9%", label: "On-Time Delivery" },
  { value: "24/7", label: "Support" },
];

const features = [
  {
    title: "Real-Time Tracking",
    description: "Monitor every shipment with live GPS and instant updates.",
    icon: Map,
  },
  {
    title: "Secure Shipments",
    description: "Enterprise-grade security and insurance for your cargo.",
    icon: Shield,
  },
  {
    title: "Instant Quotes",
    description: "Get the best rates from multiple carriers instantly.",
    icon: BarChart3,
  },
  {
    title: "Fleet Management",
    description: "Manage all your shipments and vehicles in one place.",
    icon: Truck,
  },
];

const testimonials = [
  {
    content:
      "This platform made our shipping process seamless and transparent. The real-time tracking is a game changer!",
    author: "Sarah Johnson",
    role: "Logistics Manager",
    image: <User className="h-6 w-6" />,
  },
  {
    content:
      "We saved time and money by comparing rates instantly. Highly recommended for any business shipping at scale.",
    author: "Michael Chen",
    role: "E-commerce Director",
    image: <User className="h-6 w-6" />,
  },
  {
    content:
      "Support is top-notch and the dashboard is super intuitive. Our team loves it!",
    author: "Ahmed Hassan",
    role: "Operations Lead",
    image: <User className="h-6 w-6" />,
  },
];
