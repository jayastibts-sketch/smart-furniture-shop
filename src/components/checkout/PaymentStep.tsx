import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Smartphone, Banknote, Shield } from "lucide-react";
import { PaymentMethod } from "@/pages/Checkout";
import { cn } from "@/lib/utils";
import { CardDetailsForm } from "./CardDetailsForm";

interface PaymentStepProps {
  selectedMethod: PaymentMethod | null;
  onSelect: (method: PaymentMethod, cardDetails?: { last4: string; cardType: string }) => void;
}

const paymentMethods = [
  {
    id: "upi" as const,
    name: "UPI",
    description: "Pay using Google Pay, PhonePe, Paytm, or any UPI app",
    icon: Smartphone,
    badge: "Instant",
  },
  {
    id: "card" as const,
    name: "Credit/Debit Card",
    description: "Pay securely with Visa, Mastercard, or RuPay",
    icon: CreditCard,
    badge: "Secure",
  },
  {
    id: "cod" as const,
    name: "Cash on Delivery",
    description: "Pay when your order is delivered",
    icon: Banknote,
    badge: null,
  },
];

export function PaymentStep({ selectedMethod, onSelect }: PaymentStepProps) {
  const [selected, setSelected] = useState<PaymentMethod | null>(selectedMethod);
  const [cardDetails, setCardDetails] = useState<{ last4: string; cardType: string } | null>(null);

  const handleContinue = () => {
    if (selected) {
      if (selected === "card" && cardDetails) {
        onSelect(selected, cardDetails);
      } else {
        onSelect(selected);
      }
    }
  };

  return (
    <Card variant="elevated" className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="h-6 w-6 text-primary" />
        <h2 className="font-display text-xl font-semibold">Payment Method</h2>
      </div>

      <RadioGroup
        value={selected || ""}
        onValueChange={(value) => setSelected(value as PaymentMethod)}
        className="space-y-3"
      >
        {paymentMethods.map((method) => (
          <label
            key={method.id}
            className={cn(
              "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
              selected === method.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <RadioGroupItem value={method.id} className="mt-1" />
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                selected === method.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <method.icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{method.name}</span>
                {method.badge && (
                  <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded">
                    {method.badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {method.description}
              </p>
            </div>
          </label>
        ))}
      </RadioGroup>

      {selected === "upi" && (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            You'll be redirected to complete payment via your preferred UPI app after placing the order.
          </p>
        </div>
      )}

      {selected === "card" && (
        <CardDetailsForm onCardDetailsChange={setCardDetails} />
      )}

      {selected === "cod" && (
        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Cash on Delivery is available for this order. Please keep exact change ready at the time of delivery.
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 mt-6 text-sm text-muted-foreground">
        <Shield className="h-4 w-4" />
        <span>Your payment information is secure and encrypted</span>
      </div>

      <Button
        variant="hero"
        size="lg"
        className="w-full mt-6"
        onClick={handleContinue}
        disabled={!selected || (selected === "card" && !cardDetails)}
      >
        Continue to Review
      </Button>
    </Card>
  );
}
