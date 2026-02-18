import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";

interface CancelOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber: string;
  total: number;
  paymentStatus: string;
  onCancelled: () => void;
}

const cancellationReasons = [
  "Changed my mind",
  "Found a better price elsewhere",
  "Ordered by mistake",
  "Delivery time too long",
  "Other",
];

export function CancelOrderDialog({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  total,
  paymentStatus,
  onCancelled,
}: CancelOrderDialogProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    const reason = selectedReason === "Other" ? otherReason : selectedReason;
    
    if (!reason.trim()) {
      toast.error("Please select or provide a cancellation reason");
      return;
    }

    setIsCancelling(true);
    try {
      const updateData: Record<string, any> = {
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
      };

      // If payment was already made, initiate refund request
      if (paymentStatus === "paid") {
        updateData.refund_status = "pending";
        updateData.refund_requested_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId);

      if (error) throw error;

      toast.success(
        paymentStatus === "paid"
          ? "Order cancelled. Refund request submitted."
          : "Order cancelled successfully."
      );
      onOpenChange(false);
      onCancelled();
    } catch (error: any) {
      console.error("Error cancelling order:", error);
      toast.error(error.message || "Failed to cancel order");
    } finally {
      setIsCancelling(false);
    }
  };

  const resetForm = () => {
    setSelectedReason("");
    setOtherReason("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetForm();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Cancel Order
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel order <strong>{orderNumber}</strong>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {paymentStatus === "paid" && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Refund Note:</strong> A refund of ₹{total.toLocaleString()} will be
                initiated after cancellation. It may take 5-7 business days to process.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Label>Why are you cancelling this order?</Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {cancellationReasons.map((reason) => (
                <div key={reason} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason} id={reason} />
                  <Label htmlFor={reason} className="font-normal cursor-pointer">
                    {reason}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {selectedReason === "Other" && (
            <div className="space-y-2">
              <Label htmlFor="otherReason">Please specify</Label>
              <Textarea
                id="otherReason"
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                placeholder="Tell us why you want to cancel..."
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCancelling}
          >
            Keep Order
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isCancelling || !selectedReason}
          >
            {isCancelling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cancelling...
              </>
            ) : (
              "Cancel Order"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
