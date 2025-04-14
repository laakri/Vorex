import { Box, PackageSearch } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, size = "md" }: LogoProps) {
  const sizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        {/* Background shape */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg " />
        <div className="relative bg-background rounded-lg p-1.5 bg-orange-600">
          <div className="relative">
            {/* Base box */}
            <Box className="h-4 w-4 text-white" strokeWidth={5.5} />
            {/* Overlay search icon */}
            <PackageSearch
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-primary"
              strokeWidth={2.5}
            />
          </div>
        </div>
      </div>
      <span className={cn("font-bold tracking-tight", sizes[size])}>
        Vorex<span className="text-primary">.</span>
      </span>
    </div>
  );
}
