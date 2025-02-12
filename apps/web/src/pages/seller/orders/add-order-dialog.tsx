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
  governorate: z.string().min(1, "Governorate is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  phone: z.string().min(8, "Phone number must be at least 8 digits"),
  notes: z.string().optional(),
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
      governorate: "",
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

  const onSubmit = async (data: OrderFormValues) => {
    try {
      // Validate required fields
      const requiredFields = {
        governorate: data.governorate,
        phone: data.phone,
        postalCode: data.postalCode
      };

      const emptyFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

      if (emptyFields.length > 0) {
        console.error("Missing required fields:", emptyFields);
        // Set errors manually for empty fields
        emptyFields.forEach(field => {
          form.setError(field as any, {
            type: "required",
            message: `${field} is required`
          });
        });
        return;
      }

      console.log("All required fields present, proceeding with submission");
      
      if (!productsResponse?.data) {
        console.error("No products data available");
        return;
      }

      const items = data.items.map(item => {
        const product = productsResponse.data.find((p:Product) => p.id === item.productId);
        if (!product) {
          console.error(`Product not found for ID: ${item.productId}`);
          return null;
        }
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: product.price,
          weight: product.weight,
          dimensions: product.dimensions,
          packagingType: 'standard',
          fragile: false,
          perishable: false
        };
      }).filter(Boolean);

      const totalAmount = items.reduce((total, item) => {
        return total + (item!.price * item!.quantity);
      }, 0);

      const orderData = {
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        address: data.address,
        city: data.city,
        governorate: data.governorate,
        postalCode: data.postalCode,
        phone: data.phone,
        notes: data.notes || "",
        totalAmount,
        items
      };

      console.log("Sending order data:", orderData);

      const response = await api.post('/sellers/orders', orderData);
      console.log("Order creation response:", response);

      if (response.data) {
        console.log("Order created successfully!");
        await onOrderAdded();
        form.reset();
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Error creating order:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
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
                        {[
                          "Tunis",
                          "Ariana",
                          "Ben Arous",
                          "Manouba",
                          "Nabeul",
                          "Zaghouan",
                          "Bizerte",
                          "Béja",
                          "Jendouba",
                          "Kef",
                          "Siliana",
                          "Sousse",
                          "Monastir",
                          "Mahdia",
                          "Sfax",
                          "Kairouan",
                          "Kasserine",
                          "Sidi Bouzid",
                          "Gabès",
                          "Medenine",
                          "Tataouine",
                          "Gafsa",
                          "Tozeur",
                          "Kebili",
                        ].map((gov) => (
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
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 