import { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Package,
  Heart,
  Settings,
  LogOut,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  ShieldCheck,
  FileText,
  AlertTriangle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage, Language, languageLabels } from "@/contexts/LanguageContext";
import { useTheme } from "next-themes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sun, Moon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { generateInvoicePDF } from "@/lib/invoiceGenerator";
import { CancelOrderDialog } from "@/components/orders/CancelOrderDialog";
import { format } from "date-fns";
const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
});

const addressSchema = z.object({
  label: z.string().min(1, "Label is required"),
  full_name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Phone is required"),
  address_line1: z.string().min(5, "Address is required"),
  address_line2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postal_code: z.string().min(5, "Postal code is required"),
  country: z.string().default("India"),
  is_default: z.boolean().default(false),
});

type ProfileForm = z.infer<typeof profileSchema>;
type AddressForm = z.infer<typeof addressSchema>;

interface Address {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  created_at: string;
  payment_method: string | null;
  invoice_number: string | null;
  expected_delivery_date: string | null;
  delivery_delay_message: string | null;
  shipping_address: any;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  refund_status: string | null;
  order_items: { product_name: string; quantity: number; price: number }[];
}

export default function Profile() {
  const { user, profile, roles, isLoading, isAdmin, signOut, updateProfile } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const { toast } = useToast();
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Load preferences from DB on mount
  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("theme, language")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            if (data.theme) setTheme(data.theme);
            if (data.language) setLanguage(data.language as Language);
          }
        });
    }
  }, [user]);

  const savePreferences = async (newTheme?: string, newLang?: string) => {
    if (!user) return;
    setSavingPrefs(true);
    const updates: Record<string, string> = {};
    if (newTheme) updates.theme = newTheme;
    if (newLang) updates.language = newLang;
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id);
    setSavingPrefs(false);
    if (error) {
      toast({ title: "Failed to save preferences", variant: "destructive" });
    }
  };

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || "",
      phone: profile?.phone || "",
    },
  });

  const addressForm = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: "Home",
      full_name: "",
      phone: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "India",
      is_default: false,
    },
  });

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      fetchAddresses();
      fetchOrders();
    }
  }, [user]);

  const fetchAddresses = async () => {
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .order("is_default", { ascending: false });

    if (!error && data) {
      setAddresses(data);
    }
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        payment_status,
        total,
        subtotal,
        shipping_cost,
        discount,
        created_at,
        payment_method,
        invoice_number,
        expected_delivery_date,
        delivery_delay_message,
        shipping_address,
        cancelled_at,
        cancellation_reason,
        refund_status,
        order_items (product_name, quantity, price)
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
  };

  const handleProfileUpdate = async (data: ProfileForm) => {
    setIsSaving(true);
    try {
      await updateProfile(data);
    } catch (error) {
      // Error handled in context
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddressSubmit = async (data: AddressForm) => {
    setIsSaving(true);
    try {
      if (editingAddress) {
        const { error } = await supabase
          .from("addresses")
          .update(data)
          .eq("id", editingAddress.id);

        if (error) throw error;
        toast({ title: "Address updated successfully" });
      } else {
        const { error } = await supabase
          .from("addresses")
          .insert([{ 
            label: data.label,
            full_name: data.full_name,
            phone: data.phone,
            address_line1: data.address_line1,
            address_line2: data.address_line2 || null,
            city: data.city,
            state: data.state,
            postal_code: data.postal_code,
            country: data.country,
            is_default: data.is_default,
            user_id: user!.id 
          }]);

        if (error) throw error;
        toast({ title: "Address added successfully" });
      }

      setIsAddressDialogOpen(false);
      setEditingAddress(null);
      addressForm.reset();
      fetchAddresses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    const { error } = await supabase.from("addresses").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Address deleted" });
      fetchAddresses();
    }
  };

  const openEditAddress = (address: Address) => {
    setEditingAddress(address);
    addressForm.reset({
      label: address.label,
      full_name: address.full_name,
      phone: address.phone,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || "",
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      is_default: address.is_default,
    });
    setIsAddressDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "shipped":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "processing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleDownloadInvoice = (order: Order) => {
    if (!order.invoice_number || !profile) return;
    
    generateInvoicePDF({
      invoiceNumber: order.invoice_number,
      orderNumber: order.order_number,
      orderDate: order.created_at,
      customerName: order.shipping_address?.full_name || profile.full_name || "Customer",
      customerEmail: profile.email,
      shippingAddress: order.shipping_address,
      items: order.order_items.map(item => ({
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal: order.subtotal,
      shipping: order.shipping_cost,
      discount: order.discount,
      total: order.total,
      paymentMethod: order.payment_method || "N/A",
    });
  };

  return (
    <Layout>
      <Helmet>
        <title>My Profile | Furnish</title>
        <meta name="description" content="Manage your profile, orders, and addresses at Furnish." />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <UserIcon className="h-10 w-10 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold">
                  {profile?.full_name || "Welcome!"}
                </h1>
                {isAdmin && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    Admin
                  </Badge>
                )}
                {roles.map((r) => (
                  <Badge key={r.id} variant="outline" className="capitalize">
                    {r.role}
                  </Badge>
                ))}
              </div>
              <p className="text-muted-foreground">{profile?.email}</p>
            </div>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Link to="/wishlist">
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-3 p-4">
                  <Heart className="h-5 w-5 text-primary" />
                  <span className="font-medium">Wishlist</span>
                  <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
            <Link to="/cart">
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-3 p-4">
                  <Package className="h-5 w-5 text-primary" />
                  <span className="font-medium">Cart</span>
                  <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-3 p-4">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium">Addresses</span>
                <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </CardContent>
            </Card>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-3 p-4">
                <Settings className="h-5 w-5 text-primary" />
                <span className="font-medium">Settings</span>
                <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="addresses">Addresses</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input id="full_name" {...profileForm.register("full_name")} />
                        {profileForm.formState.errors.full_name && (
                          <p className="text-sm text-destructive">
                            {profileForm.formState.errors.full_name.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={profile?.email || ""} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" {...profileForm.register("phone")} />
                      </div>
                    </div>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                  <CardDescription>View and track your orders</CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No orders yet</p>
                      <Button asChild>
                        <Link to="/products">Start Shopping</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="border rounded-lg p-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                            <div>
                              <span className="font-medium">{order.order_number}</span>
                              <span className="text-muted-foreground text-sm ml-2">
                                {new Date(order.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </div>
                          
                          {/* Delay notification */}
                          {order.delivery_delay_message && (
                            <div className="flex items-start gap-2 mb-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
                              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                              <div className="text-sm">
                                <p className="font-medium text-amber-800 dark:text-amber-300">Delivery Update</p>
                                <p className="text-amber-700 dark:text-amber-400">{order.delivery_delay_message}</p>
                                {order.expected_delivery_date && (
                                  <p className="text-amber-600 dark:text-amber-500 mt-1">
                                    New expected date: {format(new Date(order.expected_delivery_date), "dd MMM yyyy")}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          
                          {/* Cancellation info */}
                          {order.status === "cancelled" && (
                            <div className="mb-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                              <div className="flex items-start gap-2">
                                <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                  <p className="font-medium text-destructive">Order Cancelled</p>
                                  {order.cancellation_reason && (
                                    <p className="text-muted-foreground">Reason: {order.cancellation_reason}</p>
                                  )}
                                  {order.refund_status && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <RefreshCw className="h-3 w-3" />
                                      <span className="capitalize">
                                        Refund: {order.refund_status}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap justify-between items-center gap-2">
                            <span className="font-medium">₹{order.total.toLocaleString()}</span>
                            <div className="flex flex-wrap gap-2">
                              {order.status === "pending" && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                  onClick={() => setCancellingOrder(order)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                              )}
                              {order.invoice_number && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDownloadInvoice(order)}
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  Invoice
                                </Button>
                              )}
                              <Button variant="outline" size="sm" asChild>
                                <Link to={`/order/${order.order_number}`}>
                                  Track Order
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="addresses">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Saved Addresses</CardTitle>
                    <CardDescription>Manage your delivery addresses</CardDescription>
                  </div>
                  <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setEditingAddress(null);
                          addressForm.reset();
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Address
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>
                          {editingAddress ? "Edit Address" : "Add New Address"}
                        </DialogTitle>
                        <DialogDescription>
                          {editingAddress
                            ? "Update your address details"
                            : "Add a new delivery address"}
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={addressForm.handleSubmit(handleAddressSubmit)}>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="label">Label</Label>
                              <Input id="label" placeholder="Home, Office, etc." {...addressForm.register("label")} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="addr-name">Full Name</Label>
                              <Input id="addr-name" {...addressForm.register("full_name")} />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="addr-phone">Phone</Label>
                            <Input id="addr-phone" {...addressForm.register("phone")} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="address_line1">Address Line 1</Label>
                            <Input id="address_line1" {...addressForm.register("address_line1")} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
                            <Input id="address_line2" {...addressForm.register("address_line2")} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="city">City</Label>
                              <Input id="city" {...addressForm.register("city")} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="state">State</Label>
                              <Input id="state" {...addressForm.register("state")} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="postal_code">Postal Code</Label>
                              <Input id="postal_code" {...addressForm.register("postal_code")} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="country">Country</Label>
                              <Input id="country" {...addressForm.register("country")} />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" disabled={isSaving}>
                            {isSaving ? "Saving..." : editingAddress ? "Update" : "Add Address"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {addresses.length === 0 ? (
                    <div className="text-center py-8">
                      <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No saved addresses</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {addresses.map((address) => (
                        <div key={address.id} className="border rounded-lg p-4 relative">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={address.is_default ? "default" : "outline"}>
                              {address.label}
                            </Badge>
                            {address.is_default && (
                              <Badge variant="secondary">Default</Badge>
                            )}
                          </div>
                          <p className="font-medium">{address.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {address.address_line1}
                            {address.address_line2 && `, ${address.address_line2}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {address.city}, {address.state} {address.postal_code}
                          </p>
                          <p className="text-sm text-muted-foreground">{address.phone}</p>
                          <div className="flex gap-2 mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditAddress(address)}
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAddress(address.id)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription>Manage your theme and language settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <div className="flex gap-3">
                      {[
                        { value: "light", label: "Light", icon: Sun },
                        { value: "dark", label: "Dark", icon: Moon },
                      ].map((opt) => (
                        <Button
                          key={opt.value}
                          variant={theme === opt.value ? "default" : "outline"}
                          className="flex items-center gap-2"
                          onClick={() => {
                            setTheme(opt.value);
                            savePreferences(opt.value, undefined);
                          }}
                          disabled={savingPrefs}
                        >
                          <opt.icon className="h-4 w-4" />
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select
                      value={language}
                      onValueChange={(val) => {
                        setLanguage(val as Language);
                        savePreferences(undefined, val);
                      }}
                    >
                      <SelectTrigger className="w-60">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(languageLabels) as [Language, string][]).map(([code, label]) => (
                          <SelectItem key={code} value={code}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Cancel Order Dialog */}
          {cancellingOrder && (
            <CancelOrderDialog
              open={!!cancellingOrder}
              onOpenChange={(open) => !open && setCancellingOrder(null)}
              orderId={cancellingOrder.id}
              orderNumber={cancellingOrder.order_number}
              total={cancellingOrder.total}
              paymentStatus={cancellingOrder.payment_status}
              onCancelled={() => {
                setCancellingOrder(null);
                fetchOrders();
              }}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}
