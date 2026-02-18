import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import ModeratorLayout from "@/components/moderator/ModeratorLayout";
import { Card, CardContent } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activityLogger";
import { Search, Eye, ShoppingCart, Package } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface OrderWithProfile {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  payment_status: string;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  shipping_address: any;
  notes: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    email: string;
    full_name: string | null;
  };
}

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string | null;
  price: number;
  quantity: number;
}

const ModeratorOrders = () => {
  const [orders, setOrders] = useState<OrderWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithProfile | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch profiles
      const userIds = [...new Set((ordersData || []).map(o => o.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .in("user_id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

      const ordersWithProfiles = (ordersData || []).map(order => ({
        ...order,
        profile: profilesMap.get(order.user_id),
      }));

      setOrders(ordersWithProfiles);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
    } finally {
      setIsLoading(false);
    }
  };

  const viewOrderDetails = async (order: OrderWithProfile) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);

    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);

    if (error) {
      console.error("Error fetching order items:", error);
      toast.error("Failed to fetch order items");
    } else {
      setOrderItems(data || []);
    }
  };

  const sendStatusEmail = async (order: OrderWithProfile, newStatus: string) => {
    try {
      const response = await supabase.functions.invoke("send-order-status-email", {
        body: {
          orderNumber: order.order_number,
          newStatus: newStatus,
        },
      });

      if (response.error) {
        console.error("Email send error:", response.error);
      } else {
        toast.success("Email notification sent to customer");
      }
    } catch (error) {
      console.error("Failed to send email:", error);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const oldStatus = order.status;

    try {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);

      if (error) throw error;

      // Log activity
      await logActivity({
        action: `Updated order status`,
        entityType: "order",
        entityId: order.order_number,
        details: {
          old_value: oldStatus,
          new_value: status,
        },
      });

      toast.success("Order status updated");

      // Send email notification
      if (["processing", "shipped", "delivered", "cancelled"].includes(status)) {
        await sendStatusEmail(order, status);
      }

      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order status");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      pending: { variant: "secondary", className: "bg-yellow-100 text-yellow-800" },
      processing: { variant: "secondary", className: "bg-blue-100 text-blue-800" },
      shipped: { variant: "secondary", className: "bg-purple-100 text-purple-800" },
      delivered: { variant: "secondary", className: "bg-green-100 text-green-800" },
      cancelled: { variant: "destructive", className: "" },
    };
    const config = variants[status] || { variant: "outline" as const, className: "" };
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      pending: { variant: "secondary", className: "bg-yellow-100 text-yellow-800" },
      paid: { variant: "secondary", className: "bg-green-100 text-green-800" },
      failed: { variant: "destructive", className: "" },
      refunded: { variant: "secondary", className: "bg-gray-100 text-gray-800" },
    };
    const config = variants[status] || { variant: "outline" as const, className: "" };
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <ModeratorLayout>
      <Helmet>
        <title>Manage Orders | Moderator</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Orders</h1>
            <p className="text-muted-foreground mt-1">
              View and update order status
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <ShoppingCart className="h-4 w-4 mr-2" />
            {orders.length} Orders
          </Badge>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by order number, customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.profile?.full_name || "N/A"}</p>
                          <p className="text-sm text-muted-foreground">{order.profile?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(order.created_at), "MMM dd, yyyy")}</TableCell>
                      <TableCell>₹{order.total.toLocaleString()}</TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) => updateOrderStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{getPaymentBadge(order.payment_status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewOrderDetails(order)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order {selectedOrder?.order_number}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Customer</h4>
                  <p>{selectedOrder.profile?.full_name || "N/A"}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.profile?.email}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Shipping Address</h4>
                  <p className="text-sm">
                    {selectedOrder.shipping_address?.full_name}<br />
                    {selectedOrder.shipping_address?.address_line1}<br />
                    {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state} {selectedOrder.shipping_address?.postal_code}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold mb-3">Order Items</h4>
                <div className="space-y-3">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 rounded-lg border p-3">
                      {item.product_image && (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="h-12 w-12 rounded object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="rounded-lg bg-muted p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{selectedOrder.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>₹{selectedOrder.shipping_cost.toLocaleString()}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₹{selectedOrder.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span>₹{selectedOrder.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ModeratorLayout>
  );
};

export default ModeratorOrders;
