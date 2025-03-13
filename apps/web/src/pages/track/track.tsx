import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Package, Search, Truck, ArrowRight } from "lucide-react";

export function TrackPage() {
  const [trackingId, setTrackingId] = useState("");
  const navigate = useNavigate();

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) {
      toast({
        title: "Tracking ID Required",
        description: "Please enter a valid tracking ID",
        variant: "destructive",
      });
      return;
    }
    navigate(`/track/${trackingId.trim()}`);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background to-background/90">
      {/* 3D-like mesh grid background */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_rgba(var(--primary-rgb),0.03)_1px,_transparent_1px)] bg-[length:24px_24px]"></div>

      {/* Abstract shapes */}
      <div className="absolute -left-64 -top-64 w-[40rem] h-[40rem] rounded-full bg-primary/5 blur-3xl"></div>
      <div className="absolute -right-64 top-1/3 w-[30rem] h-[30rem] rounded-full bg-blue-500/5 blur-3xl"></div>

      <div className="container relative z-10 mx-auto flex max-w-5xl flex-col items-center px-4 py-24">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
          <Package className="h-10 w-10 text-primary" />
        </div>

        <h1 className="mb-3 text-center text-4xl font-bold">Track Your Package</h1>
        <p className="mb-10 max-w-md text-center text-muted-foreground">
          Enter your tracking ID to get real-time updates on your package's location and delivery status.
        </p>

        <Card className="w-full max-w-xl bg-background/70 backdrop-blur-sm">
          <form onSubmit={handleTrack} className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Input
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder="Enter tracking number"
                  className="h-12 pl-10"
                />
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              </div>
              <Button type="submit" className="h-12 px-6">
                Track Package
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card>

        <div className="mt-20 grid gap-10 sm:grid-cols-2 md:grid-cols-3">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10">
              <Search className="h-8 w-8 text-purple-500" />
            </div>
            <h3 className="mb-2 font-semibold">Real-Time Tracking</h3>
            <p className="text-sm text-muted-foreground">
              Get accurate, up-to-the-minute information about your package location.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
              <Truck className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="mb-2 font-semibold">Delivery Estimates</h3>
            <p className="text-sm text-muted-foreground">
              Know exactly when your package will arrive with our precise delivery estimates.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <Package className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="mb-2 font-semibold">Complete History</h3>
            <p className="text-sm text-muted-foreground">
              View the full journey of your package from sender to delivery.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 