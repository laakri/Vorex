import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Truck,
  Map,
  Shield,
  BarChart3,
  User,
  ArrowRight,
  Zap,
} from "lucide-react";

export function MainHomePage() {
  return (
    <>
      {/* HERO SECTION */}
      <section className="relative bg-background text-foreground overflow-hidden">
        <div className="min-h-screen flex flex-col justify-center items-center px-4 pb-0 relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-4 text-sm font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full border border-primary/30 shadow-sm">
            <Zap className="w-4 h-4" />
            One Dashboard. Every Carrier.
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-center">
            Shipping Made <span className="text-primary">Seamless</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-lg text-muted-foreground max-w-xl text-center">
            Real-time visibility, automated quotes, and unified tracking—all in one beautifully simple interface.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="px-8 py-5 text-base rounded-xl shadow-md">
              <Link to="/register" className="flex items-center gap-2">
                Start Shipping
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-5 text-base rounded-xl">
              <Link to="/track">Track a Package</Link>
            </Button>
          </div>

          {/* Dashboard Preview */}
          <div className="relative z-10 w-full max-w-6xl mx-auto mt-16 rounded-t-xl overflow-hidden shadow-2xl border border-border">
            <div className="h-[600px] overflow-hidden rounded-t-xl">
              <img
                src="https://i.ibb.co/TMbtfFxn/Screenshot-2025-05-30-110220.png"
                alt="Dashboard Preview"
                className="w-full object-cover object-top"
              />
            </div>
          </div>
        </div>
        {/* WAVE CLIPPING IMAGE */}
        <div className="absolute bottom-0 left-0 w-full z-20 pointer-events-none">
          <svg
            viewBox="0 0 1440 100"
            className="w-full h-[100px]"
            preserveAspectRatio="none"
          >
            <path d="M0,64 C360,100 1080,0 1440,64 L1440,160 L0,160 Z" fill="hsl(var(--card))" /> {/* Tailwind bg-muted */}
          </svg>
        </div>
        
      </section>
      {/* NEXT SECTION */}
      <section className="bg-muted text-foreground  py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Why Choose Us?</h2>
          <p className="text-muted-foreground max-w-2xl">
            Instant tracking, real-time updates, and reliable shipping performance across all your carriers—seamlessly.
          </p>
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
