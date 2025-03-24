import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Warehouse as WarehouseIcon, Layers, Package, Edit, Trash2 } from "lucide-react";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth.store";

// Form schemas
const createSectionSchema = z.object({
  name: z.string().min(1, "Section name is required"),
  description: z.string().optional(),
  capacity: z.number().min(1, "Capacity must be greater than 0"),
  sectionType: z.string().min(1, "Section type is required"),
});

const createPileSchema = z.object({
  name: z.string().min(1, "Pile name is required"),
  description: z.string().optional(),
  capacity: z.number().min(1, "Capacity must be greater than 0"),
  pileType: z.string().min(1, "Pile type is required"),
});

type Warehouse = {
  id: string;
  name: string;
  capacity: number;
  currentLoad: number;
  sections: Section[];
};

type Section = {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  currentLoad: number;
  sectionType: string;
  piles: Pile[];
};

type Pile = {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  currentLoad: number;
  pileType: string;
};

export function WarehouseSectionsPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [currentWarehouse, setCurrentWarehouse] = useState<Warehouse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewSectionModalOpen, setIsNewSectionModalOpen] = useState(false);
  const [isNewPileModalOpen, setIsNewPileModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>("");
  
  // Section types and pile types
  const sectionTypes = ["STANDARD", "REFRIGERATED", "HAZARDOUS", "BULK", "HIGH_VALUE"];
  const pileTypes = ["STANDARD", "FRAGILE", "HEAVY", "PERISHABLE", "HAZARDOUS"];
  
  // Forms
  const sectionForm = useForm({
    resolver: zodResolver(createSectionSchema),
    defaultValues: {
      name: "",
      description: "",
      capacity: 100,
      sectionType: "",
    },
  });
  
  const pileForm = useForm({
    resolver: zodResolver(createPileSchema),
    defaultValues: {
      name: "",
      description: "",
      capacity: 50,
      pileType: "",
    },
  });
  
  // Fetch warehouses data
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/warehouse');
        setWarehouses(response.data);
        
        // If user is a warehouse manager, select their warehouse automatically
        if (user?.role?.includes('WAREHOUSE_MANAGER') && user?.warehouseId) {
          setSelectedWarehouse(user.warehouseId);
        } else if (response.data.length > 0) {
          setSelectedWarehouse(response.data[0].id);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching warehouses:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load warehouses. Please try again.",
        });
        setIsLoading(false);
      }
    };
    
    fetchWarehouses();
  }, [user, toast]);
  
  // Fetch warehouse details when selected warehouse changes
  useEffect(() => {
    const fetchWarehouseDetails = async () => {
      if (!selectedWarehouse) return;
      
      try {
        setIsLoading(true);
        const response = await api.get(`/warehouse/${selectedWarehouse}`);
        setCurrentWarehouse(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching warehouse details:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load warehouse details. Please try again.",
        });
        setIsLoading(false);
      }
    };
    
    fetchWarehouseDetails();
  }, [selectedWarehouse, toast]);
  
  // Handle section creation
  const onCreateSection = async (data: z.infer<typeof createSectionSchema>) => {
    try {
      const response = await api.post(`/warehouse/${selectedWarehouse}/sections`, data);
      
      // Update local state with new section
      const newSection = response.data;
      setCurrentWarehouse(prev => {
        if (!prev) return null;
        return {
          ...prev,
          sections: [...prev.sections, newSection]
        };
      });
      
      toast({
        title: "Success",
        description: "Section created successfully.",
      });
      
      setIsNewSectionModalOpen(false);
      sectionForm.reset();
    } catch (error: any) {
      console.error('Error creating section:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to create section. Please try again.",
      });
    }
  };
  
  // Handle pile creation
  const onCreatePile = async (data: z.infer<typeof createPileSchema>) => {
    try {
      const response = await api.post(`/warehouse/sections/${selectedSection}/piles`, data);
      
      // Update local state with new pile
      const newPile = response.data;
      setCurrentWarehouse(prev => {
        if (!prev) return null;
        return {
          ...prev,
          sections: prev.sections.map(section => {
            if (section.id === selectedSection) {
              return {
                ...section,
                piles: [...section.piles, newPile]
              };
            }
            return section;
          })
        };
      });
      
      toast({
        title: "Success",
        description: "Pile created successfully.",
      });
      
      setIsNewPileModalOpen(false);
      pileForm.reset();
    } catch (error: any) {
      console.error('Error creating pile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to create pile. Please try again.",
      });
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Warehouse Sections</h1>
          <p className="text-muted-foreground">Manage sections and piles within your warehouse</p>
        </div>
        
        {warehouses.length > 1 && (
          <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select warehouse" />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      
      {currentWarehouse && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{currentWarehouse.name}</CardTitle>
              <CardDescription>
                Capacity: {currentWarehouse.currentLoad} / {currentWarehouse.capacity} units
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Progress value={(currentWarehouse.currentLoad / currentWarehouse.capacity) * 100} />
              </div>
              
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium">Sections ({currentWarehouse.sections.length})</h3>
                <Dialog open={isNewSectionModalOpen} onOpenChange={setIsNewSectionModalOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Section
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Section</DialogTitle>
                      <DialogDescription>
                        Add a new section to your warehouse to organize inventory.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={sectionForm.handleSubmit(onCreateSection)}>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name">Section Name</Label>
                          <Input
                            id="name"
                            {...sectionForm.register("name")}
                          />
                          {sectionForm.formState.errors.name && (
                            <p className="text-sm text-destructive">{sectionForm.formState.errors.name.message}</p>
                          )}
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="description">Description (Optional)</Label>
                          <Textarea
                            id="description"
                            {...sectionForm.register("description")}
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="capacity">Capacity</Label>
                          <Input
                            id="capacity"
                            type="number"
                            {...sectionForm.register("capacity", { valueAsNumber: true })}
                          />
                          {sectionForm.formState.errors.capacity && (
                            <p className="text-sm text-destructive">{sectionForm.formState.errors.capacity.message}</p>
                          )}
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="sectionType">Section Type</Label>
                          <Controller
                            control={sectionForm.control}
                            name="sectionType"
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select section type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {sectionTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type.replace(/_/g, ' ')}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                          {sectionForm.formState.errors.sectionType && (
                            <p className="text-sm text-destructive">{sectionForm.formState.errors.sectionType.message}</p>
                          )}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsNewSectionModalOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Create Section</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              
              {currentWarehouse.sections.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <Layers className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No Sections Created</h3>
                    <p className="text-center text-muted-foreground mt-2">
                      Create sections to organize your warehouse inventory.
                    </p>
                    <Button 
                      className="mt-4" 
                      onClick={() => setIsNewSectionModalOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Section
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentWarehouse.sections.map((section) => (
                    <Card key={section.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{section.name}</CardTitle>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <CardDescription>
                          {section.description || "No description"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Capacity: {section.currentLoad} / {section.capacity}</span>
                            <span className="px-2 py-1 rounded-full bg-muted text-xs">
                              {section.sectionType.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <Progress value={(section.currentLoad / section.capacity) * 100} />
                        </div>
                        
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium">Piles ({section.piles.length})</h4>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedSection(section.id);
                                setIsNewPileModalOpen(true);
                              }}
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Add Pile
                            </Button>
                          </div>
                          
                          {section.piles.length === 0 ? (
                            <div className="text-center py-3 text-sm text-muted-foreground">
                              No piles created yet
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {section.piles.map((pile) => (
                                <div 
                                  key={pile.id} 
                                  className="p-2 rounded-md bg-muted flex items-center justify-between"
                                >
                                  <div className="flex items-center">
                                    <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <div>
                                      <p className="text-sm font-medium">{pile.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {pile.currentLoad} / {pile.capacity} • {pile.pileType.replace(/_/g, ' ')}
                                      </p>
                                    </div>
                                  </div>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Pile Creation Dialog */}
          <Dialog open={isNewPileModalOpen} onOpenChange={setIsNewPileModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Pile</DialogTitle>
                <DialogDescription>
                  Add a new pile to organize inventory within this section.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={pileForm.handleSubmit(onCreatePile)}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Pile Name</Label>
                    <Input
                      id="name"
                      {...pileForm.register("name")}
                    />
                    {pileForm.formState.errors.name && (
                      <p className="text-sm text-destructive">{pileForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      {...pileForm.register("description")}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      {...pileForm.register("capacity", { valueAsNumber: true })}
                    />
                    {pileForm.formState.errors.capacity && (
                      <p className="text-sm text-destructive">{pileForm.formState.errors.capacity.message}</p>
                    )}
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="pileType">Pile Type</Label>
                    <Controller
                      control={pileForm.control}
                      name="pileType"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select pile type" />
                          </SelectTrigger>
                          <SelectContent>
                            {pileTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type.replace(/_/g, ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {pileForm.formState.errors.pileType && (
                      <p className="text-sm text-destructive">{pileForm.formState.errors.pileType.message}</p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsNewPileModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Pile</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
} 