import { useState, useEffect } from "react"
import { format } from "date-fns"
import { 
  Car, 
  Gauge, 
  Calendar, 
  Wrench, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  Fuel, 
  Shield,
  Loader2
} from "lucide-react"
import api from "@/lib/axios"
import { useToast } from "@/hooks/use-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Skeleton } from "@/components/ui/skeleton"

// Define vehicle interface
interface MaintenanceRecord {
  id: string
  type: string
  date: string
  odometer: number
  description: string
  cost: number
  status: string
}

interface VehicleIssue {
  id: string
  title: string
  description: string
  reportedAt: string
  status: string
  priority: string
}

interface Insurance {
  provider: string
  policyNumber: string
  coverage: string
  startDate: string
  endDate: string
}

interface Vehicle {
  id: string
  type: string
  make: string
  model: string
  year: number
  licensePlate: string
  vin: string
  status: string
  fuelType: string
  fuelLevel: number
  odometer: number
  lastMaintenanceDate: string
  nextMaintenanceDate: string
  maintenanceRecords: MaintenanceRecord[]
  issues: VehicleIssue[]
  insurance: Insurance | null
}

// Form schema for reporting issues
const issueFormSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  priority: z.string({
    required_error: "Please select a priority level.",
  }),
})

export function Vehicle() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [isReportingIssue, setIsReportingIssue] = useState(false)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Initialize form
  const form = useForm<z.infer<typeof issueFormSchema>>({
    resolver: zodResolver(issueFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
    },
  })

  useEffect(() => {
    const fetchVehicleData = async () => {
      try {
        setLoading(true)
        const response = await api.get('/vehicles/driver')
        setVehicle(response.data)
        setError(null)
      } catch (err: any) {
        console.error('Error fetching vehicle data:', err)
        setError(err.response?.data?.message || 'Failed to load vehicle data')
        toast({
          title: "Error",
          description: err.response?.data?.message || "Failed to load vehicle data",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchVehicleData()
  }, [toast])

  const onSubmitIssue = async (data: z.infer<typeof issueFormSchema>) => {
    if (!vehicle) return
    
    try {
      setLoading(true)
      const response = await api.post('/vehicles/issues', data)
      
      // Update the vehicle state with the new issue
      setVehicle({
        ...vehicle,
        issues: [...vehicle.issues, response.data]
      })
      
      // Close the dialog and show success message
      setIsReportingIssue(false)
      form.reset()
      
      toast({
        title: "Issue Reported",
        description: "Your vehicle issue has been successfully reported.",
      })
    } catch (err: any) {
      console.error('Error reporting issue:', err)
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to report issue",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Helper function to get days until a date
  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Helper function to get status colors
  const getStatusColor = (status: string | undefined) => {
    switch (status?.toUpperCase()) {
      case 'VALID':
      case 'COMPLETED':
      case 'RESOLVED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'PENDING':
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EXPIRED':
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Helper function to get priority colors
  const getPriorityColor = (priority: string | undefined) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'LOW':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Helper function to get maintenance type icons
  const getMaintenanceTypeIcon = (type: string | undefined) => {
    switch (type?.toUpperCase()) {
      case 'OIL_CHANGE':
        return <Fuel className="h-5 w-5 text-primary" />
      case 'TIRE_ROTATION':
        return <Gauge className="h-5 w-5 text-primary" />
      case 'BRAKE_SERVICE':
        return <Wrench className="h-5 w-5 text-primary" />
      default:
        return <Wrench className="h-5 w-5 text-primary" />
    }
  }

  if (loading && !vehicle) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    )
  }

  if (error && !vehicle) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Vehicle Information Unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-4">{error}</p>
            <p className="text-red-700">
              Please contact your fleet manager to assign a vehicle to your account.
            </p>
            <Button 
              variant="outline" 
              className="mt-4 border-red-200 text-red-800 hover:bg-red-100"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!vehicle) return null

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Issue Reporting Dialog */}
      <Dialog open={isReportingIssue} onOpenChange={setIsReportingIssue}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Report Vehicle Issue</DialogTitle>
            <DialogDescription>
              Report any issues or problems with your vehicle that need attention.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitIssue)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief description of the issue" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detailed Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide details about when and how the issue occurred" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="LOW">Low - Not urgent</SelectItem>
                        <SelectItem value="MEDIUM">Medium - Needs attention soon</SelectItem>
                        <SelectItem value="HIGH">High - Urgent safety concern</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select HIGH only for issues that affect vehicle safety or operation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsReportingIssue(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Report
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vehicle Information</h1>
          <p className="text-muted-foreground">
            View and manage your assigned vehicle details
          </p>
        </div>
        <Button onClick={() => setIsReportingIssue(true)}>
          <AlertTriangle className="mr-2 h-4 w-4" />
          Report Issue
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Vehicle Overview Card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-background to-muted/30">
            <CardTitle className="text-lg">Vehicle Overview</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">{vehicle.make} {vehicle.model}</h3>
                <p className="text-sm text-muted-foreground">{vehicle.year} • {vehicle.type}</p>
              </div>
              <Badge className="ml-auto" variant={vehicle.status === "ACTIVE" ? "default" : "destructive"}>
                {vehicle.status}
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">License Plate:</span>
                <span className="font-medium">{vehicle.licensePlate}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">VIN:</span>
                <span className="font-mono text-xs">{vehicle.vin}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Odometer:</span>
                <span>{vehicle.odometer.toLocaleString()} km</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fuel Type:</span>
                <span>{vehicle.fuelType}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Fuel & Maintenance Card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-background to-muted/30">
            <CardTitle className="text-lg">Fuel & Maintenance</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Fuel className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Fuel Level</span>
                </div>
                <span className="text-sm font-medium">{vehicle.fuelLevel}%</span>
              </div>
              <Progress value={vehicle.fuelLevel} className="h-2" />
            </div>
            
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Maintenance Status</span>
              </div>
              
              <div className="bg-muted/30 rounded-md p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Service:</span>
                  <span>{format(new Date(vehicle.lastMaintenanceDate), "MMM d, yyyy")}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Next Service:</span>
                  <div className="flex items-center gap-1">
                    <span>{format(new Date(vehicle.nextMaintenanceDate), "MMM d, yyyy")}</span>
                    <Badge variant="outline" className={
                      getDaysUntil(vehicle.nextMaintenanceDate) < 7 
                        ? "bg-red-100 text-red-800 border-red-200" 
                        : getDaysUntil(vehicle.nextMaintenanceDate) < 30 
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : "bg-green-100 text-green-800 border-green-200"
                    }>
                      {getDaysUntil(vehicle.nextMaintenanceDate)} days
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Insurance Card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-background to-muted/30">
            <CardTitle className="text-lg">Insurance Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {vehicle.insurance ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{vehicle.insurance.provider}</h3>
                    <p className="text-xs text-muted-foreground">Policy #{vehicle.insurance.policyNumber}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Coverage:</span>
                  <span>{vehicle.insurance.coverage}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Valid From:</span>
                  <span>{format(new Date(vehicle.insurance.startDate), "MMM d, yyyy")}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Valid Until:</span>
                  <div className="flex items-center gap-1">
                    <span>{format(new Date(vehicle.insurance.endDate), "MMM d, yyyy")}</span>
                    <Badge variant="outline" className={
                      getDaysUntil(vehicle.insurance.endDate) < 30 
                        ? "bg-red-100 text-red-800 border-red-200" 
                        : "bg-green-100 text-green-800 border-green-200"
                    }>
                      {getDaysUntil(vehicle.insurance.endDate)} days
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="font-medium">No Insurance Information</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Insurance details are not available for this vehicle.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Maintenance and Issues Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="maintenance" className="w-full">
            <TabsList className="w-full rounded-b-none grid grid-cols-2">
              <TabsTrigger value="maintenance">Maintenance History</TabsTrigger>
              <TabsTrigger value="issues">Reported Issues</TabsTrigger>
            </TabsList>
            
            <ScrollArea className="h-[400px]">
              <TabsContent value="maintenance" className="p-4">
                <div className="space-y-4">
                  {vehicle.maintenanceRecords.map((record) => (
                    <div key={record.id} className="flex items-start gap-4 p-4 rounded-lg border">
                      <div className="bg-primary/10 p-2 rounded-full">
                        {getMaintenanceTypeIcon(record.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{record.type.replace(/_/g, ' ')}</h3>
                          <Badge variant="outline" className={getStatusColor(record.status)}>
                            {record.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{record.description}</p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{format(new Date(record.date), "MMM d, yyyy")}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{record.odometer.toLocaleString()} km</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">${record.cost.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="flex-shrink-0">
                        <FileText className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="issues" className="p-4">
                <div className="space-y-4">
                  {vehicle.issues.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
                      <h3 className="font-medium text-lg">No Issues Reported</h3>
                      <p className="text-muted-foreground mt-1 max-w-xs mx-auto">
                        Your vehicle has no reported issues. Use the "Report Issue" button if you encounter any problems.
                      </p>
                    </div>
                  ) : (
                    vehicle.issues.map((issue) => (
                      <div key={issue.id} className="p-4 rounded-lg border">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                            issue.priority === "HIGH" 
                              ? "text-red-500" 
                              : issue.priority === "MEDIUM"
                                ? "text-amber-500"
                                : "text-blue-500"
                          }`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium">{issue.title}</h3>
                              <Badge variant="outline" className={getPriorityColor(issue.priority)}>
                                {issue.priority}
                              </Badge>
                            </div>
                            <p className="text-sm mt-1">{issue.description}</p>
                            <div className="flex items-center justify-between mt-3">
                              <div className="text-sm text-muted-foreground">
                                Reported on {format(new Date(issue.reportedAt), "MMM d, yyyy")}
                              </div>
                              <Badge variant="outline" className={getStatusColor(issue.status)}>
                                {issue.status.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  
                  <div className="flex justify-center pt-2">
                    <Button onClick={() => setIsReportingIssue(true)} variant="outline">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Report New Issue
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}