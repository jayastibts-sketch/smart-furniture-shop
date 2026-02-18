import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function PromoSection() {
  const { t } = useLanguage();

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Promo Card 1 */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-terracotta-dark p-8 md:p-12 min-h-[300px] flex flex-col justify-end">
            <div className="relative z-10">
              <span className="inline-block text-sm font-medium text-primary-foreground/80 mb-2">
                {t("promo.limited")}
              </span>
              <h3 className="font-display text-2xl md:text-3xl font-bold text-primary-foreground mb-3">
                {t("promo.discount")}
                <br />
                {t("promo.living")}
              </h3>
              <Button variant="secondary" asChild>
                <Link to="/products?category=living-room&sale=true">
                  {t("promo.shopNow")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-primary-foreground/10" />
            <div className="absolute -right-5 -bottom-5 w-32 h-32 rounded-full bg-primary-foreground/5" />
          </div>

          {/* Promo Card 2 */}
          <div className="relative overflow-hidden rounded-2xl bg-charcoal p-8 md:p-12 min-h-[300px] flex flex-col justify-end">
            <div className="relative z-10">
              <span className="inline-block text-sm font-medium text-cream/80 mb-2">
                {t("promo.newArrivals")}
              </span>
              <h3 className="font-display text-2xl md:text-3xl font-bold text-cream mb-3">
                {t("promo.collection")}
                <br />
                {t("promo.available")}
              </h3>
              <Button variant="soft" asChild>
                <Link to="/products?badge=new">
                  {t("promo.discover")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="absolute right-8 top-8 w-24 h-24 border border-cream/20 rounded-full" />
            <div className="absolute right-12 top-12 w-16 h-16 border border-cream/10 rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
