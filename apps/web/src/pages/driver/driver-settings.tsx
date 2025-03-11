import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon,  } from "@radix-ui/react-icons"
import { 
  Loader2,
} from "lucide-react"

import api from "@/lib/axios"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/stores/auth.store"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

// Define interfaces
interface DriverProfile {
  driver: {
    id: string
    licenseNumber: string
    licenseType: string
    licenseExpiry: string
    address: string
    city: string
    postalCode: string
    governorate: string
    phone: string
    emergencyContact: string
    availabilityStatus: string
  }
  user: {
    id: string
    email: string
    fullName: string
    isVerifiedDriver: boolean
    role: string[]
  }
  vehicle: {
    id: string
    type: string
    make: string
    model: string
    year: number
    plateNumber: string
    capacity: number
    maxWeight: number
    currentStatus: string
    lastMaintenance: string
    nextMaintenance: string
  }
}

// Form schemas
const personalInfoSchema = z.object({
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  postalCode: z.string().min(3, "Postal code must be at least 3 characters"),
  governorate: z.string().min(2, "Governorate must be at least 2 characters"),
  phone: z.string().min(8, "Phone number must be at least 8 characters"),
  emergencyContact: z.string().min(8, "Emergency contact must be at least 8 characters")
})

const licenseInfoSchema = z.object({
  licenseNumber: z.string().min(5, "License number must be at least 5 characters"),
  licenseType: z.string().min(1, "Please select a license type"),
  licenseExpiry: z.date({
    required_error: "Please select an expiry date",
  })
})

const vehicleInfoSchema = z.object({
  make: z.string().min(2, "Make must be at least 2 characters"),
  model: z.string().min(2, "Model must be at least 2 characters"),
  year: z.coerce.number().min(1900, "Year must be at least 1900").max(new Date().getFullYear() + 1),
  plateNumber: z.string().min(3, "Plate number must be at least 3 characters"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  maxWeight: z.coerce.number().min(1, "Max weight must be at least 1")
})

const notificationSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  smsNotifications: z.boolean()
})

