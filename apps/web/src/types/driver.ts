import van from '@/assets/vehicles/van.png'
export type LicenseType = 'A' | 'B' | 'C' | 'D' | 'E'

export type VehicleType = 'MOTORCYCLE' | 'CAR' | 'VAN' | 'SMALL_TRUCK' | 'LARGE_TRUCK'

export type VehicleStatus = 'ACTIVE' | 'MAINTENANCE' | 'REPAIR' | 'OUT_OF_SERVICE'

export interface DriverFormData {
  // Personal Info
  fullName: string
  phone: string
  address: string
  city: string
  governorate: string
  postalCode: string
  emergencyContact: string
  email: string

  // License Info
  licenseNumber: string
  licenseType: LicenseType
  licenseExpiry: Date | undefined
  deliveryZones: string[]
  
  // Vehicle Info
  vehicleType: VehicleType
  make: string
  model: string
  year: number
  plateNumber: string
  capacity: number
  maxWeight: number
  currentStatus: VehicleStatus
  lastMaintenance?: Date
  nextMaintenance?: Date
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
    id: 1,
    title: "Basic Information",
    description: "Let's start with your personal details"
  },
  {
    id: 2,
    title: "Contact Information",
    description: "How can we reach you?"
  },
  {
    id: 3,
    title: "Identity Verification",
    description: "Upload your ID documents"
  },
  {
    id: 4,
    title: "Driver's License",
    description: "Your driving credentials"
  },
  {
    id: 5,
    title: "Vehicle Information",
    description: "Tell us about your vehicle"
  },
  {
    id: 6,
    title: "Vehicle Documentation",
    description: "Upload vehicle papers"
  },
  {
    id: 7,
    title: "Delivery Preferences",
    description: "Choose your delivery zones"
  },
  {
    id: 8,
    title: "Background Check",
    description: "Security verification"
  },
  {
    id: 9,
    title: "Final Review",
    description: "Review your application"
  }
] as const

export type StepId = typeof DRIVER_ONBOARDING_STEPS[number]['id'] 