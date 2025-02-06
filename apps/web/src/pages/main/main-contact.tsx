import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, Building } from "lucide-react";

const contactMethods = [
  {
    icon: Phone,
    title: "Call Us",
    value: "+216 XX XXX XXX",
    description: "24/7 Customer Service",
  },
  {
    icon: Mail,
    title: "Email Us",
    value: "support@vorex.com",
    description: "Always here to help",
  },
  {
    icon: Building,
    title: "Visit Us",
    value: "Tunis, Tunisia",
    description: "Main Headquarters",
  },
];

export function MainContact() {
  return (
    <div className="relative min-h-screen">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/50" />

      <div className="relative">
        <div className="container py-24">
          {/* Header */}
          <div className="mx-auto max-w-4xl text-center pb-8 border-b">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Get in Touch
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Have questions about our services? We're here to help.
            </p>
          </div>

          <div className="mt-16 grid lg:grid-cols-2 gap-16 items-start max-w-6xl mx-auto">
            {/* Contact Form */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <form className="space-y-6">
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Input
                          placeholder="First Name"
                          className="h-12 bg-muted/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Input
                          placeholder="Last Name"
                          className="h-12 bg-muted/50"
                        />
                      </div>
                    </div>

                    <Input
                      type="email"
                      placeholder="Email Address"
                      className="h-12 bg-muted/50"
                    />

                    <Input
                      type="tel"
                      placeholder="Phone Number"
                      className="h-12 bg-muted/50"
                    />

                    <select className="w-full h-12 rounded-md border bg-muted/50 px-3 text-base">
                      <option value="">Select Inquiry Type</option>
                      <option value="support">Customer Support</option>
                      <option value="sales">Business Inquiry</option>
                      <option value="technical">Technical Support</option>
                      <option value="other">Other</option>
                    </select>

                    <Textarea
                      placeholder="How can we help you?"
                      className="min-h-[120px] bg-muted/50 resize-none"
                    />
                  </div>

                  <Button className="w-full h-12 text-base bg-primary hover:bg-primary/90">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-8">
              {contactMethods.map((method) => (
                <div
                  key={method.title}
                  className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="rounded-full bg-primary/10 p-3">
                    <method.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{method.title}</h3>
                    <p className="text-lg font-medium mt-1">{method.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {method.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
