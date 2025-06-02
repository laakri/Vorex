import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Users as UsersIcon, UserPlus } from "lucide-react";
import api from "@/lib/axios";
import { Input } from '@/components/ui/input';

// Form schema
const assignManagerSchema = z.object({
  userId: z.string().min(1, "User is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
});

type User = {
  id: string;
  fullName: string;
  email: string;
  role: string[];
};

type Warehouse = {
  id: string;
  name: string;
  city: string;
  governorate: string;
};

type WarehouseManager = {
  id: string;
  userId: string;
  warehouseId: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  warehouse: {
    id: string;
    name: string;
    city: string;
    governorate: string;
  };
  status: 'active' | 'inactive';
};

export function AdminWarehouseManagersPage() {
  const { toast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [managers, setManagers] = useState<WarehouseManager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [newManager, setNewManager] = useState({
    name: '',
    email: '',
    warehouseId: '',
  });
  
  // Form
  const form = useForm({
    resolver: zodResolver(assignManagerSchema),
    defaultValues: {
      userId: "",
      warehouseId: "",
    },
  });

  // Fetch managers function
  const fetchManagers = async () => {
    try {
      const response = await api.get('/admin/warehouse-managers');
      setManagers(response.data);
    } catch (error) {
      console.error('Error fetching managers:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load warehouse managers. Please try again.",
      });
    }
  };
  
  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch users, warehouses, and existing managers
        const [usersResponse, warehousesResponse, managersResponse] = await Promise.all([
          api.get('/users/users'),
          api.get('/warehouse'),
          api.get('/admin/warehouse-managers')
        ]);
        
        setUsers(usersResponse.data);
        console.log("Users data:", usersResponse.data);
        setWarehouses(warehousesResponse.data);
        setManagers(managersResponse.data);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load data. Please try again.",
        });
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);
  
  // Handle manager assignment
  const onSubmit = async (data: z.infer<typeof assignManagerSchema>) => {
    try {
      console.log('Submitting data:', data); // Debug log
      const response = await api.post('/admin/warehouse-managers', {
        userId: data.userId,
        warehouseId: data.warehouseId
      });
      
      // Update local state with new manager
      const newManager = response.data;
      setManagers([...managers, newManager]);
      
      toast({
        title: "Success",
        description: "Warehouse manager assigned successfully.",
      });
      
      setIsAssignModalOpen(false);
      form.reset();
    } catch (error: any) {
      console.error('Error assigning manager:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to assign manager. Please try again.",
      });
    }
  };
  
  
  
  // Filter users to show only those who can be warehouse managers
  const eligibleUsers = users.filter(user => 
    user.role.includes('WAREHOUSE_MANAGER') || 
    user.role.includes('ADMIN') ||
    !managers.some(manager => manager.userId === user.id)
  );
  
  console.log("Eligible users:", eligibleUsers);
  
  const handleAddManager = async () => {
    try {
      // First create the user
      const userResponse = await api.post('/users', {
        fullName: newManager.name,
        email: newManager.email,
        role: ['WAREHOUSE_MANAGER']
      });

      // Then assign them as a warehouse manager
      await api.post('/admin/warehouse-managers', {
        userId: userResponse.data.id,
        warehouseId: newManager.warehouseId
      });

      toast({
        title: "Success",
        description: "Warehouse manager added successfully.",
      });
      setNewManager({ name: '', email: '', warehouseId: '' });
      fetchManagers();
    } catch (error) {
      console.error('Failed to add manager:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add warehouse manager. Please try again.",
      });
    }
  };

  const handleToggleStatus = async (managerId: string, currentStatus: 'active' | 'inactive') => {
    try {
      await api.patch(`/admin/warehouse-managers/${managerId}/status`, {
        status: currentStatus === 'active' ? 'inactive' : 'active',
      });
      toast({
        title: "Success",
        description: "Manager status updated successfully.",
      });
      fetchManagers();
    } catch (error) {
      console.error('Failed to update manager status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update manager status. Please try again.",
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
          <h1 className="text-2xl font-bold tracking-tight">Warehouse Managers</h1>
          <p className="text-muted-foreground">Assign users to manage warehouses</p>
        </div>
        
        <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Assign Manager
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Warehouse Manager</DialogTitle>
              <DialogDescription>
                Select a user and warehouse to assign management responsibilities.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="userId">User</Label>
                  <Controller
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.length === 0 ? (
                            <SelectItem value="none" disabled>
                              No users available
                            </SelectItem>
                          ) : (
                            users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.fullName} ({user.email})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.userId && (
                    <p className="text-sm text-destructive">{form.formState.errors.userId.message}</p>
                  )}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="warehouseId">Warehouse</Label>
                  <Controller
                    control={form.control}
                    name="warehouseId"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select warehouse" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id}>
                              {warehouse.name} ({warehouse.city}, {warehouse.governorate})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.warehouseId && (
                    <p className="text-sm text-destructive">{form.formState.errors.warehouseId.message}</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAssignModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Assign Manager</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {managers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <UsersIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Warehouse Managers Assigned</h3>
            <p className="text-center text-muted-foreground mt-2">
              Assign users with the Warehouse Manager role to manage specific warehouses.
            </p>
            <Button 
              className="mt-4" 
              onClick={() => setIsAssignModalOpen(true)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Assign First Manager
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Current Warehouse Managers</CardTitle>
            <CardDescription>
              Users with access to manage specific warehouses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Manager</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {managers.map((manager) => (
                  <TableRow key={manager.id}>
                    <TableCell className="font-medium">{manager.user.fullName}</TableCell>
                    <TableCell>{manager.user.email}</TableCell>
                    <TableCell>{manager.warehouse.name}</TableCell>
                    <TableCell>
                      {manager.warehouse.city}, {manager.warehouse.governorate}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          manager.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {manager.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(manager.id, manager.status)}
                      >
                        {manager.status === 'active' ? 'Deactivate' : 'Activate'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      
      {/* Help Card */}
      <Card className="bg-muted/40">
        <CardHeader>
          <CardTitle className="text-base">About Warehouse Managers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              Warehouse Managers have access to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Manage warehouse inventory and sections</li>
              <li>Process incoming and outgoing orders</li>
              <li>Create and manage piles within sections</li>
              <li>View warehouse analytics and reports</li>
              <li>Manage warehouse staff assignments</li>
            </ul>
            <p className="mt-2">
              To assign a warehouse manager, the user must first have the Warehouse Manager role assigned to their account.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add New Manager</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newManager.name}
                onChange={(e) => setNewManager({ ...newManager, name: e.target.value })}
                placeholder="Manager name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={newManager.email}
                onChange={(e) => setNewManager({ ...newManager, email: e.target.value })}
                placeholder="Manager email"
              />
            </div>
            <div className="space-y-2">
              <Label>Warehouse</Label>
              <Select
                value={newManager.warehouseId}
                onValueChange={(value) => setNewManager({ ...newManager, warehouseId: value })}
              >
                <SelectTrigger>
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
            </div>
          </div>
          <Button onClick={handleAddManager}>Add Manager</Button>
        </CardContent>
      </Card>
    </div>
  );
} 