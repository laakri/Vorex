import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  sku: string;
  category: string;
}

export function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => api.get("/sellers/products").then((res) => res.data),
  });

  const filteredProducts = products?.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      !categoryFilter || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <div className="border-2 border-dashed border-primary/50 rounded-lg p-12 text-center space-y-4">
        <h3 className="text-2xl font-semibold">No Products Yet</h3>
        <p className="text-muted-foreground max-w-sm">
          Start building your inventory by adding your first product. It only
          takes a few minutes!
        </p>
        <Button size="lg" className="mt-4">
          <Plus className="mr-2 h-5 w-5" />
          Add Your First Product
        </Button>
      </div>
    </div>
  );

  const ProductGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredProducts?.map((product) => (
        <Card
          key={product.id}
          className="group hover:shadow-lg transition-shadow"
        >
          <CardHeader>
            <div className="aspect-square bg-muted rounded-md flex items-center justify-center mb-4">
              <div className="text-muted-foreground">No Image</div>
            </div>
            <CardTitle className="line-clamp-1">{product.name}</CardTitle>
            <CardDescription className="line-clamp-2">
              {product.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold">${product.price}</p>
                <p className="text-sm text-muted-foreground">
                  {product.stock} in stock
                </p>
              </div>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Add New Product Card - Always visible when products exist */}
      <Card className="border-2 border-dashed hover:border-primary/50 transition-colors group cursor-pointer">
        <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px]">
          <Plus className="h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors" />
          <p className="mt-4 text-muted-foreground group-hover:text-primary transition-colors">
            Add New Product
          </p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            Manage your product inventory and listings
          </p>
        </div>
        {products?.length ? (
          <Button size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Add New Product
          </Button>
        ) : null}
      </div>

      {/* Filters - Only show if there are products */}
      {products?.length ? (
        <div className="flex gap-4">
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              <SelectItem value="electronics">Electronics</SelectItem>
              <SelectItem value="clothing">Clothing</SelectItem>
              <SelectItem value="books">Books</SelectItem>
              {/* Add more categories */}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : products?.length ? (
        <ProductGrid />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
