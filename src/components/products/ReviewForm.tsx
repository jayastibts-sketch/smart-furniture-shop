import { useState, useEffect } from "react";
import { Star, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface ReviewFormProps {
  productId: string;
  onReviewSubmitted: () => void;
}

export function ReviewForm({ productId, onReviewSubmitted }: ReviewFormProps) {
  const { user, profile } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(true);

  // Check if user has purchased this product
  useEffect(() => {
    const checkPurchaseHistory = async () => {
      if (!user) {
        setCheckingPurchase(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("order_items")
          .select("id, order_id, orders!inner(user_id, status)")
          .eq("product_id", productId)
          .eq("orders.user_id", user.id)
          .in("orders.status", ["delivered", "shipped", "processing", "confirmed"]);

        if (!error && data && data.length > 0) {
          setHasPurchased(true);
        }
      } catch (err) {
        console.error("Error checking purchase history:", err);
      } finally {
        setCheckingPurchase(false);
      }
    };

    checkPurchaseHistory();
  }, [user, productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please sign in to submit a review");
      return;
    }

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a review title");
      return;
    }

    if (!comment.trim()) {
      toast.error("Please enter your review");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("reviews").insert({
        product_id: productId,
        user_id: user.id,
        user_name: profile?.full_name || user.email?.split("@")[0] || "Anonymous",
        rating,
        title: title.trim(),
        comment: comment.trim(),
        verified: hasPurchased, // Automatically set based on purchase history
      });

      if (error) throw error;

      toast.success("Review submitted successfully!");
      setRating(0);
      setTitle("");
      setComment("");
      onReviewSubmitted();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Card variant="flat" className="p-6 text-center">
        <p className="text-muted-foreground mb-4">
          Please sign in to write a review
        </p>
        <Button asChild>
          <Link to="/auth">Sign In</Link>
        </Button>
      </Card>
    );
  }

  return (
    <Card variant="flat" className="p-6">
      <h4 className="font-display text-lg font-semibold mb-2">Write a Review</h4>
      {hasPurchased && (
        <Badge variant="secondary" className="mb-4 gap-1">
          <CheckCircle className="h-3 w-3" />
          Verified Buyer
        </Badge>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating */}
        <div>
          <Label className="mb-2 block">Your Rating</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`h-6 w-6 ${
                    star <= (hoverRating || rating)
                      ? "fill-primary text-primary"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <Label htmlFor="review-title">Review Title</Label>
          <Input
            id="review-title"
            placeholder="Summarize your experience"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            className="mt-1"
          />
        </div>

        {/* Comment */}
        <div>
          <Label htmlFor="review-comment">Your Review</Label>
          <Textarea
            id="review-comment"
            placeholder="Share your experience with this product..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={1000}
            className="mt-1"
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </Button>
      </form>
    </Card>
  );
}
