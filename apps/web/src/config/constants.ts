// Governorates
export const TUNISIA_GOVERNORATES = [
  "Tunis", "Ariana", "Ben Arous", "Manouba", "Nabeul",
  "Zaghouan", "Bizerte", "Béja", "Jendouba", "Kef",
  "Siliana", "Sousse", "Monastir", "Mahdia", "Sfax",
  "Kairouan", "Kasserine", "Sidi Bouzid", "Gabes",
  "Medenine", "Tataouine", "Gafsa", "Tozeur", "Kebili",
] as const;

export type Governorate = typeof TUNISIA_GOVERNORATES[number];

// Business Types
export const BUSINESS_TYPES = [
  "RETAIL", "WHOLESALE", "RESTAURANT", "GROCERY", "ELECTRONICS",
  "FASHION", "BEAUTY", "HEALTH", "HOME_GOODS", "SPORTS",
  "BOOKS", "TOYS", "AUTOMOTIVE", "JEWELRY", "OTHER"
] as const;

export type BusinessType = typeof BUSINESS_TYPES[number];

// Warehouse Types
export interface WarehouseCoverage {
  name: string;
  covers: Governorate[];
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

// Business Type Labels
export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  RETAIL: "Retail Store",
  WHOLESALE: "Wholesale Business",
  RESTAURANT: "Restaurant/Food Service",
  GROCERY: "Grocery Store",
  ELECTRONICS: "Electronics Store",
  FASHION: "Fashion & Apparel",
  BEAUTY: "Beauty & Cosmetics",
  HEALTH: "Health & Wellness",
  HOME_GOODS: "Home Goods",
  SPORTS: "Sports & Recreation",
  BOOKS: "Books & Stationery",
  TOYS: "Toys & Games",
  AUTOMOTIVE: "Automotive",
  JEWELRY: "Jewelry",
  OTHER: "Other Business"
};

// Helper Functions
export function isLocalDelivery(
  sellerGovernorate: Governorate, 
  buyerGovernorate: Governorate
): boolean {
  const sellerWarehouse = Object.values(WAREHOUSE_COVERAGE).find(warehouse => 
    warehouse.covers.includes(sellerGovernorate)
  );

  const buyerWarehouse = Object.values(WAREHOUSE_COVERAGE).find(warehouse => 
    warehouse.covers.includes(buyerGovernorate)
  );

  return sellerWarehouse === buyerWarehouse;
}

export function getWarehouseForGovernorate(governorate: Governorate): WarehouseRegion | null {
  const warehouse = Object.entries(WAREHOUSE_COVERAGE).find(([_, value]) => 
    value.covers.includes(governorate)
  );
  
  return warehouse ? warehouse[0] as WarehouseRegion : null;
}