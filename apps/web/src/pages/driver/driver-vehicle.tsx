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
  Upload, 
  Plus,
  Shield
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Skeleton } from "@/components/ui/skeleton"

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

export function DriverVehicle() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [isReportingIssue, setIsReportingIssue] = useState(false)
  const [vehicle, setVehicle] = useState({
    id: "v-12345",
    type: "VAN",
    make: "Ford",
    model: "Transit",
    year: 2021,
    licensePlate: "ABC-1234",
    vin: "1FTYE2YG7HKA12345",
    status: "ACTIVE",
    fuelType: "DIESEL",
    fuelLevel: 75,
    odometer: 45678,
    lastMaintenanceDate: "2023-10-15",
    nextMaintenanceDate: "2024-01-15",
    documents: [
      {
        id: "doc-1",
        type: "INSURANCE",
        number: "INS-987654",
        issuedAt: "2023-01-01",
        expiresAt: "2024-01-01",
        status: "VALID"
      },
      {
        id: "doc-2",
        type: "REGISTRATION",
        number: "REG-123456",
        issuedAt: "2023-02-15",
        expiresAt: "2024-02-15",
        status: "VALID"
      },
      {
        id: "doc-3",
        type: "INSPECTION",
        number: "INSP-456789",
        issuedAt: "2023-05-10",
        expiresAt: "2023-11-10",
        status: "EXPIRED"
      }
    ],
    maintenanceRecords: [
      {
        id: "maint-1",
        type: "OIL_CHANGE",
        date: "2023-10-15",
        odometer: 42500,
        description: "Regular oil change and filter replacement",
        cost: 89.99,
        status: "COMPLETED"
      },
      {
        id: "maint-2",
        type: "TIRE_ROTATION",
        date: "2023-09-01",
        odometer: 40000,
        description: "Rotation of all tires and pressure check",
        cost: 45.00,
        status: "COMPLETED"
      },
      {
        id: "maint-3",
        type: "BRAKE_SERVICE",
        date: "2023-07-20",
        odometer: 38000,
        description: "Replacement of front brake pads",
        cost: 220.50,
        status: "COMPLETED"
      }
    ],
    issues: [
      {
        id: "issue-1",
        title: "Check Engine Light On",
        description: "The check engine light came on while driving on the highway. No noticeable performance issues.",
        reportedAt: "2023-11-01",
        status: "PENDING",
        priority: "MEDIUM"
      }
    ]
  })
  
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
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }, [])

  const onSubmitIssue = (data: z.infer<typeof issueFormSchema>) => {
    // This would be replaced with your actual API call
    console.log("Submitting issue:", data)
    
    // Add the new issue to the vehicle state
    const newIssue = {
      id: `issue-${vehicle.issues.length + 1}`,
      title: data.title,
      description: data.description,
      reportedAt: new Date().toISOString(),
      status: "PENDING",
      priority: data.priority
    }
    
    setVehicle({
      ...vehicle,
      issues: [...vehicle.issues, newIssue]
    })
    
    // Close the dialog and show success message
    setIsReportingIssue(false)
    form.reset()
    
    toast({
      title: "Issue Reported",
      description: "Your vehicle issue has been successfully reported.",
    })
  }

  // Helper function to get days until a date
  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Helper function to get status colors
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
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
  const getPriorityColor = (priority: string) => {
    switch (priority.toUpperCase()) {
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

  // Helper function to get document type icons
  const getDocumentTypeIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'INSURANCE':
        return <Shield className="h-5 w-5 text-primary" />
      case 'REGISTRATION':
        return <FileText className="h-5 w-5 text-primary" />
      case 'INSPECTION':
        return <CheckCircle2 className="h-5 w-5 text-primary" />
      default:
        return <FileText className="h-5 w-5 text-primary" />
    }
  }

  // Helper function to get maintenance type icons
  const getMaintenanceTypeIcon = (type: string) => {
    switch (type.toUpperCase()) {
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

  if (loading) {
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vehicle Information</h1>
          <p className="text-muted-foreground">
            View and manage your assigned vehicle details
          </p>
        </div>
        <Button>
          <Wrench className="mr-2 h-4 w-4" />
          Request Maintenance
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
        
        {/* Issues & Reports Card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-background to-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Issues & Reports</CardTitle>
              <Dialog open={isReportingIssue} onOpenChange={setIsReportingIssue}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Report Issue
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Report Vehicle Issue</DialogTitle>
                    <DialogDescription>
                      Describe the issue you're experiencing with your vehicle.
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
                                placeholder="Provide details about when and how the issue occurs" 
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
                                <SelectItem value="HIGH">High - Vehicle cannot be operated</SelectItem>
                                <SelectItem value="MEDIUM">Medium - Issue affects operation but vehicle is usable</SelectItem>
                                <SelectItem value="LOW">Low - Minor issue, vehicle fully operational</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Select the appropriate priority level for this issue.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button type="submit">Submit Report</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {vehicle.issues.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <h3 className="font-medium">No Active Issues</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your vehicle is currently operating without any reported issues.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {vehicle.issues.slice(0, 3).map((issue) => (
                  <div key={issue.id} className="flex items-start gap-3 p-3 rounded-md bg-muted/30">
                    <AlertTriangle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                      issue.priority === "HIGH" 
                        ? "text-red-500" 
                        : issue.priority === "MEDIUM"
                          ? "text-amber-500"
                          : "text-blue-500"
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{issue.title}</h4>
                        <Badge variant="outline" className={getPriorityColor(issue.priority)}>
                          {issue.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Reported on {format(new Date(issue.reportedAt), "MMM d, yyyy")}
                      </p>
                      <Badge variant="outline" className={`mt-2 ${getStatusColor(issue.status)}`}>
                        {issue.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                {vehicle.issues.length > 3 && (
                  <Button variant="ghost" size="sm" className="w-full">
                    View All {vehicle.issues.length} Issues
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Information Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Management</CardTitle>
          <CardDescription>
            View detailed information about your vehicle's documents, maintenance history, and reported issues
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="documents">
            <TabsList className="w-full grid grid-cols-3 rounded-none border-b">
              <TabsTrigger value="documents" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                Documents
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                Maintenance
              </TabsTrigger>
              <TabsTrigger value="issues" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                Issues
              </TabsTrigger>
            </TabsList>
            
            <ScrollArea className="h-[400px]">
              <TabsContent value="documents" className="p-4">
                <div className="space-y-4">
                  {vehicle.documents.map((doc) => (
                    <div key={doc.id} className="flex items-start gap-4 p-4 rounded-lg border">
                      <div className="bg-primary/10 p-2 rounded-full">
                        {getDocumentTypeIcon(doc.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{doc.type.replace(/_/g, ' ')}</h3>
                          <Badge variant="outline" className={getStatusColor(doc.status)}>
                            {doc.status}
                          </Badge>
                        </div>
                        <div className="mt-2 space-y-1 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Document Number:</span>
                            <span className="font-medium">{doc.number}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Issued Date:</span>
                            <span>{format(new Date(doc.issuedAt), "MMM d, yyyy")}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Expiry Date:</span>
                            <div className="flex items-center gap-1">
                              <span>{format(new Date(doc.expiresAt), "MMM d, yyyy")}</span>
                              <Badge variant="outline" className={
                                getDaysUntil(doc.expiresAt) < 30 
                                  ? "bg-red-100 text-red-800 border-red-200" 
                                  : getDaysUntil(doc.expiresAt) < 90 
                                    ? "bg-amber-100 text-amber-800 border-amber-200"
                                    : "bg-green-100 text-green-800 border-green-200"
                              }>
                                {getDaysUntil(doc.expiresAt)} days
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="flex-shrink-0">
                        <FileText className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  ))}
                  
                  <div className="flex justify-center pt-2">
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-1" />
                      Upload New Document
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
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
                        View Details
                      </Button>
                    </div>
                  ))}
                  
                  <div className="flex justify-center pt-2">
                    <Button variant="outline" size="sm">
                      <Wrench className="h-4 w-4 mr-1" />
                      Schedule Maintenance
                    </Button>
                  </div>
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
                    <Button onClick={() => setIsReportingIssue(true)}>
                      <Plus className="h-4 w-4 mr-1" />
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