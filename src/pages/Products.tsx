import { useState, useMemo, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Grid3X3,
  List,
  SlidersHorizontal,
  X,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

// Static data as fallback for filters
import { materials, colors, brands } from "@/data/products";

interface DbProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  images: string[];
  category_id: string | null;
  material: string | null;
  color: string | null;
  dimensions: unknown;
  weight: number | null;
  rating: number;
  review_count: number;
  in_stock: boolean;
  stock_count: number;
  badge: string | null;
  brand: string | null;
  features: string[];
  is_active: boolean;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface DbCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  product_count: number;
}

// Transform DB product to the format expected by ProductCard
const transformProduct = (dbProduct: DbProduct) => {
  const dims = dbProduct.dimensions as { width?: number; height?: number; depth?: number } | null;
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    description: dbProduct.description || "",
    price: dbProduct.price,
    originalPrice: dbProduct.original_price || undefined,
    image: dbProduct.image_url || "/placeholder.svg",
    images: dbProduct.images?.length > 0 ? dbProduct.images : [dbProduct.image_url || "/placeholder.svg"],
    category: dbProduct.category?.slug || "uncategorized",
    material: dbProduct.material || "",
    color: dbProduct.color || "",
    dimensions: {
      width: dims?.width ?? 0,
      height: dims?.height ?? 0,
      depth: dims?.depth ?? 0,
    },
    weight: dbProduct.weight || 0,
    rating: dbProduct.rating || 0,
    reviewCount: dbProduct.review_count || 0,
    inStock: dbProduct.in_stock,
    stockCount: dbProduct.stock_count || 0,
    badge: dbProduct.badge as "sale" | "new" | "bestseller" | "limited" | undefined,
    brand: dbProduct.brand || "",
    features: dbProduct.features || [],
  };
};

