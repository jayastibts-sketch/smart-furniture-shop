import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Eye, Search, Loader2, Mail, Phone, Calendar, ShoppingBag, MapPin } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CustomerProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface CustomerOrder {
  id: string;
  order_number: string;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
}

interface CustomerAddress {
  id: string;
  label: string;
  full_name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
}

interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
}

const Customers = () => {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[]>([]);
  const [customerStats, setCustomerStats] = useState<CustomerStats>({ totalOrders: 0, totalSpent: 0, avgOrderValue: 0 });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to fetch customers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const viewCustomerDetails = async (customer: CustomerProfile) => {
    setSelectedCustomer(customer);
    setIsDialogOpen(true);
    setIsLoadingDetails(true);

    try {
      // Fetch orders
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id, order_number, total, status, payment_status, created_at")
        .eq("user_id", customer.user_id)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch addresses
      const { data: addresses, error: addressesError } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", customer.user_id)
        .order("is_default", { ascending: false });

      if (addressesError) throw addressesError;

      setCustomerOrders(orders || []);
      setCustomerAddresses(addresses || []);

      // Calculate stats
      const totalOrders = orders?.length || 0;
      const totalSpent = orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
      const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

      setCustomerStats({ totalOrders, totalSpent, avgOrderValue });
    } catch (error) {
      console.error("Error fetching customer details:", error);
      toast.error("Failed to fetch customer details");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "processing":
        return "bg-blue-100 text-blue-700";
      case "shipped":
        return "bg-purple-100 text-purple-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery)
  );

  return (
    <>
      <Helmet>
        <title>Customers | Admin Dashboard</title>
      </Helmet>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Customers</h1>
              <p className="text-muted-foreground">View and manage customer information</p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Users className="mr-2 h-4 w-4" />
              {customers.length} Customers
            </Badge>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Customers</CardTitle>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  {searchQuery ? "No customers found matching your search." : "No customers yet."}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                              {customer.avatar_url ? (
                                <img
                                  src={customer.avatar_url}
                                  alt={customer.full_name || "Customer"}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-medium text-muted-foreground">
                                  {customer.full_name?.charAt(0)?.toUpperCase() || customer.email.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <span className="font-medium">
                              {customer.full_name || "Unnamed Customer"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {customer.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {customer.phone ? (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              {customer.phone}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(customer.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewCustomerDetails(customer)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Customer Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Customer Details</DialogTitle>
            </DialogHeader>
            {selectedCustomer && (
              <div className="space-y-6">
                {/* Customer Info Header */}
                <div className="flex items-center gap-4 pb-4 border-b">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {selectedCustomer.avatar_url ? (
                      <img
                        src={selectedCustomer.avatar_url}
                        alt={selectedCustomer.full_name || "Customer"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-medium text-muted-foreground">
                        {selectedCustomer.full_name?.charAt(0)?.toUpperCase() || selectedCustomer.email.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">
                      {selectedCustomer.full_name || "Unnamed Customer"}
                    </h3>
                    <p className="text-muted-foreground">{selectedCustomer.email}</p>
                    {selectedCustomer.phone && (
                      <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Customer since</p>
                    <p className="font-medium">{new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <ShoppingBag className="h-8 w-8 text-primary" />
                        <div>
                          <p className="text-2xl font-bold">{customerStats.totalOrders}</p>
                          <p className="text-sm text-muted-foreground">Total Orders</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-green-700 font-bold">₹</span>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">₹{customerStats.totalSpent.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">Total Spent</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-700 font-bold">≈</span>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">₹{Math.round(customerStats.avgOrderValue).toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">Avg. Order Value</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tabs for Orders and Addresses */}
                <Tabs defaultValue="orders">
                  <TabsList>
                    <TabsTrigger value="orders">Orders ({customerOrders.length})</TabsTrigger>
                    <TabsTrigger value="addresses">Addresses ({customerAddresses.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="orders">
                    <ScrollArea className="h-[250px]">
                      {isLoadingDetails ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : customerOrders.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No orders yet</p>
                      ) : (
                        <div className="space-y-3">
                          {customerOrders.map((order) => (
                            <div
                              key={order.id}
                              className="flex items-center justify-between rounded-lg border p-4"
                            >
                              <div>
                                <p className="font-medium">{order.order_number}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right flex items-center gap-4">
                                <div>
                                  <p className="font-medium">₹{Number(order.total).toLocaleString()}</p>
                                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${getStatusColor(order.status)}`}>
                                    {order.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="addresses">
                    <ScrollArea className="h-[250px]">
                      {isLoadingDetails ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : customerAddresses.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No saved addresses</p>
                      ) : (
                        <div className="space-y-3">
                          {customerAddresses.map((address) => (
                            <div
                              key={address.id}
                              className="rounded-lg border p-4"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium">{address.full_name}</p>
                                      <Badge variant="outline" className="text-xs">{address.label}</Badge>
                                      {address.is_default && (
                                        <Badge className="text-xs">Default</Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {address.address_line1}
                                      {address.address_line2 && `, ${address.address_line2}`}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {address.city}, {address.state} {address.postal_code}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      Phone: {address.phone}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </>
  );
};

export default Customers;
