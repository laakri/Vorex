import { ReactNode } from "react";
import { 
  PackageIcon, 
  ChartBarIcon, 
  ShoppingCartIcon,
  AlertCircleIcon
} from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  className?: string;
  children?: ReactNode;
}

const iconMap = {
  orders: ShoppingCartIcon,
  products: PackageIcon,
  charts: ChartBarIcon,
  default: AlertCircleIcon,
};

export function EmptyState({ 
  icon, 
  title, 
  description, 
  className = "",
  children
}: EmptyStateProps) {
  const IconComponent = icon || iconMap.default;

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      {typeof IconComponent === "function" ? (
        <IconComponent className="h-12 w-12 text-muted-foreground/50" />
      ) : (
        IconComponent
      )}
      <h3 className="mt-4 text-lg font-semibold text-muted-foreground">
        {title}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground/70">
        {description}
      </p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
} 