export default function Products() {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");
  const searchParam = searchParams.get("search");
  const saleParam = searchParams.get("sale");
  const sortParam = searchParams.get("sort");
  const badgeParam = searchParams.get("badge");
  
  const { viewMode, setViewMode } = useStore();
  const { t } = useLanguage();
  const [sortBy, setSortBy] = useState(sortParam || "popularity");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categoryParam ? [categoryParam] : []
  );
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Database state
  const [dbProducts, setDbProducts] = useState<DbProduct[]>([]);
  const [dbCategories, setDbCategories] = useState<DbCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch products and categories from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          supabase
            .from("products")
            .select("*, category:categories(id, name, slug)")
            .eq("is_active", true)
            .order("created_at", { ascending: false }),
          supabase
            .from("categories")
            .select("*")
            .eq("is_active", true)
            .order("name"),
        ]);

        if (productsRes.error) throw productsRes.error;
        if (categoriesRes.error) throw categoriesRes.error;

        setDbProducts(productsRes.data || []);
        setDbCategories(categoriesRes.data || []);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Transform products for display
  const products = useMemo(() => dbProducts.map(transformProduct), [dbProducts]);

  // Transform categories for filter
  const categories = useMemo(() => 
    dbCategories.map(cat => ({
      id: cat.slug,
      name: cat.name,
      description: cat.description || "",
      image: cat.image_url || "/placeholder.svg",
      productCount: cat.product_count || 0,
    })), 
    [dbCategories]
  );

  const filteredProducts = useMemo(() => {
    let result = products;

    // Search filter (from URL param)
    if (searchParam) {
      const query = searchParam.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      );
    }

    // Sale filter (from URL param)
    if (saleParam === "true") {
      result = result.filter((p) => p.originalPrice && p.originalPrice > p.price);
    }

    // Badge filter (from URL param)
    if (badgeParam) {
      result = result.filter((p) => p.badge === badgeParam);
    }

    // Category filter
    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(p.category));
    }

    // Material filter
    if (selectedMaterials.length > 0) {
      result = result.filter((p) =>
        selectedMaterials.some((m) => p.material.toLowerCase().includes(m.toLowerCase()))
      );
    }

    // Color filter
    if (selectedColors.length > 0) {
      result = result.filter((p) => selectedColors.includes(p.color));
    }

    // Brand filter
    if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(p.brand));
    }

    // Price filter
    result = result.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    // Sorting
    switch (sortBy) {
      case "price-low":
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result = [...result].sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        // Products are already fetched ordered by created_at desc, preserve that order
        break;
      case "popularity":
      default:
        result = [...result].sort((a, b) => b.reviewCount - a.reviewCount);
        break;
    }

    return result;
  }, [
    products,
    searchParam,
    saleParam,
    badgeParam,
    selectedCategories,
    selectedMaterials,
    selectedColors,
    selectedBrands,
    priceRange,
    sortBy,
  ]);

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedMaterials([]);
    setSelectedColors([]);
    setSelectedBrands([]);
    setPriceRange([0, 100000]);
  };

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedMaterials.length > 0 ||
    selectedColors.length > 0 ||
    selectedBrands.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 100000;

  const toggleFilter = (
    value: string,
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (selected.includes(value)) {
      setSelected(selected.filter((v) => v !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-semibold text-foreground">
          {t("products.categories")}
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          {categories.map((cat) => (
            <label
              key={cat.id}
              className="flex items-center gap-3 cursor-pointer"
            >
              <Checkbox
                checked={selectedCategories.includes(cat.id)}
                onCheckedChange={() =>
                  toggleFilter(cat.id, selectedCategories, setSelectedCategories)
                }
              />
              <span className="text-sm text-foreground">{cat.name}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                ({cat.productCount})
              </span>
            </label>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Price Range */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-semibold text-foreground">
          {t("products.priceRange")}
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-4">
          <Slider
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            min={0}
            max={100000}
            step={1000}
          />
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={priceRange[0]}
              onChange={(e) =>
                setPriceRange([Number(e.target.value), priceRange[1]])
              }
              className="h-9"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              value={priceRange[1]}
              onChange={(e) =>
                setPriceRange([priceRange[0], Number(e.target.value)])
              }
              className="h-9"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Materials */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-semibold text-foreground">
          {t("products.material")}
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          {materials.map((material) => (
            <label
              key={material}
              className="flex items-center gap-3 cursor-pointer"
            >
              <Checkbox
                checked={selectedMaterials.includes(material)}
                onCheckedChange={() =>
                  toggleFilter(material, selectedMaterials, setSelectedMaterials)
                }
              />
              <span className="text-sm text-foreground">{material}</span>
            </label>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Colors */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-semibold text-foreground">
          {t("products.color")}
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          {colors.map((color) => (
            <label
              key={color}
              className="flex items-center gap-3 cursor-pointer"
            >
              <Checkbox
                checked={selectedColors.includes(color)}
                onCheckedChange={() =>
                  toggleFilter(color, selectedColors, setSelectedColors)
                }
              />
              <span className="text-sm text-foreground">{color}</span>
            </label>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Brands */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-semibold text-foreground">
          {t("products.brand")}
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          {brands.map((brand) => (
            <label
              key={brand}
              className="flex items-center gap-3 cursor-pointer"
            >
              <Checkbox
                checked={selectedBrands.includes(brand)}
                onCheckedChange={() =>
                  toggleFilter(brand, selectedBrands, setSelectedBrands)
                }
              />
              <span className="text-sm text-foreground">{brand}</span>
            </label>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {hasActiveFilters && (
        <Button
          variant="outline"
          className="w-full"
          onClick={clearAllFilters}
        >
          {t("products.clearAll")}
        </Button>
      )}
    </div>
  );

  return (
    <>
      <Helmet>
        <title>{t("products.title")} | Furnish</title>
        <meta
          name="description"
          content="Browse our collection of premium furniture. Filter by category, price, material, and more."
        />
      </Helmet>
      <Layout>
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Breadcrumb */}
          <nav className="text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-primary">
              {t("products.breadcrumb.home")}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{t("products.breadcrumb.shop")}</span>
            {categoryParam && (
              <>
                <span className="mx-2">/</span>
                <span className="text-foreground capitalize">{categoryParam}</span>
              </>
            )}
          </nav>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Desktop Filters Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-32">
              <h2 className="font-display text-xl font-semibold mb-6">{t("products.filters")}</h2>
                <FiltersContent />
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <p className="text-muted-foreground">
                  {isLoading ? t("products.loading") : `${t("products.showing")} ${filteredProducts.length} ${t("products.productsLabel")}`}
                </p>

                <div className="flex items-center gap-4">
                  {/* Mobile Filter Button */}
                  <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="lg:hidden">
                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                        {t("products.filters")}
                        {hasActiveFilters && (
                          <span className="ml-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                            !
                          </span>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80 overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle className="font-display">{t("products.filters")}</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6">
                        <FiltersContent />
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Sort */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popularity">{t("products.sort.popularity")}</SelectItem>
                      <SelectItem value="newest">{t("products.sort.newest")}</SelectItem>
                      <SelectItem value="price-low">{t("products.sort.priceLow")}</SelectItem>
                      <SelectItem value="price-high">{t("products.sort.priceHigh")}</SelectItem>
                      <SelectItem value="rating">{t("products.sort.rating")}</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* View Toggle */}
                  <div className="hidden sm:flex items-center border rounded-lg overflow-hidden">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="icon"
                      className="rounded-none"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="icon"
                      className="rounded-none"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Active Filters */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <span className="text-sm text-muted-foreground">{t("products.activeFilters")}</span>
                  {selectedCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() =>
                        setSelectedCategories(
                          selectedCategories.filter((c) => c !== cat)
                        )
                      }
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                    >
                      {cat}
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                  {selectedMaterials.map((m) => (
                    <button
                      key={m}
                      onClick={() =>
                        setSelectedMaterials(selectedMaterials.filter((x) => x !== m))
                      }
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                    >
                      {m}
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                  {selectedColors.map((c) => (
                    <button
                      key={c}
                      onClick={() =>
                        setSelectedColors(selectedColors.filter((x) => x !== c))
                      }
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                    >
                      {c}
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                  {selectedBrands.map((b) => (
                    <button
                      key={b}
                      onClick={() =>
                        setSelectedBrands(selectedBrands.filter((x) => x !== b))
                      }
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                    >
                      {b}
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-primary underline ml-2"
                  >
                    {t("products.clearAllLink")}
                  </button>
                </div>
              )}

              {/* Loading State */}
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-xl font-display text-foreground mb-2">
                    {t("products.noProducts")}
                  </p>
                  <p className="text-muted-foreground mb-6">
                    {t("products.noProductsDesc")}
                  </p>
                  <Button onClick={clearAllFilters}>{t("products.clearAll")}</Button>
                </div>
              ) : (
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
                      : "flex flex-col gap-6"
                  }
                >
                  {filteredProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <ProductCard product={product} viewMode={viewMode} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
