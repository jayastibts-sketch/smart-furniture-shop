import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, Package, Search, Filter, Mail, CalendarIcon, AlertTriangle, CreditCard, RefreshCw, XCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  total: number;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  shipping_address: any;
  created_at: string;
  notes: string | null;
  user_id: string;
  expected_delivery_date: string | null;
  delivery_delay_message: string | null;
  card_last4: string | null;
  card_type: string | null;
  invoice_number: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  refund_status: string | null;
  refund_requested_at: string | null;
}

interface OrderWithProfile extends Order {
  profile?: {
    email: string;
    full_name: string | null;
  };
}

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
}

const orderStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
const paymentStatuses = ["pending", "paid", "failed", "refunded"];
const refundStatuses = ["pending", "approved", "processed", "rejected"];

const Orders = () => {
  const [orders, setOrders] = useState<OrderWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithProfile | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [newDeliveryDate, setNewDeliveryDate] = useState<Date | undefined>();
  const [delayMessage, setDelayMessage] = useState("");

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch profiles for each order
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

  useEffect(() => {
    fetchOrders();
  }, []);

  const viewOrderDetails = async (order: OrderWithProfile) => {
    setSelectedOrder(order);
    try {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.id);

      if (error) throw error;
      setOrderItems(data || []);
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Error fetching order items:", error);
      toast.error("Failed to fetch order details");
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
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);

      if (error) throw error;
      toast.success("Order status updated");
      
      // Send email notification
      if (order && ["processing", "shipped", "delivered", "cancelled"].includes(status)) {
        await sendStatusEmail(order, status);
      }
      
      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order status");
    }
  };

  const updatePaymentStatus = async (orderId: string, paymentStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ payment_status: paymentStatus })
        .eq("id", orderId);

      if (error) throw error;
      toast.success("Payment status updated");
      fetchOrders();
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error("Failed to update payment status");
    }
  };

  const updateRefundStatus = async (orderId: string, refundStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ refund_status: refundStatus })
        .eq("id", orderId);

      if (error) throw error;
      toast.success(`Refund status updated to ${refundStatus}`);
      fetchOrders();
    } catch (error) {
      console.error("Error updating refund status:", error);
      toast.error("Failed to update refund status");
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      paid: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
      approved: "bg-blue-100 text-blue-800",
      processed: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const openDeliveryDialog = (order: OrderWithProfile) => {
    setSelectedOrder(order);
    setNewDeliveryDate(order.expected_delivery_date ? new Date(order.expected_delivery_date) : undefined);
    setDelayMessage(order.delivery_delay_message || "");
    setIsDeliveryDialogOpen(true);
  };

  const updateDeliveryDate = async () => {
    if (!selectedOrder || !newDeliveryDate) return;

    try {
      const { error } = await supabase
        .from("orders")
        .update({
          expected_delivery_date: format(newDeliveryDate, "yyyy-MM-dd"),
          delivery_delay_message: delayMessage || null,
        })
        .eq("id", selectedOrder.id);

      if (error) throw error;
      toast.success("Delivery date updated. Customer will see the notification.");
      setIsDeliveryDialogOpen(false);
      fetchOrders();
    } catch (error) {
      console.error("Error updating delivery date:", error);
      toast.error("Failed to update delivery date");
    }
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
    <>
      <Helmet>
        <title>Manage Orders | Admin Dashboard</title>
      </Helmet>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Orders</h1>
              <p className="text-muted-foreground">Manage customer orders</p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Package className="mr-2 h-4 w-4" />
              {orders.length} Orders
            </Badge>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  All Orders
                </CardTitle>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search orders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-full sm:w-48"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-36">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {orderStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          <span className="capitalize">{status}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Loading orders...</p>
              ) : filteredOrders.length === 0 ? (
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== "all" ? "No orders match your filters" : "No orders found"}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Refund</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id} className={order.status === "cancelled" ? "bg-destructive/5" : ""}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {order.status === "cancelled" && (
                              <XCircle className="h-4 w-4 text-destructive" />
                            )}
                            {order.order_number}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">{order.profile?.full_name || "N/A"}</p>
                            <p className="text-muted-foreground">{order.profile?.email || "N/A"}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(order.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>₹{Number(order.total).toLocaleString()}</TableCell>
                        <TableCell>
                          <Select
                            value={order.status}
                            onValueChange={(value) => updateOrderStatus(order.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {orderStatuses.map((status) => (
                                <SelectItem key={status} value={status}>
                                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${getStatusBadge(status)}`}>
                                    {status}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={order.payment_status}
                            onValueChange={(value) => updatePaymentStatus(order.id, value)}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {paymentStatuses.map((status) => (
                                <SelectItem key={status} value={status}>
                                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${getStatusBadge(status)}`}>
                                    {status}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {order.refund_status ? (
                            <Select
                              value={order.refund_status}
                              onValueChange={(value) => updateRefundStatus(order.id, value)}
                            >
                              <SelectTrigger className="w-28">
                                <RefreshCw className="h-3 w-3 mr-1" />
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {refundStatuses.map((status) => (
                                  <SelectItem key={status} value={status}>
                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${getStatusBadge(status)}`}>
                                      {status}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewOrderDetails(order)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeliveryDialog(order)}
                              title="Update delivery date"
                            >
                              <CalendarIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Order Details - {selectedOrder?.order_number}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Shipping Address</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{selectedOrder.shipping_address?.full_name}</p>
                      <p>{selectedOrder.shipping_address?.address_line1}</p>
                      {selectedOrder.shipping_address?.address_line2 && (
                        <p>{selectedOrder.shipping_address.address_line2}</p>
                      )}
                      <p>
                        {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state} - {selectedOrder.shipping_address?.postal_code}
                      </p>
                      <p>Phone: {selectedOrder.shipping_address?.phone}</p>
                    </div>
                  </div>
                <div>
                    <h4 className="font-medium mb-2">Order Summary</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span>₹{Number(selectedOrder.subtotal).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping:</span>
                        <span>₹{Number(selectedOrder.shipping_cost).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Discount:</span>
                        <span>-₹{Number(selectedOrder.discount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-medium pt-2 border-t">
                        <span>Total:</span>
                        <span>₹{Number(selectedOrder.total).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment & Delivery Info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Payment Details</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Method: {selectedOrder.payment_method || "N/A"}</p>
                      {selectedOrder.payment_method === "card" && selectedOrder.card_last4 && (
                        <p className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          {selectedOrder.card_type} •••• {selectedOrder.card_last4}
                        </p>
                      )}
                      <p>Invoice: {selectedOrder.invoice_number || "N/A"}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Delivery Info</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Expected: {selectedOrder.expected_delivery_date ? format(new Date(selectedOrder.expected_delivery_date), "dd MMM yyyy") : "Not set"}</p>
                      {selectedOrder.delivery_delay_message && (
                        <p className="text-amber-600 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {selectedOrder.delivery_delay_message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cancellation & Refund Info */}
                {selectedOrder.status === "cancelled" && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2 text-destructive">
                      <XCircle className="h-4 w-4" />
                      Cancellation Details
                    </h4>
                    <div className="text-sm space-y-1">
                      {selectedOrder.cancelled_at && (
                        <p>Cancelled: {format(new Date(selectedOrder.cancelled_at), "dd MMM yyyy 'at' h:mm a")}</p>
                      )}
                      {selectedOrder.cancellation_reason && (
                        <p>Reason: {selectedOrder.cancellation_reason}</p>
                      )}
                      {selectedOrder.refund_status && (
                        <div className="mt-2 pt-2 border-t border-destructive/20">
                          <p className="flex items-center gap-2">
                            <RefreshCw className="h-3 w-3" />
                            Refund Status: <span className={`capitalize font-medium ${getStatusBadge(selectedOrder.refund_status)} px-2 py-0.5 rounded-full text-xs`}>{selectedOrder.refund_status}</span>
                          </p>
                          {selectedOrder.refund_requested_at && (
                            <p className="text-muted-foreground mt-1">
                              Requested: {format(new Date(selectedOrder.refund_requested_at), "dd MMM yyyy")}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-3">Order Items</h4>
                  <div className="space-y-3">
                    {orderItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 rounded-lg border p-3">
                        {item.product_image && (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="h-16 w-16 rounded-md object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity} × ₹{Number(item.price).toLocaleString()}
                          </p>
                        </div>
                        <p className="font-medium">
                          ₹{(item.quantity * Number(item.price)).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <h4 className="font-medium mb-2">Notes</h4>
                    <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delivery Date Update Dialog */}
        <Dialog open={isDeliveryDialogOpen} onOpenChange={setIsDeliveryDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Delivery Date</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>New Expected Delivery Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newDeliveryDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newDeliveryDate ? format(newDeliveryDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newDeliveryDate}
                      onSelect={setNewDeliveryDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Delay Notification Message (Optional)</Label>
                <Textarea
                  placeholder="E.g., Due to high demand, your order is delayed by 2 days..."
                  value={delayMessage}
                  onChange={(e) => setDelayMessage(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  This message will be shown to the customer on their order tracking page.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsDeliveryDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={updateDeliveryDate} disabled={!newDeliveryDate} className="flex-1">
                  Update Delivery
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </>
  );
};

export default Orders;
