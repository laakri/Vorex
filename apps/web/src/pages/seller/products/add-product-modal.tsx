import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Product;
  mode?: 'create' | 'edit';
}

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  stock: string;
  sku: string;
  category: string;
  weight: string;
  dimensions: string;
}

interface Product extends Omit<ProductFormData, "price" | "stock"> {
  id: string;
  price: number;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

function generateSKU(productName: string): string {
  if (!productName) return '';
  
  // Get first letters of each word, max 3 letters
  const prefix = productName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 3)
    .join('');
    
  // Generate random 3-digit number
  const number = Math.floor(Math.random() * 900 + 100);
  
  return `${prefix}-${number}`;
}

export function AddProductModal({ 
  isOpen, 
  onClose, 
  initialData, 
  mode = 'create' 
}: AddProductModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ProductFormData>(() => ({
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    price: initialData?.price?.toString() ?? "",
    stock: initialData?.stock?.toString() ?? "",
    sku: initialData?.sku ?? "",
    category: initialData?.category ?? "",
    weight: initialData?.weight?.toString() ?? "",
    dimensions: initialData?.dimensions ?? "",
  }));

  const queryClient = useQueryClient();

  const { mutate: mutateProduct, isPending } = useMutation({
    mutationFn: (data: ProductFormData) => {
      const payload = {
        name: data.name.trim(),
        description: data.description.trim(),
        price: Number(data.price),
        stock: Number(data.stock),
        sku: data.sku.trim().toUpperCase(),
        category: data.category,
        weight: Number(data.weight),
        dimensions: data.dimensions.trim()
      };

      // Validate payload before sending
      if (isNaN(payload.price) || payload.price <= 0) {
        throw new Error('Invalid price');
      }
      if (isNaN(payload.stock) || payload.stock < 0) {
        throw new Error('Invalid stock quantity');
      }
      if (isNaN(payload.weight) || payload.weight <= 0) {
        throw new Error('Invalid weight');
      }

      if (mode === 'edit' && initialData) {
        return api.put<Product>(`/sellers/products/${initialData.id}`, payload);
      }
      return api.post<Product>("/sellers/products", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: `Product ${mode === 'edit' ? 'updated' : 'added'} successfully`,
        description: `The product has been ${mode === 'edit' ? 'updated' : 'added'} to your inventory.`,
      });
      setFormData({ name: "", description: "", price: "", stock: "", sku: "", category: "", weight: "", dimensions: "" });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${mode} product. Please try again.`,
        variant: "destructive",
      });
      console.error(`Failed to ${mode} product:`, error);
    }
  });

  // Auto-generate SKU when name changes
  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      sku: prev.sku || generateSKU(name) // Only generate if SKU is empty
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutateProduct(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit' : 'Add New'} Product</DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? 'Update the details of your product.'
              : 'Fill in the details below to add a new product to your inventory.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Wireless Headphones"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="sku">SKU</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Stock Keeping Unit - A unique identifier for your product. Auto-generated but can be modified.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="relative">
                  <Input
                    id="sku"
                    placeholder="e.g., WH-001-BLK"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, sku: e.target.value.toUpperCase() }))
                    }
                    className="uppercase"
                    required
                  />
                  {formData.name && !formData.sku && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 px-2 text-xs"
                      onClick={() => setFormData(prev => ({ ...prev, sku: generateSKU(formData.name) }))}
                    >
                      Generate
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your product's features, specifications, and other important details..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (DT)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, price: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  placeholder="Available quantity"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, stock: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category: value }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="books">Books</SelectItem>
                  <SelectItem value="home">Home & Living</SelectItem>
                  <SelectItem value="beauty">Beauty & Health</SelectItem>
                  <SelectItem value="sports">Sports & Outdoors</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Product weight in kilograms</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 0.5"
                  value={formData.weight}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, weight: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="dimensions">Dimensions</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Format: Length x Width x Height in centimeters</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="dimensions"
                  placeholder="e.g., 20x15x10"
                  value={formData.dimensions}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, dimensions: e.target.value }))
                  }
                  pattern="\d+x\d+x\d+"
                  title="Format: LxWxH (e.g., 20x15x10)"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? `${mode === 'edit' ? 'Updating...' : 'Adding...'}` : `${mode === 'edit' ? 'Update' : 'Add'} Product`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
