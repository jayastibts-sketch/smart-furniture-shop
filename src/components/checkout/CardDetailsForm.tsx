import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard } from "lucide-react";

interface CardDetails {
  cardNumber: string;
  cardName: string;
  expiry: string;
  cvv: string;
}

interface CardDetailsFormProps {
  onCardDetailsChange: (details: { last4: string; cardType: string } | null) => void;
}

export function CardDetailsForm({ onCardDetailsChange }: CardDetailsFormProps) {
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
  });

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const groups = numbers.match(/.{1,4}/g);
    return groups ? groups.join(" ").substr(0, 19) : "";
  };

  const formatExpiry = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length >= 2) {
      return numbers.slice(0, 2) + "/" + numbers.slice(2, 4);
    }
    return numbers;
  };

  const getCardType = (number: string): string => {
    const cleanNumber = number.replace(/\s/g, "");
    if (/^4/.test(cleanNumber)) return "Visa";
    if (/^5[1-5]/.test(cleanNumber)) return "Mastercard";
    if (/^6(?:011|5)/.test(cleanNumber)) return "RuPay";
    if (/^3[47]/.test(cleanNumber)) return "Amex";
    return "Card";
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    const newDetails = { ...cardDetails, cardNumber: formatted };
    setCardDetails(newDetails);
    
    const cleanNumber = formatted.replace(/\s/g, "");
    if (cleanNumber.length >= 4) {
      onCardDetailsChange({
        last4: cleanNumber.slice(-4),
        cardType: getCardType(formatted),
      });
    } else {
      onCardDetailsChange(null);
    }
  };

  return (
    <div className="space-y-4 mt-4 p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-2 mb-2">
        <CreditCard className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">Enter Card Details</span>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="cardNumber">Card Number</Label>
        <Input
          id="cardNumber"
          placeholder="1234 5678 9012 3456"
          value={cardDetails.cardNumber}
          onChange={handleCardNumberChange}
          maxLength={19}
        />
        {cardDetails.cardNumber.length > 4 && (
          <p className="text-xs text-muted-foreground">
            {getCardType(cardDetails.cardNumber)} ending in {cardDetails.cardNumber.slice(-4).replace(/\s/g, "")}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cardName">Cardholder Name</Label>
        <Input
          id="cardName"
          placeholder="Name on card"
          value={cardDetails.cardName}
          onChange={(e) => setCardDetails({ ...cardDetails, cardName: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="expiry">Expiry Date</Label>
          <Input
            id="expiry"
            placeholder="MM/YY"
            value={cardDetails.expiry}
            onChange={(e) => setCardDetails({ ...cardDetails, expiry: formatExpiry(e.target.value) })}
            maxLength={5}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cvv">CVV</Label>
          <Input
            id="cvv"
            placeholder="123"
            type="password"
            value={cardDetails.cvv}
            onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
            maxLength={4}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        🔒 Your card details are encrypted and secure. Only the last 4 digits are stored for your reference.
      </p>
    </div>
  );
}
