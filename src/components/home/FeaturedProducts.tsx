import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/ProductCard";
import { Product } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface FeaturedProductsProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  limit?: number;
}

function transformProduct(p: any): Product {
  const dims = p.dimensions as { width?: number; height?: number; depth?: number } | null;
  return {
    id: p.id,
    name: p.name,
    description: p.description || "",
    price: p.price,
    originalPrice: p.original_price || undefined,
    image: p.image_url || "/placeholder.svg",
    images: p.images?.length ? p.images : [p.image_url || "/placeholder.svg"],
    category: p.category?.slug || "living",
    material: p.material || "Wood",
    color: p.color || "Natural",
    dimensions: { width: dims?.width || 0, height: dims?.height || 0, depth: dims?.depth || 0 },
    weight: p.weight || 0,
    rating: p.rating || 0,
    reviewCount: p.review_count || 0,
    inStock: p.in_stock ?? true,
    stockCount: p.stock_count || 0,
    badge: p.badge as any,
    brand: p.brand || "Guna Woodcraft",
    features: p.features || [],
  };
}

export function FeaturedProducts({
  title,
  subtitle,
  badge,
  limit = 4,
}: FeaturedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  const displayTitle = title || t("featured.title");
  const displaySubtitle = subtitle || t("featured.subtitle");

  useEffect(() => {
    const fetchProducts = async () => {
      let query = supabase
        .from("products")
        .select("*, category:categories(id, slug, name)")
        .eq("is_active", true);

      if (badge) {
        query = query.eq("badge", badge);
      }

      const { data } = await query.limit(limit);
      if (data) {
        setProducts(data.map(transformProduct));
      }
      setLoading(false);
    };
    fetchProducts();
  }, [badge, limit]);

  if (loading) {
    return (
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              {displayTitle}
            </h2>
            <p className="text-muted-foreground">{displaySubtitle}</p>
          </div>
          <Button variant="ghost" asChild className="self-start md:self-auto">
            <Link to="/products">
              {t("featured.viewAll")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
