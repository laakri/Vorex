import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  Store,
  Building2,

  MapPin,
  FileText,
  Save,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BusinessType, businessTypes, TUNISIA_GOVERNORATES, Governorate } from "@/config/constants";
import api from "@/lib/axios";
import { Badge } from "@/components/ui/badge";

const storeSettingsSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  businessType: z.enum(businessTypes, {
    required_error: "Please select a business type",
  }),
  description: z.string().min(10, "Description must be at least 10 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  governorate: z.enum(TUNISIA_GOVERNORATES, {
    required_error: "Please select a governorate",
  }),
  postalCode: z.string().min(4, "Postal code must be at least 4 characters"),
  phone: z.string()
    .min(8, "Phone must be at least 8 characters")
    .regex(/^[2-9]\d{7}$/, "Invalid Tunisian phone number format"),
  registrationNo: z.string().optional(),
  taxId: z.string().optional(),
});

type StoreSettingsValues = z.infer<typeof storeSettingsSchema>;

// Add interface for store settings response
interface StoreSettings {
  id: string;
  businessName: string;
  businessType: BusinessType;
  description: string;
  address: string;
  city: string;
  governorate: Governorate;
  postalCode: string;
  phone: string;
  registrationNo: string | null;
  taxId: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    email: string;
    fullName: string;
  };
}

export function StoreSettingsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: storeSettings, isLoading } = useQuery<StoreSettings>({
    queryKey: ["storeSettings"],
    queryFn: async () => {
      const response = await api.get("/sellers/store-settings");
      return response.data;
    },
  });

  // Reset form when storeSettings data is loaded
  useEffect(() => {
    if (storeSettings) {
      form.reset({
        businessName: storeSettings.businessName || "",
        businessType: storeSettings.businessType as BusinessType,
        description: storeSettings.description || "",
        address: storeSettings.address || "",
        city: storeSettings.city || "",
        governorate: storeSettings.governorate as Governorate,
        postalCode: storeSettings.postalCode || "",
        phone: storeSettings.phone || "",
        registrationNo: storeSettings.registrationNo || "",
        taxId: storeSettings.taxId || "",
      });
    }
  }, [storeSettings]);

  const form = useForm<StoreSettingsValues>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      businessName: "",
      businessType: businessTypes[0],
      description: "",
      address: "",
      city: "",
      governorate: TUNISIA_GOVERNORATES[0],
      postalCode: "",
      phone: "",
      registrationNo: "",
      taxId: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: StoreSettingsValues) =>
      api.patch("/sellers/store-settings", values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storeSettings"] });
      toast({
        title: "Success",
        description: "Store settings updated successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update store settings",
      });
      console.error("Update error:", error);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  async function onSubmit(values: StoreSettingsValues) {
    setIsSubmitting(true);
    mutation.mutate(values);
  }

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Store Settings</h2>
        <div className="flex items-center space-x-2">
          <Button
            type="submit"
            form="settings-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving Changes
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <Form {...form}>
            <form id="settings-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Business Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Business Information
                  </CardTitle>
                  <CardDescription>
                    Your business details and description
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="businessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select business type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {businessTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            className="min-h-[100px] resize-none"
                            placeholder="Tell us about your business..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Contact Information
                  </CardTitle>
                  <CardDescription>
                    Your business location and contact details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="governorate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Governorate</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select governorate" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TUNISIA_GOVERNORATES.map((governorate) => (
                                <SelectItem key={governorate} value={governorate}>
                                  {governorate}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" />
                        </FormControl>
                        <FormDescription>
                          Enter a valid Tunisian phone number
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Legal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Legal Information
                  </CardTitle>
                  <CardDescription>
                    Your business registration and tax details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="registrationNo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Registration Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Your business registration number (optional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="taxId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax ID</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Your tax identification number (optional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>

        {/* Right Side - Store Status Card */}
        <div className="col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Store Status
              </CardTitle>
              <CardDescription>
                Your store's current status and verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Verification Status</span>
                  <Badge variant={storeSettings?.isVerified ? "default" : "secondary"}>
                    {storeSettings?.isVerified ? "Verified" : "Pending"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Account Created</span>
                  <span className="text-sm text-muted-foreground">
                    {storeSettings?.createdAt ? formatDate(storeSettings.createdAt) : "Loading..."}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Updated</span>
                  <span className="text-sm text-muted-foreground">
                    {storeSettings?.updatedAt ? formatDate(storeSettings.updatedAt) : "Loading..."}
                  </span>
                </div>
                
                {/* Add more store details */}
                <div className="pt-4 mt-4 border-t">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Email</span>
                      <span className="text-sm text-muted-foreground">
                        {storeSettings?.user?.email || "Loading..."}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Owner</span>
                      <span className="text-sm text-muted-foreground">
                        {storeSettings?.user?.fullName || "Loading..."}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 