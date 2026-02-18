import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  ArrowLeft,
  XCircle,
  Loader2,
  ShoppingBag,
  AlertTriangle,
  CalendarDays,
} from "lucide-react";
import { format } from "date-fns";
import { CancelOrderDialog } from "@/components/orders/CancelOrderDialog";

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  shipping_address: any;
  created_at: string;
  updated_at: string;
  notes: string | null;
  expected_delivery_date: string | null;
  delivery_delay_message: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  refund_status: string | null;
}

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
}

const statusSteps = [
  { key: "pending", label: "Order Placed", icon: Clock },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
];

const OrderTracking = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderNumber || !user) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch order
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("order_number", orderNumber)
          .eq("user_id", user.id)
          .maybeSingle();

        if (orderError) throw orderError;

        if (!orderData) {
          setError("Order not found or you don't have permission to view it.");
          setIsLoading(false);
          return;
        }

        setOrder(orderData);

        // Fetch order items
        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", orderData.id);

        if (itemsError) throw itemsError;
        setOrderItems(itemsData || []);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderNumber, user]);

  const getStatusIndex = (status: string) => {
    if (status === "cancelled") return -1;
    return statusSteps.findIndex((step) => step.key === status);
  };

  const currentStatusIndex = order ? getStatusIndex(order.status) : -1;

  const getEstimatedDelivery = () => {
    if (!order) return null;
    const orderDate = new Date(order.created_at);
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(deliveryDate.getDate() + 5); // 5 days from order
    return deliveryDate.toLocaleDateString("en-IN", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  if (!user) {
    return (
      <>
        <Helmet>
          <title>Order Tracking | Furnish</title>
        </Helmet>
        <Layout>
          <div className="container mx-auto px-4 py-16 text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
            <h1 className="font-display text-3xl font-bold text-foreground mb-4">
              Sign In Required
            </h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Please sign in to view your order tracking details.
            </p>
            <Button asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </Layout>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>Order Tracking | Furnish</title>
        </Helmet>
        <Layout>
          <div className="container mx-auto px-4 py-16 text-center">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading order details...</p>
          </div>
        </Layout>
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Helmet>
          <title>Order Not Found | Furnish</title>
        </Helmet>
        <Layout>
          <div className="container mx-auto px-4 py-16 text-center">
            <XCircle className="h-16 w-16 mx-auto text-destructive mb-6" />
            <h1 className="font-display text-3xl font-bold text-foreground mb-4">
              Order Not Found
            </h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {error || "We couldn't find the order you're looking for."}
            </p>
            <Button asChild>
              <Link to="/profile?tab=orders">
                <ArrowLeft className="mr-2 h-4 w-4" />
                View All Orders
              </Link>
            </Button>
          </div>
        </Layout>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`Track Order ${order.order_number} | Furnish`}</title>
      </Helmet>
      <Layout>
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Header */}
          <div className="mb-8">
            <Link
              to="/profile?tab=orders"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Link>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                  Order {order.order_number}
                </h1>
                <p className="text-muted-foreground">
                  Placed on{" "}
                  {new Date(order.created_at).toLocaleDateString("en-IN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <Badge
                variant={order.status === "cancelled" ? "destructive" : "default"}
                className="text-sm px-4 py-1 w-fit"
              >
                {order.status === "cancelled" ? "Cancelled" : order.status}
              </Badge>
            </div>
          </div>

          {/* Delay Notification */}
          {order.delivery_delay_message && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-300">Delivery Update</p>
                  <p className="text-amber-700 dark:text-amber-400">{order.delivery_delay_message}</p>
                  {order.expected_delivery_date && (
                    <p className="text-sm text-amber-600 dark:text-amber-500 mt-2 flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" />
                      New expected date: {format(new Date(order.expected_delivery_date), "dd MMM yyyy")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Expected Delivery */}
          {order.expected_delivery_date && !order.delivery_delay_message && (
            <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-primary">Expected Delivery</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(order.expected_delivery_date), "EEEE, dd MMMM yyyy")}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status Timeline */}
              {order.status !== "cancelled" ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Tracking Status
                    </CardTitle>
                    {order.status !== "delivered" && (
                      <p className="text-sm text-muted-foreground">
                        Estimated Delivery: {getEstimatedDelivery()}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      {/* Progress Line */}
                      <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-muted" />
                      <div
                        className="absolute left-6 top-6 w-0.5 bg-primary transition-all duration-500"
                        style={{
                          height: `${Math.max(0, (currentStatusIndex / (statusSteps.length - 1)) * 100)}%`,
                          maxHeight: "calc(100% - 48px)",
                        }}
                      />

                      {/* Steps */}
                      <div className="space-y-8">
                        {statusSteps.map((step, index) => {
                          const isCompleted = index <= currentStatusIndex;
                          const isCurrent = index === currentStatusIndex;
                          const Icon = step.icon;

                          return (
                            <div key={step.key} className="relative flex items-start gap-4">
                              <div
                                className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${
                                  isCompleted
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-muted bg-background text-muted-foreground"
                                } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                              >
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="pt-2">
                                <p
                                  className={`font-medium ${
                                    isCompleted ? "text-foreground" : "text-muted-foreground"
                                  }`}
                                >
                                  {step.label}
                                </p>
                                {isCurrent && (
                                  <p className="text-sm text-primary">Current Status</p>
                                )}
                                {isCompleted && index < currentStatusIndex && (
                                  <p className="text-sm text-muted-foreground">Completed</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-destructive/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 flex-shrink-0">
                        <XCircle className="h-6 w-6 text-destructive" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-destructive">Order Cancelled</p>
                        {order.cancellation_reason && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Reason: {order.cancellation_reason}
                          </p>
                        )}
                        {order.refund_status && (
                          <div className="mt-3 p-3 bg-muted rounded-lg">
                            <p className="text-sm font-medium">Refund Status</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {order.refund_status === "pending" && "Your refund request is being processed."}
                              {order.refund_status === "approved" && "Your refund has been approved."}
                              {order.refund_status === "processed" && "Your refund has been processed successfully."}
                              {order.refund_status === "rejected" && "Your refund request was rejected. Contact support."}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Order Items ({orderItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orderItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 rounded-lg border p-4"
                      >
                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="h-20 w-20 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-muted">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity} × ₹{Number(item.price).toLocaleString()}
                          </p>
                        </div>
                        <p className="font-semibold">
                          ₹{(item.quantity * Number(item.price)).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-4 w-4" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{order.shipping_address?.full_name}</p>
                    <p className="text-muted-foreground">
                      {order.shipping_address?.address_line1}
                    </p>
                    {order.shipping_address?.address_line2 && (
                      <p className="text-muted-foreground">
                        {order.shipping_address.address_line2}
                      </p>
                    )}
                    <p className="text-muted-foreground">
                      {order.shipping_address?.city}, {order.shipping_address?.state} -{" "}
                      {order.shipping_address?.postal_code}
                    </p>
                    <div className="flex items-center gap-2 pt-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {order.shipping_address?.phone}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{Number(order.subtotal).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>
                        {Number(order.shipping_cost) === 0
                          ? "Free"
                          : `₹${Number(order.shipping_cost).toLocaleString()}`}
                      </span>
                    </div>
                    {Number(order.discount) > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-₹{Number(order.discount).toLocaleString()}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold text-base">
                      <span>Total</span>
                      <span>₹{Number(order.total).toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Payment</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge
                    variant={order.payment_status === "paid" ? "default" : "secondary"}
                  >
                    {order.payment_status}
                  </Badge>
                </CardContent>
              </Card>

              {/* Need Help */}
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm font-medium mb-2">Need Help?</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    If you have questions about your order, our support team is here to help.
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/contact">Contact Support</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Cancel Order Button - only for pending orders */}
              {order.status === "pending" && (
                <Card>
                  <CardContent className="pt-6">
                    <Button 
                      variant="outline" 
                      className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => setShowCancelDialog(true)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Order
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Cancel Order Dialog */}
        {order && (
          <CancelOrderDialog
            open={showCancelDialog}
            onOpenChange={setShowCancelDialog}
            orderId={order.id}
            orderNumber={order.order_number}
            total={order.total}
            paymentStatus={order.payment_status}
            onCancelled={() => {
              setShowCancelDialog(false);
              // Refresh order data
              window.location.reload();
            }}
          />
        )}
      </Layout>
    </>
  );
};

export default OrderTracking;
