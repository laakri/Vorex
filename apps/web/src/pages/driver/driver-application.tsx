import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Logo } from "@/components/logo"
import { useToast } from "@/hooks/use-toast"
import { DRIVER_ONBOARDING_STEPS, VEHICLE_TYPE_DETAILS, type DriverFormData, LICENSE_TYPE_DETAILS } from "@/types/driver"

const formSchema = z.object({
  fullName: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^[0-9]{8}$/, "Phone number must be 8 digits"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  governorate: z.string().min(2, "Governorate is required"),
  postalCode: z.string().regex(/^[0-9]{4}$/, "Postal code must be 4 digits"),
  emergencyContact: z.string().regex(/^[0-9]{8}$/, "Emergency contact must be 8 digits"),
  licenseNumber: z.string().min(5, "License number is required"),
  licenseType: z.enum(["A", "B", "C", "D", "E"]),
  licenseExpiry: z.date().optional(),
  deliveryZones: z.array(z.string()).min(1, "At least one delivery zone is required"),
  vehicleType: z.enum(["MOTORCYCLE", "CAR", "VAN", "SMALL_TRUCK", "LARGE_TRUCK"]),
  make: z.string().min(2, "Vehicle make is required"),
  model: z.string().min(2, "Vehicle model is required"),
  year: z.number().min(2015, "Vehicle must be 2015 or newer"),
  plateNumber: z.string().regex(/^[0-9]{1,3}TUN[0-9]{1,4}$/, "Invalid plate number format"),
  capacity: z.number().min(0, "Capacity must be 0 or more"),
  maxWeight: z.number().min(0, "Max weight must be 0 or more"),
  currentStatus: z.enum(["ACTIVE", "MAINTENANCE", "REPAIR", "OUT_OF_SERVICE"]),
})

export function DriverApplication() {
  const [currentStep, setCurrentStep] = useState(0)
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<DriverFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      governorate: "",
      postalCode: "",
      emergencyContact: "",
      licenseNumber: "",
      licenseType: undefined,
      licenseExpiry: undefined,
      deliveryZones: [],
      vehicleType: undefined,
      make: "",
      model: "",
      year: new Date().getFullYear(),
      plateNumber: "",
      capacity: 0,
      maxWeight: 0,
      currentStatus: "ACTIVE",
    }
  })

  const onSubmit = async (data: DriverFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/drivers/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to submit application');
      }

      toast({
        title: "Application submitted",
        description: "We'll review your application and get back to you soon."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderFormStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Basic Information</h2>
            <FormField
              control={form.control}
              name="fullName"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your email" {...field} />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your phone number" {...field} />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />
          </div>
        )
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Contact Information</h2>
            <FormField
              control={form.control}
              name="address"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your address" {...field} />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="city"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your city" {...field} />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="governorate"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Governorate</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your governorate" {...field} />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="postalCode"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Postal Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your postal code" {...field} />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">License Information</h2>
            <FormField
              control={form.control}
              name="licenseNumber"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>License Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your license number" {...field} />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="licenseType"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>License Type</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select license type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LICENSE_TYPE_DETAILS).map(([key, { label }]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="licenseExpiry"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>License Expiry</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field}
                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                    />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />
          </div>
        )
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Vehicle Information</h2>
            <FormField
              control={form.control}
              name="vehicleType"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Vehicle Type</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(VEHICLE_TYPE_DETAILS).map(([key, { label }]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="make"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Make</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter vehicle make" {...field} />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="model"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter vehicle model" {...field} />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="year"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter vehicle year" {...field} />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="plateNumber"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Plate Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter plate number" {...field} />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />
          </div>
        )
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Confirmation</h2>
            <p>Please review your information before submitting:</p>
            <ul className="list-disc pl-5">
              <li><strong>Full Name:</strong> {form.getValues("fullName")}</li>
              <li><strong>Email:</strong> {form.getValues("email")}</li>
              <li><strong>Phone:</strong> {form.getValues("phone")}</li>
              <li><strong>Address:</strong> {form.getValues("address")}</li>
              <li><strong>City:</strong> {form.getValues("city")}</li>
              <li><strong>Governorate:</strong> {form.getValues("governorate")}</li>
              <li><strong>Postal Code:</strong> {form.getValues("postalCode")}</li>
              <li><strong>License Number:</strong> {form.getValues("licenseNumber")}</li>
              <li><strong>License Type:</strong> {form.getValues("licenseType")}</li>
              <li><strong>License Expiry:</strong> {form.getValues("licenseExpiry")?.toLocaleDateString()}</li>
              <li><strong>Vehicle Type:</strong> {form.getValues("vehicleType")}</li>
              <li><strong>Make:</strong> {form.getValues("make")}</li>
              <li><strong>Model:</strong> {form.getValues("model")}</li>
              <li><strong>Year:</strong> {form.getValues("year")}</li>
              <li><strong>Plate Number:</strong> {form.getValues("plateNumber")}</li>
            </ul>
          </div>
        )
      default:
        return null
    }
  }

  const handleNextStep = async () => {
    const isValid = await form.trigger()
    console.log("Validation result:", isValid)
    if (!isValid) {
      console.log("Errors:", form.formState.errors)
    }
    if (isValid) {
      setCurrentStep(prev => prev + 1)
    } else {
      console.log("Validation failed for step:", currentStep)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <Logo className="absolute top-4 left-4" size="lg" />
      <div className="w-full max-w-2xl p-4">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative"
          >
            <div className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {renderFormStep()}
                </form>
              </Form>

              <div className="flex justify-between mt-8 pt-6">
                {currentStep > 0 && (
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                )}
                <Button
                  onClick={() => {
                    if (currentStep < DRIVER_ONBOARDING_STEPS.length - 1) {
                      handleNextStep()
                    } else {
                      form.handleSubmit(onSubmit)()
                    }
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Processing..."
                    : currentStep === DRIVER_ONBOARDING_STEPS.length - 1
                    ? "Submit Application"
                    : "Continue"}
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

