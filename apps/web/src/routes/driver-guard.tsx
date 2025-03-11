import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";

interface DriverGuardProps {
  children: React.ReactNode;
}

export function DriverGuard({ children }: DriverGuardProps) {
  const navigate = useNavigate();
  const { isAuthenticated, user, isVerifiedDriver } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth/sign-in");
    } 
    else if (!isVerifiedDriver) {
      navigate("/driver/application");
    }
  }, [isAuthenticated, isVerifiedDriver, user, navigate]);

  return <>{children}</>;
} 