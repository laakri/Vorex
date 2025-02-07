import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";

interface SellerGuardProps {
  children: React.ReactNode;
}

export function SellerGuard({ children }: SellerGuardProps) {
  const navigate = useNavigate();
  const { isAuthenticated, user, isVerifiedSeller } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth/sign-in");
    } else if (user?.role !== "SELLER") {
      navigate("/unauthorized");
    } else if (!isVerifiedSeller) {
      navigate("/seller/onboarding");
    }
  }, [isAuthenticated, isVerifiedSeller, user, navigate]);

  return <>{children}</>;
}
