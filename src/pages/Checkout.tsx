import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { useStore } from "@/store/useStore";
import { useAuth } from "@/contexts/AuthContext";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { AddressStep } from "@/components/checkout/AddressStep";
import { PaymentStep } from "@/components/checkout/PaymentStep";
import { ReviewStep } from "@/components/checkout/ReviewStep";
import { OrderConfirmation } from "@/components/checkout/OrderConfirmation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { formatINR } from "@/lib/utils";

export interface SelectedAddress {
  id?: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  label: string;
}

export type PaymentMethod = "upi" | "card" | "cod";

export interface CardPaymentDetails {
  last4: string;
  cardType: string;
}

export interface OrderData {
  address: SelectedAddress;
  paymentMethod: PaymentMethod;
  cardDetails?: CardPaymentDetails;
  notes?: string;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart } = useStore();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState<SelectedAddress | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [cardDetails, setCardDetails] = useState<CardPaymentDetails | null>(null);
  const [orderNotes, setOrderNotes] = useState("");
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const subtotal = getCartTotal();
  const shipping = 0;
  const total = subtotal + shipping;

  useEffect(() => {
    if (!user) {
      navigate("/auth?redirect=/checkout");
    }
  }, [user, navigate]);

  if (cart.length === 0 && !orderConfirmed) {
    return (
      <>
        <Helmet>
          <title>Checkout | Furnish</title>
        </Helmet>
        <Layout>
          <div className="container mx-auto px-4 py-16 text-center">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
            <h1 className="font-display text-3xl font-bold text-foreground mb-4">
              Your Cart is Empty
            </h1>
            <p className="text-muted-foreground mb-8">
              Add some items to your cart before checking out.
            </p>
            <Button variant="hero" size="lg" asChild>
              <Link to="/products">Browse Products</Link>
            </Button>
          </div>
        </Layout>
      </>
    );
  }

  if (orderConfirmed && orderId && orderNumber) {
    return (
      <>
        <Helmet>
          <title>Order Confirmed | Furnish</title>
        </Helmet>
        <Layout>
          <OrderConfirmation
            orderId={orderId}
            orderNumber={orderNumber}
            address={selectedAddress!}
            paymentMethod={paymentMethod!}
            total={total}
          />
        </Layout>
      </>
    );
  }

  const handleAddressSelect = (address: SelectedAddress) => {
    setSelectedAddress(address);
    setCurrentStep(2);
  };

  const handlePaymentSelect = (method: PaymentMethod, card?: CardPaymentDetails) => {
    setPaymentMethod(method);
    if (card) {
      setCardDetails(card);
    }
    setCurrentStep(3);
  };

  const handleOrderComplete = (id: string, number: string) => {
    setOrderId(id);
    setOrderNumber(number);
    setOrderConfirmed(true);
    clearCart();
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate("/cart");
    }
  };

  return (
    <>
      <Helmet>
        <title>Checkout | Furnish</title>
      </Helmet>
      <Layout>
        <div className="container mx-auto px-4 py-8 md:py-12">
          <Button
            variant="ghost"
            onClick={goBack}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {currentStep === 1 ? "Back to Cart" : "Back"}
          </Button>

          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-8">
            Checkout
          </h1>

          <CheckoutSteps currentStep={currentStep} />

          <div className="grid lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2">
              {currentStep === 1 && (
                <AddressStep
                  selectedAddress={selectedAddress}
                  onSelect={handleAddressSelect}
                />
              )}
              {currentStep === 2 && (
                <PaymentStep
                  selectedMethod={paymentMethod}
                  onSelect={handlePaymentSelect}
                />
              )}
              {currentStep === 3 && selectedAddress && paymentMethod && (
                <ReviewStep
                  address={selectedAddress}
                  paymentMethod={paymentMethod}
                  cardDetails={cardDetails}
                  notes={orderNotes}
                  onNotesChange={setOrderNotes}
                  onEdit={(step) => setCurrentStep(step)}
                  onConfirm={handleOrderComplete}
                  cart={cart}
                  subtotal={subtotal}
                  shipping={shipping}
                  total={total}
                />
              )}
            </div>

            {/* Order Summary */}
            <div>
              <Card variant="elevated" className="p-6 sticky top-32">
                <h2 className="font-display text-xl font-semibold mb-4">
                  Order Summary
                </h2>

                <div className="space-y-3 mb-4">
                  {cart.slice(0, 3).map((item) => (
                    <div key={item.product.id} className="flex gap-3">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        {formatINR(item.product.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                  {cart.length > 3 && (
                    <p className="text-sm text-muted-foreground">
                      +{cart.length - 3} more items
                    </p>
                  )}
                </div>

                <div className="border-t pt-4 space-y-2">
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
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
