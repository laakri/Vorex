import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Trash2 } from "lucide-react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import MapPicker from '@/components/map-picker';
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Governorate, TUNISIA_GOVERNORATES } from '@/config/constants';

interface Product {
  id: string;
  name: string;
  price: number;
  weight: number;
  dimensions: string;
  stock: number;
}

interface AddOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderAdded: () => void;
}

const orderSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Invalid email address"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  governorate: z.enum(TUNISIA_GOVERNORATES),
  postalCode: z.string().min(1, "Postal code is required"),
  phone: z.string().min(8, "Phone number must be at least 8 digits"),
  notes: z.string().optional(),
  dropLatitude: z.number(),
  dropLongitude: z.number(),
  items: z.array(z.object({
    productId: z.string().min(1, "Product is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    price: z.number(),
    weight: z.number(),
    dimensions: z.string(),
    packagingType: z.string().optional(),
    fragile: z.boolean().optional(),
    perishable: z.boolean().optional(),
  })).min(1, "At least one item is required"),
});

type OrderFormValues = z.infer<typeof orderSchema>;

export function AddOrderDialog({ open, onOpenChange, onOrderAdded }: AddOrderDialogProps) {
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      address: "",
      city: "",
      governorate: "Tunis" as Governorate,
      postalCode: "",
      phone: "",
      notes: "",
      items: [
        {
          productId: "",
          quantity: 1,
          price: 0,
          weight: 0,
          dimensions: "",
          packagingType: "standard",
          fragile: false,
          perishable: false,
        },
      ],
    },
  });

  const { data: productsResponse, isLoading, error } = useQuery({
    queryKey: ["seller-products"],
    queryFn: async () => {
      try {
        const response = await api.get("/sellers/orders/products");
        console.log("Raw products response:", response);
        
        if (!response.data) {
          throw new Error('No data received from server');
        }
        
        if (!response.data.data || !Array.isArray(response.data.data)) {
          console.error('Invalid response structure:', response.data);
          throw new Error('Invalid response structure');
        }
        
        return response.data;
      } catch (error) {
        console.error("Error fetching products:", {
          error: error as Error,
          message: error instanceof Error ? error.message : String(error),
          response: (error as any)?.response?.data
        });
        throw error;
      }
    },
    retry: 1,
    staleTime: 30000, // Cache for 30 seconds
  });

  const handleProductSelect = (value: string, index: number) => {
    const selectedProduct = productsResponse?.data?.find((p: Product) => p.id === value);
    if (selectedProduct) {
      form.setValue(`items.${index}.productId`, value);
      form.setValue(`items.${index}.price`, selectedProduct.price);
      form.setValue(`items.${index}.weight`, selectedProduct.weight);
      form.setValue(`items.${index}.dimensions`, selectedProduct.dimensions);
    }
  };

  const addItem = () => {
    const currentItems = form.getValues("items");
    form.setValue("items", [
      ...currentItems,
      {
        productId: "",
        quantity: 1,
        price: 0,
        weight: 0,
        dimensions: "",
        packagingType: "standard",
        fragile: false,
        perishable: false,
      },
    ]);
  };

  const removeItem = (index: number) => {
    const currentItems = form.getValues("items");
    form.setValue(
      "items",
      currentItems.filter((_, i) => i !== index)
    );
  };

  const [location, setLocation] = useState<{lat: number; lng: number} | null>(null);

  const onSubmit = async (data: OrderFormValues) => {
    if (!location) {
      toast({
        title: "Error",
        description: "Please select a delivery location on the map",
        variant: "destructive"
      });
      return;
    }

    const orderData = {
      ...data,
      dropLatitude: Number(location.lat),
      dropLongitude: Number(location.lng),
      totalAmount: calculateTotalAmount(data.items)
    };

    try {
      // Validate required fields
      const requiredFields = {
        governorate: orderData.governorate,
        phone: orderData.phone,
        postalCode: orderData.postalCode
      };

      const emptyFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

      if (emptyFields.length > 0) {
        emptyFields.forEach(field => {
          form.setError(field as any, {
            type: "required",
            message: `${field} is required`
          });
        });
        return;
      }

      console.log("All required fields present, proceeding with submission");
      console.log("Sending order data: ", orderData);

      await api.post("/sellers/orders", orderData);
      
      onOrderAdded?.();
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Order created successfully",
      });
    } catch (error: any) {
      console.error("Error creating order: ", error);
      toast({
        title: "Error",
        description: error.response?.data?.message?.[0] || "Failed to create order",
        variant: "destructive",
      });
    }
  };

  // Helper function to calculate total amount
  const calculateTotalAmount = (items: OrderFormValues['items']) => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const previewDeliveryPrice = async () => {
    if (!form.getValues('governorate') || form.getValues('items').length === 0) {
      return;
    }

    try {
      const response = await api.post('/sellers/orders/preview-delivery-price', {
        items: form.getValues('items').map(item => ({
          weight: item.weight,
          dimensions: item.dimensions,
          quantity: item.quantity,
          fragile: item.fragile,
          perishable: item.perishable
        })),
        deliveryGovernorate: form.getValues('governorate')
      });

      // Show price preview
      toast({
        title: "Delivery Price Preview",
        description: (
          <div className="space-y-2">
            <p>Estimated Delivery Price: {response.data.finalPrice} DT</p>
            <p className="text-sm text-muted-foreground">
              Weight: {response.data.breakdown.weight} kg
              <br />
              Volume: {response.data.breakdown.volume} cm³
              <br />
              Fragile Items: {response.data.breakdown.fragileItems}
              <br />
              Perishable Items: {response.data.breakdown.perishableItems}
            </p>
          </div>
        )
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to calculate delivery price",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
          <DialogDescription>
            Fill in the order details below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Full name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="email@example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Street address" />
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
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="City" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="governorate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Governorate *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select governorate" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TUNISIA_GOVERNORATES.map((gov) => (
                          <SelectItem key={gov} value={gov}>
                            {gov}
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
                    <FormLabel>Postal Code *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="####" 
                        maxLength={4}
                        pattern="[0-9]{4}"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="########" 
                        maxLength={8}
                        pattern="[0-9]{8}"
                        type="tel"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Additional notes (optional)" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="font-medium">Order Items *</div>
              {form.watch("items").map((_item, index) => (
                <div key={index} className="flex gap-4 items-end">
                  <FormField
                    control={form.control}
                    name={`items.${index}.productId`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Product</FormLabel>
                        <Select
                          onValueChange={(value) => handleProductSelect(value, index)}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Search and select product..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <div className="flex items-center px-3 pb-2">
                              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                              <input
                                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Search products..."
                               
                              />
                            </div>
                            {isLoading ? (
                              <SelectItem value="loading" disabled>Loading products...</SelectItem>
                            ) : error ? (
                              <SelectItem value="error" disabled>Error loading products</SelectItem>
                            ) : productsResponse?.data && productsResponse.data.length > 0 ? (
                              productsResponse.data.map((product: Product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  <div className="flex justify-between items-center gap-2 w-full">
                                    <span className="truncate max-w-[200px]">{product.name}</span>
                                    <span className={cn(
                                      "text-sm whitespace-nowrap",
                                      product.stock === 0 ? "text-destructive font-medium" : "text-muted-foreground"
                                    )}>
                                      {product.price.toFixed(2)} DT 
                                      {product.stock === 0 ? " (Out of stock)" : ` (${product.stock})`}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-products">No products found</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem className="w-24">
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={form.watch("items").length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addItem}>
                Add Item
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Delivery Location</Label>
              <MapPicker
                initialPosition={[36.8065, 10.1815]}
                onLocationSelect={(lat, lng) => {
                  setLocation({ lat, lng });
                  form.setValue('dropLatitude', lat);
                  form.setValue('dropLongitude', lng);
                }}
              />
              <FormDescription>
                Click on the map to set the delivery location
              </FormDescription>
            </div>

            <div className="space-y-4">
              {Object.keys(form.formState.errors).length > 0 && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  <p className="font-medium">Please fix the following errors:</p>
                  <ul className="list-disc list-inside mt-1">
                    {Object.entries(form.formState.errors).map(([field, error]) => (
                      <li key={field}>{error.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button 
                type="submit" 
                disabled={form.formState.isSubmitting}
                className="w-full"
              >
                {form.formState.isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <span>Creating Order...</span>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : (
                  'Create Order'
                )}
              </Button>
            </DialogFooter>

            <Button 
              type="button" 
              variant="outline" 
              onClick={previewDeliveryPrice}
              disabled={!form.getValues('governorate') || form.getValues('items').length === 0}
            >
              Preview Delivery Price
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 