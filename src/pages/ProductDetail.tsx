import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useState, useEffect, useCallback } from "react";
import {
  Heart,
  ShoppingCart,
  Minus,
  Plus,
  Star,
  Truck,
  Shield,
  RotateCcw,
  Share2,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { reviews as staticReviews } from "@/data/products";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import { ProductCard } from "@/components/products/ProductCard";
import { ReviewForm } from "@/components/products/ReviewForm";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/utils";
import { addDays, format } from "date-fns";
import type { Product } from "@/data/products";

interface DatabaseReview {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  helpful: number;
  created_at: string;
}

interface DatabaseProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  images: string[] | null;
  material: string | null;
  color: string | null;
  dimensions: { width?: number; height?: number; depth?: number } | null;
  weight: number | null;
  rating: number | null;
  review_count: number | null;
  in_stock: boolean | null;
  stock_count: number | null;
  badge: string | null;
  brand: string | null;
  features: string[] | null;
  category: {
    id: string;
    slug: string;
    name: string;
    shipping_days: number | null;
  } | null;
}

function transformProduct(dbProduct: DatabaseProduct): Product {
  const dims = dbProduct.dimensions as { width?: number; height?: number; depth?: number } | null;
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    description: dbProduct.description || "",
    price: dbProduct.price,
    originalPrice: dbProduct.original_price || undefined,
    image: dbProduct.image_url || "/placeholder.svg",
    images: dbProduct.images?.length ? dbProduct.images : [dbProduct.image_url || "/placeholder.svg"],
    category: dbProduct.category?.slug || "living",
    material: dbProduct.material || "Wood",
    color: dbProduct.color || "Natural",
    dimensions: {
      width: dims?.width || 0,
      height: dims?.height || 0,
      depth: dims?.depth || 0,
    },
    weight: dbProduct.weight || 0,
    rating: dbProduct.rating || 0,
    reviewCount: dbProduct.review_count || 0,
    inStock: dbProduct.in_stock ?? true,
    stockCount: dbProduct.stock_count || 0,
    badge: dbProduct.badge as "sale" | "new" | "bestseller" | "limited" | undefined,
    brand: dbProduct.brand || "Guna Woodcraft",
    features: dbProduct.features || [],
  };
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryShippingDays, setCategoryShippingDays] = useState(7);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [dbReviews, setDbReviews] = useState<DatabaseReview[]>([]);
  
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist, addToRecentlyViewed } = useStore();

  // Fetch product from database
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      setLoading(true);
      
      // Try to find by UUID first, then by slug
      let query = supabase
        .from("products")
        .select("*, category:categories(id, slug, name, shipping_days)")
        .eq("is_active", true);
      
      // Check if id is a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(id)) {
        query = query.eq("id", id);
      } else {
        query = query.eq("slug", id);
      }
      
      const { data, error } = await query.maybeSingle();
      
      if (error || !data) {
        setProduct(null);
        setLoading(false);
        return;
      }
      
      const transformedProduct = transformProduct(data as DatabaseProduct);
      setProduct(transformedProduct);
      setCategoryShippingDays(data.category?.shipping_days || 7);
      
      // Fetch similar products
      if (data.category?.id) {
        const { data: similar } = await supabase
          .from("products")
          .select("*, category:categories(id, slug, name, shipping_days)")
          .eq("category_id", data.category.id)
          .eq("is_active", true)
          .neq("id", data.id)
          .limit(4);
        
        if (similar) {
          setSimilarProducts(similar.map(p => transformProduct(p as DatabaseProduct)));
        }
      }
      
      setLoading(false);
    };
    
    fetchProduct();
  }, [id]);

  const fetchReviews = useCallback(async () => {
    if (!id) return;
    
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setDbReviews(data);
    }
  }, [id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Add to recently viewed when product is found
  useEffect(() => {
    if (product) {
      addToRecentlyViewed(product);
    }
  }, [product, addToRecentlyViewed]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-bold mb-4">Product Not Found</h1>
          <Button onClick={() => navigate("/products")}>Browse Products</Button>
        </div>
      </Layout>
    );
  }

  const productImages = product.images?.length ? product.images : [product.image || "/placeholder.svg"];
  const inWishlist = isInWishlist(product.id);
  
  // Use database reviews only
  const allReviews = dbReviews.map(r => ({
    id: r.id,
    productId: r.product_id,
    userName: r.user_name,
    rating: r.rating,
    title: r.title,
    comment: r.comment,
    date: r.created_at,
    verified: r.verified,
    helpful: r.helpful,
  }));

  // Compute actual rating from reviews
  const actualRating = allReviews.length > 0
    ? Math.round((allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length) * 10) / 10
    : 0;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast.success(`${product.name} added to cart`);
  };

  const handleWishlistToggle = () => {
    if (inWishlist) {
      removeFromWishlist(product.id);
      toast.info(`${product.name} removed from wishlist`);
    } else {
      addToWishlist(product);
      toast.success(`${product.name} added to wishlist`);
    }
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <>
      <Helmet>
        <title>{product.name} | Guna Wooden Furniture</title>
        <meta name="description" content={product.description} />
      </Helmet>
      <Layout>
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Breadcrumb */}
          <nav className="text-sm text-muted-foreground mb-8 flex items-center gap-2">
            <Link to="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/products" className="hover:text-primary">Shop</Link>
            <ChevronRight className="h-4 w-4" />
            <Link
              to={`/products?category=${product.category}`}
              className="hover:text-primary capitalize"
            >
              {product.category}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">{product.name}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Images */}
            <div className="space-y-4">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-secondary">
                <img
                  src={productImages[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.badge && (
                  <Badge
                    variant={product.badge}
                    className="absolute top-4 left-4 text-sm"
                  >
                    {product.badge === "sale" ? `-${discount}%` : product.badge}
                  </Badge>
                )}
              </div>
              {productImages.length > 1 && <div className="flex gap-3">
                {productImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === i
                        ? "border-primary"
                        : "border-transparent hover:border-primary/50"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} view ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>}
            </div>

            {/* Product Info */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">{product.brand}</p>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(actualRating)
                          ? "fill-primary text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-semibold">{actualRating}</span>
                <span className="text-muted-foreground">
                  ({allReviews.length} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl font-bold text-foreground">
                  {formatINR(product.price)}
                </span>
                {product.originalPrice && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      {formatINR(product.originalPrice)}
                    </span>
                    <Badge variant="sale">Save {formatINR(product.originalPrice - product.price)}</Badge>
                  </>
                )}
              </div>

              <p className="text-muted-foreground mb-8">{product.description}</p>

              {/* Stock */}
              {product.inStock ? (
                <Badge variant="inStock" className="mb-6">
                  In Stock ({product.stockCount} available)
                </Badge>
              ) : (
                <Badge variant="outOfStock" className="mb-6">
                  Out of Stock
                </Badge>
              )}

              {/* Quantity & Add to Cart */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={quantity >= product.stockCount}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="hero"
                  size="lg"
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleWishlistToggle}
                >
                  <Heart
                    className={`h-5 w-5 ${
                      inWishlist ? "fill-primary text-primary" : ""
                    }`}
                  />
                </Button>
                <Button variant="outline" size="lg">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              {/* Delivery Info */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <Truck className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-medium text-primary">
                      Expected Delivery: {format(addDays(new Date(), categoryShippingDays), "dd MMM yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Ships within {categoryShippingDays} days
                    </p>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 py-6 border-y border-border">
                <div className="text-center">
                  <Truck className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Free Shipping</p>
                </div>
                <div className="text-center">
                  <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">2 Year Warranty</p>
                </div>
                <div className="text-center">
                  <RotateCcw className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">30-Day Returns</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="details" className="mt-16">
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0">
              <TabsTrigger
                value="details"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                Details
              </TabsTrigger>
              <TabsTrigger
                value="specifications"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                Specifications
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                Reviews ({allReviews.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="py-8">
              <div className="max-w-3xl">
                <h3 className="font-display text-xl font-semibold mb-4">
                  Product Features
                </h3>
                <ul className="grid md:grid-cols-2 gap-3">
                  {product.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="specifications" className="py-8">
              <div className="max-w-xl">
                <table className="w-full">
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="py-3 text-muted-foreground">Dimensions</td>
                      <td className="py-3 text-right font-medium">
                        {product.dimensions.width} x {product.dimensions.height} x{" "}
                        {product.dimensions.depth} cm
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 text-muted-foreground">Weight</td>
                      <td className="py-3 text-right font-medium">{product.weight} kg</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-muted-foreground">Material</td>
                      <td className="py-3 text-right font-medium">{product.material}</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-muted-foreground">Color</td>
                      <td className="py-3 text-right font-medium">{product.color}</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-muted-foreground">Brand</td>
                      <td className="py-3 text-right font-medium">{product.brand}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="py-8">
              <div className="grid md:grid-cols-3 gap-8">
                {/* Review Form */}
                <div className="md:col-span-1">
                  <ReviewForm productId={product.id} onReviewSubmitted={fetchReviews} />
                </div>
                
                {/* Reviews List */}
                <div className="md:col-span-2 space-y-6">
                  <h4 className="font-display text-lg font-semibold">
                    Customer Reviews ({allReviews.length})
                  </h4>
                  {allReviews.length === 0 ? (
                    <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
                  ) : (
                    allReviews.map((review) => (
                      <Card key={review.id} variant="flat" className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold">{review.userName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating
                                        ? "fill-primary text-primary"
                                        : "text-muted-foreground"
                                    }`}
                                  />
                                ))}
                              </div>
                              {review.verified && (
                                <Badge variant="secondary">Verified Purchase</Badge>
                              )}
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.date).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-medium mb-2">{review.title}</h4>
                        <p className="text-muted-foreground">{review.comment}</p>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Similar Products */}
          {similarProducts.length > 0 && (
            <section className="mt-16">
              <h2 className="font-display text-2xl font-bold mb-8">
                You May Also Like
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {similarProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      </Layout>
    </>
  );
}
