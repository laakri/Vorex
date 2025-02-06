import { Shield, Truck, Users, Package } from "lucide-react";

const values = [
  {
    icon: Shield,
    title: "Trust & Reliability",
    description:
      "Building lasting relationships through consistent service excellence and transparent operations",
  },
  {
    icon: Truck,
    title: "Innovation",
    description:
      "Leveraging cutting-edge technology to revolutionize logistics and enhance delivery efficiency",
  },
  {
    icon: Users,
    title: "Customer First",
    description:
      "Putting our customers' needs at the forefront of every decision and service improvement",
  },
  {
    icon: Package,
    title: "Quality Service",
    description:
      "Maintaining rigorous standards in handling, tracking, and delivering every package",
  },
];

const milestones = [
  {
    year: "2021",
    title: "Founded in Tunis",
    description: "Started with a vision to transform logistics",
  },
  {
    year: "2022",
    title: "Regional Expansion",
    description: "Extended operations to major cities",
  },
  {
    year: "2023",
    title: "Tech Integration",
    description: "Launched AI-powered routing system",
  },
  {
    year: "2024",
    title: "National Coverage",
    description: "Achieved presence in all governorates",
  },
];

export function MainAbout() {
  return (
    <div className="py-24">
      <div className="container">
        {/* Header */}
        <div className="mx-auto max-w-4xl text-center pb-8 border-b">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            About <span className="text-primary">Vorex</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Transforming logistics in Tunisia through technology and innovation
          </p>
        </div>

        {/* Story Section */}
        <div className="mt-16 mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold mb-6 text-center">Our Story</h2>
          <div className="prose prose-slate mx-auto">
            <p className="text-muted-foreground leading-relaxed">
              Founded in 2021, Vorex emerged from a simple yet powerful vision:
              to revolutionize Tunisia's logistics landscape. We recognized the
              growing needs of businesses in the digital age and the crucial
              role that efficient delivery services play in their success.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              What started as a small team in Tunis has grown into a nationwide
              network of dedicated professionals, advanced technology systems,
              and strategic delivery hubs. Our journey has been driven by a
              constant pursuit of innovation and an unwavering commitment to our
              customers' success.
            </p>
          </div>
        </div>

        {/* Mission Statement */}
        <div className="mt-24 mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold mb-6">Our Mission</h2>
          <p className="text-lg text-muted-foreground">
            To provide efficient, reliable, and innovative delivery solutions
            that empower businesses across Tunisia to grow and succeed in the
            digital economy.
          </p>
          <div className="mt-8 grid sm:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-lg bg-primary/5">
              <h3 className="font-medium mb-2">For Businesses</h3>
              <p className="text-muted-foreground">
                Enabling growth through reliable logistics infrastructure and
                innovative solutions
              </p>
            </div>
            <div className="p-4 rounded-lg bg-primary/5">
              <h3 className="font-medium mb-2">For Communities</h3>
              <p className="text-muted-foreground">
                Creating opportunities and connecting regions through efficient
                delivery networks
              </p>
            </div>
          </div>
        </div>

        {/* Company Values */}
        <div className="mt-24 border-t pt-16">
          <h2 className="text-2xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div
                key={value.title}
                className="flex flex-col items-center text-center p-6 rounded-lg bg-card/40 border"
              >
                <div className="rounded-full bg-primary/10 p-3 mb-4">
                  <value.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Milestones */}
        <div className="mt-24 border-t pt-16">
          <h2 className="text-2xl font-bold text-center mb-12">Our Journey</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {milestones.map((milestone) => (
              <div key={milestone.year} className="text-center">
                <div className="text-primary font-bold text-xl mb-2">
                  {milestone.year}
                </div>
                <h3 className="font-medium mb-1">{milestone.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {milestone.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="mt-24 border-t pt-16 text-center">
          <h2 className="text-2xl font-bold mb-6">Our Team</h2>
          <div className="max-w-3xl mx-auto">
            <p className="text-lg text-muted-foreground mb-8">
              We're a dedicated team of logistics experts, tech innovators, and
              customer service professionals working together to revolutionize
              delivery services in Tunisia.
            </p>
            <div className="grid sm:grid-cols-3 gap-8 text-sm">
              <div>
                <div className="font-medium mb-2">50+ Logistics Experts</div>
                <p className="text-muted-foreground">
                  Optimizing delivery operations
                </p>
              </div>
              <div>
                <div className="font-medium mb-2">30+ Tech Innovators</div>
                <p className="text-muted-foreground">
                  Building the future of delivery
                </p>
              </div>
              <div>
                <div className="font-medium mb-2">100+ Support Staff</div>
                <p className="text-muted-foreground">
                  Ensuring customer satisfaction
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Vision for Future */}
        <div className="mt-24 text-center max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Looking Forward</h2>
          <p className="text-muted-foreground leading-relaxed">
            As we continue to grow, our focus remains on pushing the boundaries
            of what's possible in logistics. We're investing in sustainable
            practices, expanding our infrastructure, and developing new
            technologies to better serve our customers and contribute to
            Tunisia's economic growth.
          </p>
        </div>
      </div>
    </div>
  );
}