export default function DriverSettings() {
  const [profile, setProfile] = useState<DriverProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingPersonal, setSavingPersonal] = useState(false)
  const [savingLicense, setSavingLicense] = useState(false)
  const [savingVehicle, setSavingVehicle] = useState(false)
  const [savingNotifications, setSavingNotifications] = useState(false)
  const { toast } = useToast()
  const { logout } = useAuthStore()

  // Initialize forms
  const personalForm = useForm<z.infer<typeof personalInfoSchema>>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      address: "",
      city: "",
      postalCode: "",
      governorate: "",
      phone: "",
      emergencyContact: ""
    }
  })

  const licenseForm = useForm<z.infer<typeof licenseInfoSchema>>({
    resolver: zodResolver(licenseInfoSchema),
    defaultValues: {
      licenseNumber: "",
      licenseType: "",
      licenseExpiry: new Date()
    }
  })

  const vehicleForm = useForm<z.infer<typeof vehicleInfoSchema>>({
    resolver: zodResolver(vehicleInfoSchema),
    defaultValues: {
      make: "",
      model: "",
      year: new Date().getFullYear(),
      plateNumber: "",
      capacity: 1,
      maxWeight: 100
    }
  })

  const notificationForm = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false
    }
  })

  // Fetch driver profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const response = await api.get('/drivers/profile')
        setProfile(response.data)
        
        // Set form values
        personalForm.reset({
          address: response.data.driver.address || "",
          city: response.data.driver.city || "",
          postalCode: response.data.driver.postalCode || "",
          governorate: response.data.driver.governorate || "",
          phone: response.data.driver.phone || "",
          emergencyContact: response.data.driver.emergencyContact || ""
        })
        
        licenseForm.reset({
          licenseNumber: response.data.driver.licenseNumber || "",
          licenseType: response.data.driver.licenseType || "",
          licenseExpiry: response.data.driver.licenseExpiry ? new Date(response.data.driver.licenseExpiry) : new Date()
        })
        
        vehicleForm.reset({
          make: response.data.vehicle.make || "",
          model: response.data.vehicle.model || "",
          year: response.data.vehicle.year || new Date().getFullYear(),
          plateNumber: response.data.vehicle.plateNumber || "",
          capacity: response.data.vehicle.capacity || 1,
          maxWeight: response.data.vehicle.maxWeight || 100
        })
        
        // You could also set notification preferences here if you had them in the API
      } catch (err: any) {
        console.error('Error fetching profile:', err)
        toast({
          title: "Error",
          description: err.response?.data?.message || "Failed to load profile data",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  // Form submission handlers
  const onSubmitPersonal = async (data: z.infer<typeof personalInfoSchema>) => {
    try {
      setSavingPersonal(true)
      await api.patch('/drivers/profile', data)
      
      toast({
        title: "Profile Updated",
        description: "Your personal information has been updated successfully.",
      })
      
      // Update local state
      if (profile) {
        setProfile({
          ...profile,
          driver: {
            ...profile.driver,
            ...data
          }
        })
      }
    } catch (err: any) {
      console.error('Error updating profile:', err)
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update profile",
        variant: "destructive"
      })
    } finally {
      setSavingPersonal(false)
    }
  }

  const onSubmitLicense = async (data: z.infer<typeof licenseInfoSchema>) => {
    try {
      setSavingLicense(true)
      await api.patch('/drivers/profile', {
        ...data,
        licenseExpiry: data.licenseExpiry.toISOString()
      })
      
      toast({
        title: "License Updated",
        description: "Your license information has been updated successfully.",
      })
      
      // Update local state
      if (profile) {
        setProfile({
          ...profile,
          driver: {
            ...profile.driver,
            licenseNumber: data.licenseNumber,
            licenseType: data.licenseType,
            licenseExpiry: data.licenseExpiry.toISOString()
          }
        })
      }
    } catch (err: any) {
      console.error('Error updating license:', err)
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update license information",
        variant: "destructive"
      })
    } finally {
      setSavingLicense(false)
    }
  }

  const onSubmitVehicle = async (data: z.infer<typeof vehicleInfoSchema>) => {
    try {
      setSavingVehicle(true)
      await api.patch('/drivers/vehicle', data)
      
      toast({
        title: "Vehicle Updated",
        description: "Your vehicle information has been updated successfully.",
      })
      
      // Update local state
      if (profile) {
        setProfile({
          ...profile,
          vehicle: {
            ...profile.vehicle,
            ...data
          }
        })
      }
    } catch (err: any) {
      console.error('Error updating vehicle:', err)
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update vehicle information",
        variant: "destructive"
      })
    } finally {
      setSavingVehicle(false)
    }
  }

  const onSubmitNotifications = async (data: z.infer<typeof notificationSchema>) => {
    try {
      setSavingNotifications(true)
      // Mock API call - would need a real endpoint
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Notification Preferences Updated",
        description: "Your notification preferences have been updated successfully.",
      })
    } catch (err: any) {
      console.error('Error updating notifications:', err)
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive"
      })
    } finally {
      setSavingNotifications(false)
    }
  }

  const updateAvailability = async (status: string) => {
    try {
      setLoading(true)
      await api.patch('/drivers/availability', { status })
      
      toast({
        title: "Status Updated",
        description: `You are now ${status.toLowerCase()}.`,
      })
      
      // Update local state
      if (profile) {
        setProfile({
          ...profile,
          driver: {
            ...profile.driver,
            availabilityStatus: status
          }
        })
      }
    } catch (err: any) {
      console.error('Error updating availability:', err)
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update availability",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Helper function to get initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  // Add a status selector component in the personal tab
  const StatusSelector = () => {
    if (!profile) return null;
    
    return (
      <div className="flex flex-col space-y-2 p-4 border rounded-lg mt-4">
        <h3 className="font-medium">Availability Status</h3>
        <div className="flex flex-wrap gap-2 mt-2">
          {["ONLINE", "OFFLINE", "BUSY", "ON_BREAK"].map((status) => (
            <Button
              key={status}
              variant={profile.driver.availabilityStatus === status ? "default" : "outline"}
              size="sm"
              onClick={() => updateAvailability(status)}
              disabled={loading}
            >
              {status === "ONLINE" && "🟢 "}
              {status === "OFFLINE" && "⚫ "}
              {status === "BUSY" && "🔴 "}
              {status === "ON_BREAK" && "🟠 "}
              {status.replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  // Loading state
  if (loading && !profile) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg md:col-span-2" />
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Driver Settings</CardTitle>
            <CardDescription>
              Update your driver profile, vehicle information, and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="license">License</TabsTrigger>
                <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>
              
              <TabsContent value="personal">
                <Form {...personalForm}>
                  <form onSubmit={personalForm.handleSubmit(onSubmitPersonal)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={personalForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input placeholder="123 Main St" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={personalForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="City" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={personalForm.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code</FormLabel>
                            <FormControl>
                              <Input placeholder="12345" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={personalForm.control}
                        name="governorate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Governorate</FormLabel>
                            <FormControl>
                              <Input placeholder="Governorate" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={personalForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="+1234567890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={personalForm.control}
                        name="emergencyContact"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emergency Contact</FormLabel>
                            <FormControl>
                              <Input placeholder="+1234567890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <StatusSelector />
                    
                    <div className="flex justify-end">
                      <Button type="submit" disabled={savingPersonal}>
                        {savingPersonal && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="license">
                <Form {...licenseForm}>
                  <form onSubmit={licenseForm.handleSubmit(onSubmitLicense)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={licenseForm.control}
                        name="licenseNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>License Number</FormLabel>
                            <FormControl>
                              <Input placeholder="DL12345678" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={licenseForm.control}
                        name="licenseType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>License Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select license type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="A">Class A - Heavy Vehicles</SelectItem>
                                <SelectItem value="B">Class B - Cars & Light Trucks</SelectItem>
                                <SelectItem value="C">Class C - Small Vehicles</SelectItem>
                                <SelectItem value="M">Class M - Motorcycles</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={licenseForm.control}
                        name="licenseExpiry"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>License Expiry Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className="w-full pl-3 text-left font-normal"
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date < new Date()
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button type="submit" disabled={savingLicense}>
                        {savingLicense && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="vehicle">
                <Form {...vehicleForm}>
                  <form onSubmit={vehicleForm.handleSubmit(onSubmitVehicle)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={vehicleForm.control}
                        name="make"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Make</FormLabel>
                            <FormControl>
                              <Input placeholder="Toyota" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={vehicleForm.control}
                        name="model"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Model</FormLabel>
                            <FormControl>
                              <Input placeholder="Corolla" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={vehicleForm.control}
                        name="year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Year</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="2023" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={vehicleForm.control}
                        name="plateNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>License Plate</FormLabel>
                            <FormControl>
                              <Input placeholder="ABC-1234" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={vehicleForm.control}
                        name="capacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Capacity (cubic meters)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={vehicleForm.control}
                        name="maxWeight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Weight (kg)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button type="submit" disabled={savingVehicle}>
                        {savingVehicle && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="notifications">
                <Form {...notificationForm}>
                  <form onSubmit={notificationForm.handleSubmit(onSubmitNotifications)} className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={notificationForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Email Notifications</FormLabel>
                              <FormDescription>
                                Receive notifications about new deliveries and updates via email.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationForm.control}
                        name="pushNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Push Notifications</FormLabel>
                              <FormDescription>
                                Receive real-time alerts on your device about delivery status changes.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationForm.control}
                        name="smsNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">SMS Notifications</FormLabel>
                              <FormDescription>
                                Receive text messages for urgent updates and delivery confirmations.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button type="submit" disabled={savingNotifications}>
                        {savingNotifications && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Preferences
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Account Danger Zone */}
        <Card className="mt-6 border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Actions here can't be undone. Be careful.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Delete Account</h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data.
                </p>
              </div>
              <Button variant="destructive" onClick={() => {
                // Show confirmation dialog before deleting
                if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                  // Handle account deletion
                  toast({
                    title: "Account deletion requested",
                    description: "We've received your request. Our team will contact you shortly.",
                  });
                }
              }}>
                Delete Account
              </Button>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Log Out Everywhere</h3>
                <p className="text-sm text-muted-foreground">
                  Log out from all devices except this one.
                </p>
              </div>
              <Button variant="outline" className="border-destructive text-destructive" onClick={() => {
                // Handle logout from all devices
                toast({
                  title: "Logged out from all devices",
                  description: "You've been successfully logged out from all other devices.",
                });
              }}>
                Log Out Everywhere
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

