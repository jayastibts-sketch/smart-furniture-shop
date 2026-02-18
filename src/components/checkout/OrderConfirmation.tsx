import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CheckCircle,
  Package,
  MapPin,
  CreditCard,
  Smartphone,
  Banknote,
  ArrowRight,
  FileText,
} from "lucide-react";
import { SelectedAddress, PaymentMethod } from "@/pages/Checkout";
import { motion } from "framer-motion";
import { formatINR } from "@/lib/utils";

interface OrderConfirmationProps {
  orderId: string;
  orderNumber: string;
  address: SelectedAddress;
  paymentMethod: PaymentMethod;
  total: number;
}

const paymentLabels: Record<PaymentMethod, { label: string; icon: React.ElementType }> = {
  upi: { label: "UPI Payment", icon: Smartphone },
  card: { label: "Credit/Debit Card", icon: CreditCard },
  cod: { label: "Cash on Delivery", icon: Banknote },
};

export function OrderConfirmation({
  orderId,
  orderNumber,
  address,
  paymentMethod,
  total,
}: OrderConfirmationProps) {
  const PaymentIcon = paymentLabels[paymentMethod].icon;

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          Order Confirmed!
        </h1>
        <p className="text-muted-foreground">
          Thank you for your purchase. Your order has been placed successfully.
        </p>
      </motion.div>

      <Card variant="elevated" className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Order Number</p>
            <p className="font-display text-xl font-bold">{orderNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="font-display text-xl font-bold text-primary">
              {formatINR(total)}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium">Delivery Address</span>
            </div>
            <p className="text-sm">{address.full_name}</p>
            <p className="text-sm text-muted-foreground">
              {address.address_line1}
              {address.address_line2 && `, ${address.address_line2}`}
            </p>
            <p className="text-sm text-muted-foreground">
              {address.city}, {address.state} {address.postal_code}
            </p>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <PaymentIcon className="h-4 w-4 text-primary" />
              <span className="font-medium">Payment Method</span>
            </div>
            <p className="text-sm">{paymentLabels[paymentMethod].label}</p>
            <p className="text-sm text-muted-foreground">
              {paymentMethod === "cod"
                ? "Pay when delivered"
                : "Payment successful"}
            </p>
          </div>
        </div>
      </Card>

      <Card variant="elevated" className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Package className="h-5 w-5 text-primary" />
          <h3 className="font-medium">What's Next?</h3>
        </div>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
              1
            </span>
            <div>
              <p className="font-medium">Order Processing</p>
              <p className="text-sm text-muted-foreground">
                We're preparing your items for shipment
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
              2
            </span>
            <div>
              <p className="font-medium">Shipping Updates</p>
              <p className="text-sm text-muted-foreground">
                You'll receive email updates about your shipment
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
              3
            </span>
            <div>
              <p className="font-medium">Delivery</p>
              <p className="text-sm text-muted-foreground">
                Expected delivery within 5-7 business days
              </p>
            </div>
          </li>
        </ul>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button variant="outline" className="flex-1" asChild>
          <Link to="/profile">
            <FileText className="h-4 w-4 mr-2" />
            View Order Details
          </Link>
        </Button>
        <Button variant="hero" className="flex-1" asChild>
          <Link to="/products">
            Continue Shopping
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
