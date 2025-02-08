import { useState } from "react";
import { 
  Plus, Package2, Search,  Pencil,
   Package, ShoppingBag, AlertCircle, MoreHorizontal, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Card, CardContent
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { AddProductModal } from "./add-product-modal";
import { EditProductModal } from "./edit-product-modal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  sku: string;
  category: string;
  weight: number;
  dimensions: string;
  createdAt: string;
  updatedAt: string;
}

export function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => api.get("/sellers/products").then((res) => res.data),
  });

  const filteredProducts = products?.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const statsCards = [
    {
      title: "Total Products",
      value: products?.length || 0,
      icon: Package,
    },
    {
      title: "Active Listings",
      value: products?.filter(p => p.stock > 0).length || 0,
      icon: ShoppingBag,
    },
    {
      title: "Low Stock Items",
      value: products?.filter(p => p.stock <= 10).length || 0,
      icon: AlertCircle,
    },
  ];

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-6">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-primary/5 rounded-full animate-pulse" />
        <Package2 className="w-full h-full text-primary/40" strokeWidth={0.5} />
      </div>
      <div className="text-center space-y-4 max-w-md">
        <h3 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
          Your Store is Empty
        </h3>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Start building your inventory by adding your first product. We'll help you set
          everything up in just a few minutes.
            </p>
            <div>
          <Button size="lg" className="mt-6  px-8" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-5 w-5" />
            Add Your First Product
          </Button>
        </div>
      </div>
    </div>
  );

  const { mutate: deleteProduct } = useMutation({
    mutationFn: (productId: string) =>
      api.delete(`/sellers/products/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Product deleted",
        description: "The product has been removed from your inventory.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to delete product:", error);
    },
  });

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="container py-6 space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your product inventory
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-semibold mt-1">{stat.value}</p>
                </div>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-dashed">
        <CardContent className="py-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={categoryFilter || undefined} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="clothing">Clothing</SelectItem>
                <SelectItem value="books">Books</SelectItem>
                <SelectItem value="home">Home & Living</SelectItem>
                <SelectItem value="beauty">Beauty & Health</SelectItem>
                <SelectItem value="sports">Sports & Outdoors</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      ) : products?.length ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {product.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {product.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{product.sku}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {product.price.toFixed(2)} DT
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div
                        className={cn(
                          "size-2 rounded-full",
                          product.stock > 10 ? "bg-green-500" : "bg-amber-500"
                        )}
                      />
                      <span>{product.stock}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(product)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(product)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState />
      )}

      <AddProductModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      <EditProductModal 
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedProduct?.name}" from your inventory.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedProduct(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedProduct && deleteProduct(selectedProduct.id)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
