import { Link, Outlet } from "react-router-dom";
import { Logo } from "@/components/logo";
import authBg from "@/assets/auth-bg.jpg";

export function AuthLayout() {
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2 overflow-hidden">
      {/* Left: Auth Form */}
      <div className="relative flex flex-col">
        <div className="absolute top-8 left-8 z-20">
          <Link to="/">
            <Logo />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-8 py-16">
          <div className="w-full max-w-[400px]">
            <Outlet />
          </div>
        </div>
      </div>

      {/* Right: Image/Info */}
      <div className="hidden md:block relative">
        <div className="absolute inset-0">
          <img
            src={authBg}
            alt="Authentication"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/50 to-background/30" />
        </div>
        <div className="relative h-full flex items-center justify-center px-8">
          <div className="max-w-lg text-white text-center">
            <h1 className="text-3xl font-bold mb-4">
              Join Tunisia's Leading Delivery Network
            </h1>
            <p className="text-white/80">
              Connect with customers, optimize deliveries, and grow your
              business with our integrated logistics platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
