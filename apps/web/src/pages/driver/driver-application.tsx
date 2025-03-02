import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { useNavigate } from "react-router-dom"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TUNISIA_GOVERNORATES } from "@/config/constants"
import api from "@/lib/axios"
import { LICENSE_TYPE_DETAILS, VEHICLE_TYPE_DETAILS } from "@/types/driver"
import ImageToText from '@/components/ImageToText'

interface DriverFormData {
  fullName: string;
  email: string;
  phone: string;
  emergencyContact: string;
  address: string;
  city: string;
  governorate: string;
  postalCode: string;
  licenseNumber: string;
  licenseType: string;
  licenseExpiry: string;
  vehicleType: "MOTORCYCLE" | "CAR" | "VAN" | "SMALL_TRUCK" | "LARGE_TRUCK";
  make: string;
  model: string;
  year: number; // Ensure this is a number
  plateNumber: string; // Ensure this is a string
  capacity: number; // Ensure this is a number
  maxWeight: number; // Ensure this is a number
  currentStatus: "ACTIVE" | "MAINTENANCE" | "REPAIR" | "OUT_OF_SERVICE";
  lastMaintenance: Date;
  nextMaintenance: Date;
}
const steps = [
  {
    title: "Personal Information",
    description: "Tell us about yourself",
    fields: ["fullName", "email", "phone", "emergencyContact"],
  },
  {
    title: "Address Details",
    description: "Where can we reach you?",
    fields: ["address", "city", "governorate", "postalCode"],
  },
  {
    title: "License Information",
    description: "Your driving credentials",
    fields: ["licenseNumber", "licenseType", "licenseExpiry", "deliveryZones"],
  },
  {
    title: "Vehicle Information",
    description: "Tell us about your vehicle",
    fields: ["vehicleType", "make", "model", "year", "plateNumber"],
  },
  {
    title: "Vehicle Specifications",
    description: "Technical details of your vehicle",
    fields: ["capacity", "maxWeight", "currentStatus", "lastMaintenance", "nextMaintenance"],
  },
  {
    title: "Driver's License",
    description: "Upload your driver's license",
    fields: ["licenseImage"],
  }
] as const

