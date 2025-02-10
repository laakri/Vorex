export const businessTypes = [
  "Retail",
  "Wholesale",
  "Manufacturing",
  "Electronics",
  "Fashion & Apparel",
  "Food & Beverage",
  "Health & Beauty",
  "Home & Garden",
  "Sports & Leisure",
  "Books & Media",
  "Automotive",
  "Art & Crafts",
  "Toys & Games",
  "Pet Supplies",
  "Office Supplies",
  "Other"
] as const;

export const TUNISIA_GOVERNORATES = [
  "Tunis",
  "Ariana",
  "Ben Arous",
  "Manouba",
  "Nabeul",
  "Zaghouan",
  "Bizerte",
  "Béja",
  "Jendouba",
  "Kef",
  "Siliana",
  "Sousse",
  "Monastir",
  "Mahdia",
  "Sfax",
  "Kairouan",
  "Kasserine",
  "Sidi Bouzid",
  "Gabès",
  "Medenine",
  "Tataouine",
  "Gafsa",
  "Tozeur",
  "Kebili"
] as const;

export type BusinessType = typeof businessTypes[number];
export type Governorate = typeof TUNISIA_GOVERNORATES[number]; 