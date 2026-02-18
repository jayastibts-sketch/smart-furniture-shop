import { useState, useEffect } from "react";
import { Star, Quote, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface Review {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  title: string;
  created_at: string;
  product_id: string;
}

export function TestimonialsSection() {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, user_name, rating, comment, title, created_at, product_id")
        .gte("rating", 4)
        .order("created_at", { ascending: false })
        .limit(3);

      if (data && data.length > 0) {
        setReviews(data);
      }
      setLoading(false);
    };
    fetchReviews();
  }, []);

  if (loading) {
    return (
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        </div>
      </section>
    );
  }

  if (reviews.length === 0) return null;

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("testimonials.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("testimonials.desc")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map((review, index) => (
            <Card
              key={review.id}
              variant="elevated"
              className="p-6 md:p-8 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Quote className="h-8 w-8 text-primary/30 mb-4" />
              <p className="text-foreground mb-6 leading-relaxed">
                "{review.comment}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                  {getInitials(review.user_name)}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{review.user_name}</p>
                  <p className="text-sm text-muted-foreground">{review.title}</p>
                </div>
              </div>
              <div className="flex gap-1 mt-4">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