export function DriverApplication() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<DriverFormData>({
    fullName: "",
    email: "",
    phone: "",
    emergencyContact: "",
    address: "",
    city: "",
    governorate: "",
    postalCode: "",
    licenseNumber: "",
    licenseType: "B",
    licenseExpiry: new Date().toISOString().split('T')[0],
    vehicleType: "CAR",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    plateNumber: "",
    capacity: 0,
    maxWeight: 0,
    currentStatus: "ACTIVE",
    lastMaintenance: new Date(),
    nextMaintenance: new Date(),
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const progress = ((currentStep + 1) / steps.length) * 100
  const navigate = useNavigate()
  const [extractedText, setExtractedText] = useState<string>("")
  const [isTextValid, setIsTextValid] = useState<boolean>(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Convert capacity and maxWeight to numbers if the field is one of them
    if (name === "capacity" || name === "maxWeight") {
      setFormData((prev) => ({
        ...prev,
        [name]: parseFloat(value), // Convert to number
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  }

  const handleSelectChange = (field: keyof DriverFormData) => (value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const validateStep = () => {
    const currentFields = steps[currentStep].fields;
    let isValid = true;
    let errorMessage = "";

    currentFields.forEach((field) => {
      switch (field) {
        case "plateNumber":
          if (typeof formData.plateNumber !== 'string' || formData.plateNumber.trim() === '') {
            errorMessage = "Plate number must be a non-empty string";
            isValid = false;
          }
          break;
        case "vehicleType":
          if (!["MOTORCYCLE", "CAR", "VAN", "SMALL_TRUCK", "LARGE_TRUCK"].includes(formData.vehicleType)) {
            errorMessage = "Vehicle type must be one of the following: MOTORCYCLE, CAR, VAN, SMALL_TRUCK, LARGE_TRUCK";
            isValid = false;
          }
          break;
        case "make":
          if (typeof formData.make !== 'string' || formData.make.trim() === "") {
            errorMessage = "Make must be a non-empty string";
            isValid = false;
          }
          break;
        case "model":
          if (typeof formData.model !== 'string' || formData.model.trim() === "") {
            errorMessage = "Model must be a non-empty string";
            isValid = false;
          }
          break;
        case "year":
          if (typeof formData.year !== 'number' || formData.year < 2015 || formData.year > new Date().getFullYear()) {
            errorMessage = "Year must be a number between 2015 and the current year";
            isValid = false;
          }
          break;
        case "capacity":
          if (typeof formData.capacity !== 'number' || formData.capacity <= 0) {
            errorMessage = "Capacity must be a positive number";
            isValid = false;
          }
          break;
        case "maxWeight":
          if (typeof formData.maxWeight !== 'number' || formData.maxWeight <= 0) {
            errorMessage = "Max weight must be a positive number";
            isValid = false;
          }
          break;
        case "currentStatus":
          if (!["ACTIVE", "MAINTENANCE", "REPAIR", "OUT_OF_SERVICE"].includes(formData.currentStatus)) {
            errorMessage = "Current status must be one of the following: ACTIVE, MAINTENANCE, REPAIR, OUT_OF_SERVICE";
            isValid = false;
          }
          break;
        case "lastMaintenance":
          if (!(formData.lastMaintenance instanceof Date) || isNaN(formData.lastMaintenance.getTime())) {
            errorMessage = "Last maintenance must be a valid date";
            isValid = false;
          }
          break;
        case "nextMaintenance":
          if (!(formData.nextMaintenance instanceof Date) || isNaN(formData.nextMaintenance.getTime())) {
            errorMessage = "Next maintenance must be a valid date";
            isValid = false;
          }
          break;
        default:
          break;
      }
    });

    if (!isValid) {
      setError(errorMessage);
    } else {
      setError("");
    }

    return isValid;
  };

  const handleComplete = async () => {
    if (!validateStep()) return;

    // Proceed with the API call if all validations pass
    setIsLoading(true);
    try {
      console.log(formData);
      await api.post("/drivers/register", formData);
      navigate("/auth/sign-in");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit application");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextExtracted = (text: string) => {
    setExtractedText(text)
    const isValid = validateLicenseText(text)
    setIsTextValid(isValid)
  }

  const validateLicenseText = (text: string): boolean => {
    const hasValidKeywords = text.includes("PERMIS DE CONDUIRE") || text.includes("REPUBLIQUE TUNISIENNE");
    const datePattern = /\b\d{2}-\d{2}-\d{4}\b/g;
    const dates = text.match(datePattern);
    const hasValidDates = Array.isArray(dates) && dates.length >= 2;

    return hasValidKeywords && hasValidDates !== undefined; 
  }

  const renderFormFields = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                name="fullName"
                placeholder="Enter your full name as it appears on your ID"
                className="h-12 bg-muted/50"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                This should match your official identification documents
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input
                name="email"
                type="email"
                placeholder="your.email@example.com"
                className="h-12 bg-muted/50"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                We'll use this email for all communications
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              <Input
                name="phone"
                placeholder="Enter your 8-digit phone number"
                className="h-12 bg-muted/50"
                value={formData.phone}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                Active phone number where we can reach you
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Emergency Contact</label>
              <Input
                name="emergencyContact"
                placeholder="Emergency contact phone number"
                className="h-12 bg-muted/50"
                value={formData.emergencyContact}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                Phone number of someone we can contact in case of emergency
              </p>
            </div>
          </div>
        )
     
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Street Address</label>
              <Input
                name="address"
                placeholder="Enter your complete street address"
                className="h-12 bg-muted/50"
                value={formData.address}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                Your current residential address
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">City</label>
              <Input
                name="city"
                placeholder="Enter your city name"
                className="h-12 bg-muted/50"
                value={formData.city}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Governorate</label>
              <Select
                value={formData.governorate}
                onValueChange={handleSelectChange("governorate")}
              >
                <SelectTrigger className="h-12 bg-muted/50">
                  <SelectValue placeholder="Select your governorate" />
                </SelectTrigger>
                <SelectContent>
                  {TUNISIA_GOVERNORATES.map((governorate) => (
                    <SelectItem key={governorate} value={governorate}>
                      {governorate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Postal Code</label>
              <Input
                name="postalCode"
                placeholder="Enter your 4-digit postal code"
                className="h-12 bg-muted/50"
                value={formData.postalCode}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                Standard 4-digit Tunisia postal code
              </p>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Driver's License Number</label>
              <Input
                name="licenseNumber"
                placeholder="Enter your driver's license number"
                className="h-12 bg-muted/50"
                value={formData.licenseNumber}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                The number on your valid driver's license
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">License Type</label>
              <Select
                value={formData.licenseType}
                onValueChange={handleSelectChange("licenseType")}
              >
                <SelectTrigger className="h-12 bg-muted/50">
                  <SelectValue placeholder="Select your license type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LICENSE_TYPE_DETAILS).map(([key, { label, icon }]) => (
                    <SelectItem key={key} value={key}>
                      {icon} {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose the type of license you currently hold
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">License Expiry Date</label>
              <Input
                name="licenseExpiry"
                type="date"
                className="h-12 bg-muted/50"
                value={formData.licenseExpiry}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                required
              />
              <p className="text-xs text-muted-foreground">
                Your license must be valid for at least 6 months
              </p>
            </div>

           
          </div>
        )
      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Vehicle Type</label>
              <Select
                value={formData.vehicleType}
                onValueChange={handleSelectChange("vehicleType")}
              >
                <SelectTrigger className="h-12 bg-muted/50">
                  <SelectValue placeholder="What type of vehicle do you have?" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(VEHICLE_TYPE_DETAILS).map(([key, { label, description }]) => (
                    <SelectItem key={key} value={key}>
                      <div>
                        <div>{label}</div>
                        <div className="text-xs text-muted-foreground">{description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose the type of vehicle you'll use for deliveries
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Vehicle Brand</label>
              <Input
                name="make"
                placeholder="Vehicle Manufacturer (e.g., Peugeot, Toyota)"
                className="h-12 bg-muted/50"
                value={formData.make}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter the manufacturer/brand of your vehicle
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Vehicle Model</label>
              <Input
                name="model"
                placeholder="Vehicle Model (e.g., 208, Hilux)"
                className="h-12 bg-muted/50"
                value={formData.model}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter the specific model of your vehicle
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Manufacturing Year</label>
              <Input
                name="year"
                type="number"
                min={2015}
                max={new Date().getFullYear()}
                placeholder="Enter vehicle manufacturing year"
                className="h-12 bg-muted/50"
                value={formData.year}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                Vehicle must be from 2015 or newer
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">License Plate Number</label>
              <Input
                name="plateNumber"
                placeholder="Format: 123TUN4567"
                className="h-12 bg-muted/50"
                value={formData.plateNumber}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter your vehicle's registration number
              </p>
            </div>
          </div>
        )
      case 4:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cargo Capacity</label>
              <Input
                name="capacity"
                type="number"
                min="0"
                step="0.1"
                placeholder="Enter cargo capacity in cubic meters (m³)"
                className="h-12 bg-muted/50"
                value={formData.capacity}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                The maximum volume your vehicle can carry in cubic meters (m³)
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Maximum Load Weight</label>
              <Input
                name="maxWeight"
                type="number"
                min="0"
                step="10"
                placeholder="Enter maximum weight capacity in kilograms (kg)"
                className="h-12 bg-muted/50"
                value={formData.maxWeight}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                The maximum weight your vehicle can safely carry in kilograms (kg)
              </p>
            </div>
          </div>
        )
        case 5:
          return (
            <div className="mt-4">
              
              <ImageToText onTextExtracted={handleTextExtracted} />

              
            </div>
          )
      default:
        return null
    }
  }

  return (
    <div className="  mt-10">
      <div className="container max-w-3xl py-16">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{steps[currentStep].title}</h1>
            <p className="text-muted-foreground">
              {steps[currentStep].description}
            </p>
          </div>

          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>

          <Card className="p-6">
            {renderFormFields()}
            {error && (
              <p className="mt-4 text-sm text-destructive text-center">
                {error}
              </p>
            )}
          </Card>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0 || isLoading}
            >
              Previous
            </Button>
            <Button
              onClick={() => {
                if (validateStep()) {
                  if (currentStep < steps.length - 1) {
                    setCurrentStep(currentStep + 1)
                  } else {
                    handleComplete()
                  }
                }
              }}
              disabled={isLoading}
            >
              {isLoading
                ? "Submitting..."
                : currentStep === steps.length - 1
                ? "Submit Application"
                : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

