import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";

interface WarehouseGuardProps {
  children: React.ReactNode;
}

export function WarehouseGuard({ children }: WarehouseGuardProps) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth/sign-in");
    } else if (!user?.role.includes("WAREHOUSE_MANAGER")) {
      navigate("/unauthorized");
    } 
  }, [isAuthenticated,  user, navigate]);

  return <>{children}</>;
}
