// Governorates
export const TUNISIA_GOVERNORATES = [
  "Tunis", "Ariana", "Ben Arous", "Manouba", "Nabeul",
  "Zaghouan", "Bizerte", "Béja", "Jendouba", "Kef",
  "Siliana", "Sousse", "Monastir", "Mahdia", "Sfax",
  "Kairouan", "Kasserine", "Sidi Bouzid", "Gabes",
  "Medenine", "Tataouine", "Gafsa", "Tozeur", "Kebili",
] as const;

// Export the type
export type Governorate = (typeof TUNISIA_GOVERNORATES)[number];

// Warehouse Types
export interface WarehouseCoverage {
  name: string;
  covers: string[]; // Changed from Governorate[] to string[]
}

export type WarehouseRegion = "TUNIS" | "SOUSSE" | "SFAX";

export const WAREHOUSE_COVERAGE: Record<WarehouseRegion, WarehouseCoverage> = {
  TUNIS: {
    name: "Tunis Warehouse",
    covers: ["Tunis", "Ariana", "Manouba", "Ben Arous"]
  },
  SOUSSE: {
    name: "Sousse Warehouse",
    covers: ["Sousse", "Monastir", "Mahdia", "Kairouan"]
  },
  SFAX: {
    name: "Sfax Warehouse",
    covers: ["Sfax", "Gabes", "Gafsa", "Sidi Bouzid"]
  }
};

// Helper function to get warehouse for a governorate
export function getWarehouseForGovernorate(governorate: string): WarehouseRegion | null {
  const warehouse = Object.entries(WAREHOUSE_COVERAGE).find(([_, value]) => 
    value.covers.includes(governorate)
  );
  
  return warehouse ? warehouse[0] as WarehouseRegion : null;
} 