import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  CreditCard,
  Smartphone,
  Banknote,
  Edit2,
  Package,
  Loader2,
  Check,
  Truck,
} from "lucide-react";
import { SelectedAddress, PaymentMethod, CardPaymentDetails } from "@/pages/Checkout";
import { CartItem } from "@/store/useStore";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatINR } from "@/lib/utils";
import { addDays, format } from "date-fns";

interface ReviewStepProps {
  address: SelectedAddress;
  paymentMethod: PaymentMethod;
  cardDetails?: CardPaymentDetails | null;
  notes: string;
  onNotesChange: (notes: string) => void;
  onEdit: (step: number) => void;
  onConfirm: (orderId: string, orderNumber: string) => void;
  cart: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
}

const paymentLabels: Record<PaymentMethod, { label: string; icon: React.ElementType }> = {
  upi: { label: "UPI Payment", icon: Smartphone },
  card: { label: "Credit/Debit Card", icon: CreditCard },
  cod: { label: "Cash on Delivery", icon: Banknote },
};

// Category-based shipping days
const getCategoryShippingDays = (category: string): number => {
  const shippingDaysMap: Record<string, number> = {
    living: 8,
    bedroom: 10,
    dining: 12,
    office: 7,
  };
  return shippingDaysMap[category] || 7;
};

export function ReviewStep({
  address,
  paymentMethod,
  cardDetails,
  notes,
  onNotesChange,
  onEdit,
  onConfirm,
  cart,
  subtotal,
  shipping,
  total,
}: ReviewStepProps) {
  const { user } = useAuth();
  const [placing, setPlacing] = useState(false);
  const PaymentIcon = paymentLabels[paymentMethod].icon;

  // Calculate max shipping days based on cart items
  const maxShippingDays = Math.max(
    ...cart.map((item) => getCategoryShippingDays(item.product.category))
  );
  const expectedDeliveryDate = addDays(new Date(), maxShippingDays);

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error("Please login to place order");
      return;
    }

    setPlacing(true);
    try {
      // Create order
      const shippingAddressJson = {
        full_name: address.full_name,
        phone: address.phone,
        address_line1: address.address_line1,
        address_line2: address.address_line2 || "",
        city: address.city,
        state: address.state,
        postal_code: address.postal_code,
        country: address.country,
        label: address.label,
      };

      const orderData: Record<string, any> = {
        user_id: user.id,
        subtotal,
        shipping_cost: shipping,
        total,
        discount: 0,
        status: "pending",
        payment_status: "pending",
        payment_method: paymentMethod,
        shipping_address: shippingAddressJson,
        notes: notes || null,
        expected_delivery_date: format(expectedDeliveryDate, "yyyy-MM-dd"),
      };

      // Add card details if payment method is card
      if (paymentMethod === "card" && cardDetails) {
        orderData.card_last4 = cardDetails.last4;
        orderData.card_type = cardDetails.cardType;
      }

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert(orderData as any)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_image: item.product.image,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Simulate payment processing for UPI/Card
      if (paymentMethod !== "cod") {
        // In a real app, you would integrate with payment gateway here
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        // Update payment status to paid (simulated)
        await supabase
          .from("orders")
          .update({ payment_status: "paid" })
          .eq("id", order.id);
      }

      toast.success("Order placed successfully!");
      onConfirm(order.id, order.order_number);
    } catch (error: any) {
      console.error("Error placing order:", error);
      toast.error(error.message || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <Card variant="elevated" className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Package className="h-6 w-6 text-primary" />
        <h2 className="font-display text-xl font-semibold">Review Order</h2>
      </div>

      {/* Delivery Address */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">Delivery Address</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onEdit(1)}>
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="font-medium">{address.full_name}</p>
          <p className="text-sm text-muted-foreground">
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

      {/* Expected Delivery */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Truck className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">Expected Delivery</h3>
        </div>
        <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
          <p className="font-medium text-primary">
            {format(expectedDeliveryDate, "EEEE, MMMM d, yyyy")}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Estimated delivery within {maxShippingDays} days
          </p>
        </div>
      </div>

      {/* Payment Method */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">Payment Method</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onEdit(2)}>
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <PaymentIcon className="h-5 w-5 text-primary" />
            <span>{paymentLabels[paymentMethod].label}</span>
          </div>
          {paymentMethod === "card" && cardDetails && (
            <p className="text-sm text-muted-foreground mt-2">
              {cardDetails.cardType} ending in •••• {cardDetails.last4}
            </p>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div className="mb-6">
        <h3 className="font-medium mb-3">Order Items ({cart.length})</h3>
        <div className="space-y-3">
          {cart.map((item) => (
            <div key={item.product.id} className="flex gap-3">
              <img
                src={item.product.image}
                alt={item.product.name}
                className="w-16 h-16 object-cover rounded"
              />
              <div className="flex-1">
                <p className="font-medium">{item.product.name}</p>
                <p className="text-sm text-muted-foreground">
                  {item.product.color} • Qty: {item.quantity}
                </p>
              </div>
              <p className="font-medium">
                {formatINR(item.product.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Order Notes */}
      <div className="mb-6">
        <h3 className="font-medium mb-3">Order Notes (Optional)</h3>
        <Textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Any special instructions for delivery..."
          rows={3}
        />
      </div>

      <Separator className="my-6" />

      {/* Price Summary */}
      <div className="space-y-2 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatINR(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Shipping</span>
          <span>{shipping === 0 ? "Free" : formatINR(shipping)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg pt-2 border-t">
          <span>Total</span>
          <span>{formatINR(total)}</span>
        </div>
      </div>

      <Button
        variant="hero"
        size="lg"
        className="w-full"
        onClick={handlePlaceOrder}
        disabled={placing}
      >
        {placing ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            {paymentMethod === "cod" ? "Placing Order..." : "Processing Payment..."}
          </>
        ) : (
          <>
            <Check className="h-5 w-5 mr-2" />
            {paymentMethod === "cod"
              ? `Place Order - ${formatINR(total)}`
              : `Pay ${formatINR(total)}`}
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center mt-4">
        By placing this order, you agree to our Terms of Service and Privacy Policy
      </p>
    </Card>
  );
}
