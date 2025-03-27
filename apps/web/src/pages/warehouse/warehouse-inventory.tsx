import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Search, RefreshCw, AlertTriangle } from "lucide-react";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth.store";

// Form schema for inventory adjustment
const inventoryAdjustmentSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  quantity: z.number().min(1, "Quantity must be greater than 0"),
  reason: z.string().min(1, "Reason is required"),
  sectionId: z.string().min(1, "Section is required"),
  pileId: z.string().min(1, "Pile is required"),
});

// Types based on your schema
type Pile = {
  id: string;
  name: string;
  type: string;
  capacity: number;
  currentLoad: number;
  utilization: number;
};

type Section = {
  id: string;
  name: string;
  type: string;
  capacity: number;
  currentLoad: number;
  utilization: number;
  piles: Pile[];
};

type WarehouseInventory = {
  warehouseId: string;
  name: string;
  totalCapacity: number;
  currentLoad: number;
  capacityUtilization: number;
  openOrders: number;
  sections: Section[];
  performance: {
    avgProcessingTimeHours: number;
    completedOrdersLast30Days: number;
  };
};

type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  sectionId: string;
  sectionName: string;
  pileId: string;
  pileName: string;
  lastUpdated: string;
};

export default function WarehouseInventoryPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [inventory, setInventory] = useState<WarehouseInventory | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const adjustmentForm = useForm({
    resolver: zodResolver(inventoryAdjustmentSchema),
    defaultValues: {
      itemId: "",
      quantity: 1,
      reason: "",
      sectionId: "",
      pileId: "",
    },
  });

  // Fetch warehouse inventory data
  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      // Get the warehouse ID from the user's context or from URL params
      const warehouseId = user?.warehouseId || "default-warehouse-id";
      
      const response = await api.get(`/warehouse/${warehouseId}/inventory`);
      
      if (response.data) {
        setInventory(response.data);
        
        // Transform sections and piles into inventory items for the table
        const items: InventoryItem[] = [];
        
        response.data.sections.forEach((section: Section) => {
          section.piles.forEach((pile: Pile) => {
            // In a real app, you would fetch actual inventory items from each pile
            // For now, we'll create a placeholder item for each pile
            items.push({
              id: pile.id,
              name: `${section.type} Material in ${pile.name}`,
              sku: `${section.name.substring(0, 2)}-${pile.name.substring(0, 2)}`,
              quantity: Math.floor(pile.currentLoad),
              sectionId: section.id,
              sectionName: section.name,
              pileId: pile.id,
              pileName: pile.name,
              lastUpdated: new Date().toISOString().split('T')[0],
            });
          });
        });
        
        setInventoryItems(items);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast({
        title: "Error",
        description: "Failed to load inventory data",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  // Filter inventory items based on search query and section filter
  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSection = selectedSection ? item.sectionId === selectedSection : true;
    
    return matchesSearch && matchesSection;
  });

  // Handle opening the adjustment modal
  const handleAdjustItem = (item: InventoryItem) => {
    setSelectedItem(item);
    adjustmentForm.reset({
      itemId: item.id,
      quantity: 1,
      reason: "",
      sectionId: item.sectionId,
      pileId: item.pileId,
    });
    setIsAdjustmentModalOpen(true);
  };

  // Handle inventory adjustment submission
  const handleAdjustmentSubmit = adjustmentForm.handleSubmit(async (data) => {
    try {
      // In a real app, you would call an API endpoint to adjust inventory
      const warehouseId = user?.warehouseId || "default-warehouse-id";
      
      await api.post(`/warehouse/${warehouseId}/inventory/adjust`, {
        pileId: data.pileId,
        quantity: data.quantity,
        reason: data.reason,
      });
      
      toast({
        title: "Success",
        description: "Inventory adjusted successfully",
      });
      
      setIsAdjustmentModalOpen(false);
      fetchInventory(); // Refresh inventory data
    } catch (error) {
      console.error("Error adjusting inventory:", error);
      toast({
        title: "Error",
        description: "Failed to adjust inventory",
        variant: "destructive",
      });
    }
  });

  // Get available piles for the selected section
  const getAvailablePiles = () => {
    if (!adjustmentForm.getValues("sectionId") || !inventory) return [];
    
    const section = inventory.sections.find(
      (s) => s.id === adjustmentForm.getValues("sectionId")
    );
    
    return section ? section.piles : [];
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Warehouse Inventory</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchInventory}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsAdjustmentModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Inventory
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : inventory ? (
        <>
          {/* Warehouse Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Warehouse Capacity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {inventory.currentLoad.toFixed(2)} / {inventory.totalCapacity.toFixed(2)} m³
                </div>
                <div className="mt-2 h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      inventory.capacityUtilization > 80
                        ? "bg-destructive"
                        : inventory.capacityUtilization > 60
                        ? "bg-warning"
                        : "bg-primary"
                    }`}
                    style={{ width: `${Math.min(inventory.capacityUtilization, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {inventory.capacityUtilization.toFixed(1)}% utilized
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Open Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inventory.openOrders}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Orders currently being processed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Processing Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {inventory.performance.avgProcessingTimeHours.toFixed(1)} hrs
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Avg. processing time ({inventory.performance.completedOrdersLast30Days} orders in last 30 days)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Inventory Management */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <TabsList>
                    <TabsTrigger value="all">All Sections</TabsTrigger>
                    {inventory.sections.map((section) => (
                      <TabsTrigger 
                        key={section.id} 
                        value={section.id}
                        onClick={() => setSelectedSection(section.id === selectedSection ? null : section.id)}
                      >
                        {section.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search inventory..."
                        className="pl-8 w-[200px] sm:w-[300px]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <TabsContent value="all" className="space-y-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Section</TableHead>
                          <TableHead>Pile</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead>Last Updated</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems.length > 0 ? (
                          filteredItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell>{item.sku}</TableCell>
                              <TableCell>{item.sectionName}</TableCell>
                              <TableCell>{item.pileName}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell>{item.lastUpdated}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    item.quantity > 20
                                      ? "default"
                                      : item.quantity > 0
                                      ? "outline"
                                      : "destructive"
                                  }
                                >
                                  {item.quantity > 20
                                    ? "In Stock"
                                    : item.quantity > 0
                                    ? "Low Stock"
                                    : "Out of Stock"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAdjustItem(item)}
                                >
                                  Adjust
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center">
                              No inventory items found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {inventory.sections.map((section) => (
                  <TabsContent key={section.id} value={section.id} className="space-y-4">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Pile</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead>Last Updated</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {inventoryItems
                            .filter((item) => item.sectionId === section.id)
                            .filter((item) => 
                              item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              item.sku.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>{item.sku}</TableCell>
                                <TableCell>{item.pileName}</TableCell>
                                <TableCell className="text-right">{item.quantity}</TableCell>
                                <TableCell>{item.lastUpdated}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      item.quantity > 20
                                        ? "default"
                                        : item.quantity > 0
                                        ? "outline"
                                        : "destructive"
                                    }
                                  >
                                    {item.quantity > 20
                                      ? "In Stock"
                                      : item.quantity > 0
                                      ? "Low Stock"
                                      : "Out of Stock"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAdjustItem(item)}
                                  >
                                    Adjust
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Section Utilization */}
          <Card>
            <CardHeader>
              <CardTitle>Section Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventory.sections.map((section) => (
                  <div key={section.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{section.name}</h3>
                        <p className="text-sm text-muted-foreground">{section.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {section.currentLoad.toFixed(2)} / {section.capacity.toFixed(2)} m³
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {section.utilization.toFixed(1)}% utilized
                        </p>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          section.utilization > 80
                            ? "bg-destructive"
                            : section.utilization > 60
                            ? "bg-warning"
                            : "bg-primary"
                        }`}
                        style={{ width: `${Math.min(section.utilization, 100)}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                      {section.piles.map((pile) => (
                        <Card key={pile.id} className="border border-muted">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium">{pile.name}</h4>
                              <Badge variant="outline">{pile.type}</Badge>
                            </div>
                            <div className="text-sm">
                              {pile.currentLoad.toFixed(2)} / {pile.capacity.toFixed(2)} m³
                            </div>
                            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mt-2">
                              <div
                                className={`h-full ${
                                  pile.utilization > 80
                                    ? "bg-destructive"
                                    : pile.utilization > 60
                                    ? "bg-warning"
                                    : "bg-primary"
                                }`}
                                style={{ width: `${Math.min(pile.utilization, 100)}%` }}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <AlertTriangle className="h-10 w-10 text-warning mb-4" />
            <h3 className="text-lg font-medium">No Inventory Data Available</h3>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Could not load inventory data. Please check your connection and try again.
            </p>
            <Button className="mt-4" onClick={fetchInventory}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Inventory Adjustment Modal */}
      <Dialog open={isAdjustmentModalOpen} onOpenChange={setIsAdjustmentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? "Adjust Inventory" : "Add Inventory"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
            {selectedItem && (
              <div className="grid gap-2">
                <label className="text-sm font-medium">Item</label>
                <div className="p-2 border rounded-md bg-muted">
                  <p className="font-medium">{selectedItem.name}</p>
                  <p className="text-sm text-muted-foreground">SKU: {selectedItem.sku}</p>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <label htmlFor="quantity" className="text-sm font-medium">
                Quantity
              </label>
              <Input
                id="quantity"
                type="number"
                min="1"
                {...adjustmentForm.register("quantity", { valueAsNumber: true })}
              />
              {adjustmentForm.formState.errors.quantity && (
                <p className="text-sm text-destructive">
                  {adjustmentForm.formState.errors.quantity.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <label htmlFor="reason" className="text-sm font-medium">
                Reason for Adjustment
              </label>
              <Input
                id="reason"
                {...adjustmentForm.register("reason")}
                placeholder="e.g., New delivery, Inventory count, Damage, etc."
              />
              {adjustmentForm.formState.errors.reason && (
                <p className="text-sm text-destructive">
                  {adjustmentForm.formState.errors.reason.message}
                </p>
              )}
            </div>

            {!selectedItem && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="sectionId" className="text-sm font-medium">
                    Section
                  </label>
                  <select
                    id="sectionId"
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    {...adjustmentForm.register("sectionId")}
                  >
                    <option value="">Select a section</option>
                    {inventory?.sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                  {adjustmentForm.formState.errors.sectionId && (
                    <p className="text-sm text-destructive">
                      {adjustmentForm.formState.errors.sectionId.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <label htmlFor="pileId" className="text-sm font-medium">
                    Pile
                  </label>
                  <select
                    id="pileId"
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    {...adjustmentForm.register("pileId")}
                    disabled={!adjustmentForm.getValues("sectionId")}
                  >
                    <option value="">Select a pile</option>
                    {getAvailablePiles().map((pile) => (
                      <option key={pile.id} value={pile.id}>
                        {pile.name}
                      </option>
                    ))}
                  </select>
                  {adjustmentForm.formState.errors.pileId && (
                    <p className="text-sm text-destructive">
                      {adjustmentForm.formState.errors.pileId.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAdjustmentModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {selectedItem ? "Save Adjustment" : "Add Inventory"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 