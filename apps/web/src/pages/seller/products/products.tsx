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
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { AddProductModal } from "./add-product-modal";
import { EditProductModal } from "./edit-product-modal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import React from "react";

const PRODUCT_CATEGORIES = [
  'Electronics',
  'Clothing',
  'Books',
  'Home & Garden',
  'Sports'
] as const;

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

interface PaginatedProducts {
  data: Product[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
  };
}

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
}

const TablePagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  lastPage, 
  onPageChange 
}) => {
  const pages: (number | string)[] = [];
  
  for (let i = 1; i <= lastPage; i++) {
    if (
      i === 1 ||
      i === lastPage ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      pages.push("...");
    }
  }

  return (
    <Pagination className="mt-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (currentPage > 1) {
                onPageChange(currentPage - 1);
              }
            }}
            aria-disabled={currentPage === 1}
          />
        </PaginationItem>

        {pages.map((p, i) => (
          <PaginationItem key={i}>
            {p === "..." ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                onClick={() => onPageChange(p as number)}
                isActive={currentPage === p}
              >
                {p}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (currentPage < lastPage) {
                onPageChange(currentPage + 1);
              }
            }}
            aria-disabled={currentPage === lastPage}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [page, setPage] = useState<number>(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const limit = 10;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: paginatedProducts, isLoading } = useQuery<PaginatedProducts>({
    queryKey: ["products", page, limit],
    queryFn: async () => {
      const response = await api.get<PaginatedProducts>("/sellers/products", {
        params: {
          page,
          limit,
        },
      });
      return response.data;
    },
  });

  const filteredProducts = React.useMemo(() => {
    if (!paginatedProducts?.data) return [];
    
    return paginatedProducts.data.filter((product) => {
      const matchesSearch = searchTerm 
        ? product.name.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      const matchesCategory = categoryFilter === "all" 
        ? true 
        : product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [paginatedProducts?.data, searchTerm, categoryFilter]);

  const activeListings = React.useMemo(() => 
    filteredProducts.filter(p => p.stock > 0).length,
    [filteredProducts]
  );

  const lowStockItems = React.useMemo(() => 
    filteredProducts.filter(p => p.stock <= 10).length,
    [filteredProducts]
  );

  const statsCards = React.useMemo(() => [
    {
      title: "Total Products",
      value: paginatedProducts?.meta?.total ?? 0,
      icon: Package,
    },
    {
      title: "Active Listings",
      value: activeListings,
      icon: ShoppingBag,
    },
    {
      title: "Low Stock Items",
      value: lowStockItems,
      icon: AlertCircle,
    },
  ], [paginatedProducts?.meta?.total, activeListings, lowStockItems]);

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const { mutate: deleteProduct } = useMutation({
    mutationFn: async (productId: string) => {
      await api.delete(`/sellers/products/${productId}`);
    },
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
      <div className="grid gap-4 md:grid-cols-3">
        {statsCards.map((card, index) => (
          <Card key={index}>
            <CardContent className="flex items-center gap-4 p-6">
              <card.icon className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground leading-none">
                  {card.title}
                </p>
                <p className="text-2xl font-bold">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-dashed">
        <CardContent className="flex justify-between items-center py-3">
          <div className="flex gap-3 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select 
              value={categoryFilter} 
              onValueChange={(value: string) => setCategoryFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {PRODUCT_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
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
      ) : filteredProducts.length > 0 ? (
        <>
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
                {filteredProducts.map((product) => (
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
          {paginatedProducts?.meta && (
            <TablePagination
              currentPage={page}
              lastPage={paginatedProducts.meta.lastPage}
              onPageChange={handlePageChange}
            />
          )}
        </>
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
