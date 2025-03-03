import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      console.log("Not authenticated");
      navigate("/auth/sign-in");
    } else if (roles && !roles.some(role => user?.role.includes(role as any))) {
      navigate("/");
      console.log("Not authorized");
    }
  }, [isAuthenticated, navigate, roles, user]);

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
