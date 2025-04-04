import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/auth.store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Save } from "lucide-react";
import { Loader2 } from "lucide-react";

// Define the form schema with Zod
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  governorate: z.string().min(2, "Governorate must be at least 2 characters"),
  postalCode: z.string().min(2, "Postal code must be at least 2 characters"),
  phone: z.string().min(8, "Phone must be at least 8 characters"),
  capacity: z.coerce.number().min(0, "Capacity must be a positive number"),
  currentLoad: z.coerce.number().min(0, "Current load must be a positive number"),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  coverageGovernorate: z.array(z.string()).default([])
});

type FormValues = z.infer<typeof formSchema>;

export default function WarehouseSettings() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  // Get warehouse ID from user
  const warehouseId = user?.warehouseId || "";
  
  // Create form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      governorate: "",
      postalCode: "",
      phone: "",
      capacity: 0,
      currentLoad: 0,
      latitude: 0,
      longitude: 0,
      coverageGovernorate: []
    },
  });
  
  // Fetch warehouse settings
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['warehouseSettings', warehouseId],
    queryFn: async () => {
      if (!warehouseId) {
        toast({
          title: "Error",
          description: "No warehouse ID found. Please ensure you're logged in as a warehouse manager.",
          variant: "destructive"
        });
        throw new Error("No warehouse ID found");
      }
      
      const response = await api.get(`/warehouse/${warehouseId}/settings`);
      return response.data;
    },
    enabled: !!warehouseId,
  });
  
  // Set form values when data is loaded
  useEffect(() => {
    if (data) {
      form.reset({
        name: data.name || "",
        address: data.address || "",
        city: data.city || "",
        governorate: data.governorate || "",
        postalCode: data.postalCode || "",
        phone: data.phone || "",
        capacity: data.capacity || 0,
        currentLoad: data.currentLoad || 0,
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        coverageGovernorate: data.coverageGovernorate || []
      });
    }
  }, [data, form]);
  
  // Update warehouse settings mutation
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!warehouseId) {
        throw new Error("No warehouse ID found");
      }
      
      // Ensure all numeric values are properly converted to numbers
      const payload = {
        ...values,
        capacity: Number(values.capacity),
        currentLoad: Number(values.currentLoad),
        latitude: Number(values.latitude),
        longitude: Number(values.longitude)
      };
      
      const response = await api.put(`/warehouse/${warehouseId}/settings`, payload);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Warehouse settings have been successfully updated",
      });
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['warehouseSettings', warehouseId] });
    },
    onError: (error: any) => {
      console.error("Update error:", error);
      toast({
        title: "Error updating settings",
        description: error.response?.data?.message || error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Warehouse Settings</h1>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }
  
  // Show error state
  if (isError) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center p-6 bg-destructive/10 rounded-lg">
          <AlertCircle className="h-10 w-10 text-destructive mb-4" />
          <h3 className="text-xl font-semibold mb-2">Error Loading Settings</h3>
          <p className="text-muted-foreground text-center mb-4">
            {error instanceof Error ? error.message : "An unexpected error occurred"}
          </p>
          <Button 
            variant="outline" 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['warehouseSettings', warehouseId] })}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Warehouse Settings</h1>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* General Information */}
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>
                Basic details about your warehouse
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warehouse Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter warehouse name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Capacity (m³)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormDescription>
                        Maximum storage volume in cubic meters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="currentLoad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Load (m³)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormDescription>
                        Current storage usage in cubic meters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle>Location Details</CardTitle>
              <CardDescription>
                Address and geographical information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter street address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter city" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="governorate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Governorate</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter governorate" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter postal code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.000001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.000001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={mutation.isPending}
              className="flex items-center gap-2"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 
