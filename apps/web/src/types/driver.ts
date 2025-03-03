import van from '@/assets/vehicles/van.png'
export type LicenseType = 'A' | 'B' | 'C' | 'D' | 'E'

export type VehicleType = 'MOTORCYCLE' | 'CAR' | 'VAN' | 'SMALL_TRUCK' | 'LARGE_TRUCK'

export type VehicleStatus = 'ACTIVE' | 'MAINTENANCE' | 'REPAIR' | 'OUT_OF_SERVICE'

export interface DriverFormData {
  // Personal Information
  fullName: string;
  email: string;
  phone: string;
  emergencyContact: string;

  // Address Information
  address: string;
  city: string;
  governorate: string;
  postalCode: string;

  // License Information
  licenseNumber: string;
  licenseType: LicenseType;
  licenseExpiry: string;

  // Vehicle Information
  vehicleType: VehicleType;
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  capacity: number;
  maxWeight: number;
  currentStatus: VehicleStatus;
  lastMaintenance: Date;
  nextMaintenance: Date;
}

export const VEHICLE_TYPE_DETAILS = {
  MOTORCYCLE: {
    icon: van,
    label: 'Motorcycle',
    description: 'Perfect for quick local deliveries',
    maxWeight: 100,
    capacity: 0.5
  },
  CAR: {
    icon: van,
    label: 'Car',
    description: 'Ideal for small to medium packages',
    maxWeight: 300,
    capacity: 2
  },
  VAN: {
    icon: van,
    label: 'Van',
    description: 'Great for multiple packages and furniture',
    maxWeight: 1000,
    capacity: 8
  },
  SMALL_TRUCK: {
    icon: van,
    label: 'Small Truck',
    description: 'For heavy duty deliveries',
    maxWeight: 3500,
    capacity: 15
  },
  LARGE_TRUCK: {
    icon: van,
    label: 'Large Truck',
    description: 'Maximum capacity for bulk deliveries',
    maxWeight: 7500,
    capacity: 30
  }
} as const

export const LICENSE_TYPE_DETAILS = {
  A: {
    icon: '🏍️',
    label: 'Type A - Motorcycle',
    vehicles: ['MOTORCYCLE'] as VehicleType[]
  },
  B: {
    icon: '🚗',
    label: 'Type B - Car',
    vehicles: ['CAR'] as VehicleType[]
  },
  C: {
    icon: '🚐',
    label: 'Type C - Light Commercial',
    vehicles: ['VAN', 'SMALL_TRUCK'] as VehicleType[]
  },
  D: {
    icon: '🚛',
    label: 'Type D - Heavy Commercial',
    vehicles: ['LARGE_TRUCK'] as VehicleType[]
  },
  E: {
    icon: '🚚',
    label: 'Type E - Special Vehicles',
    vehicles: ['SMALL_TRUCK', 'LARGE_TRUCK'] as VehicleType[]
  }
} as const

export const DRIVER_ONBOARDING_STEPS = [
  {
    title: "Personal Information",
    description: "Tell us about yourself",
    fields: ["fullName", "email", "phone", "emergencyContact"],
  },
  {
    title: "Address Details",
    description: "Where are you located?",
    fields: ["address", "city", "governorate", "postalCode"],
  },
  {
    title: "License Information",
    description: "Your driving credentials",
    fields: ["licenseNumber", "licenseType", "licenseExpiry"],
  },
  {
    title: "Vehicle Details",
    description: "Information about your vehicle",
    fields: ["vehicleType", "make", "model", "year", "plateNumber"],
  },
  {
    title: "Vehicle Specifications",
    description: "Technical details of your vehicle",
    fields: ["capacity", "maxWeight", "currentStatus", "lastMaintenance", "nextMaintenance"],
  },
] as const;

export type StepId = typeof DRIVER_ONBOARDING_STEPS[number]['title'];