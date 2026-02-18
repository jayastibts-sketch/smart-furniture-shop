import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface DbCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  product_count: number | null;
}

export function CategoriesSection() {
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name, slug, description, image_url, product_count")
        .eq("is_active", true)
        .order("name");
      if (data) setCategories(data);
      setLoading(false);
    };
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("categories.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("categories.desc")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              to={`/products?category=${category.slug}`}
              className="group relative overflow-hidden rounded-2xl aspect-[4/5] animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <img
                src={category.image_url || "/placeholder.svg"}
                alt={category.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="font-display text-xl md:text-2xl font-bold text-background mb-1">
                  {category.name}
                </h3>
                <p className="text-background/80 text-sm mb-3">
                  {category.product_count || 0} {t("categories.products")}
                </p>
                <span className="inline-flex items-center text-sm font-medium text-background group-hover:gap-2 transition-all">
                  {t("categories.explore")}
                  <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
