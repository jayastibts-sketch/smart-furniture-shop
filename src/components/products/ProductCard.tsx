import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Eye, Star, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product, categoryShippingDays } from "@/data/products";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import { useState } from "react";
import { formatINR } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  viewMode?: "grid" | "list";
}

export function ProductCard({ product, viewMode = "grid" }: ProductCardProps) {
  const navigate = useNavigate();
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useStore();
  const [isHovered, setIsHovered] = useState(false);
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    toast.success(`${product.name} added to cart`);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  const shippingDays = categoryShippingDays[product.category] || 7;

  if (viewMode === "list") {
    return (
      <Card variant="product" className="flex flex-col md:flex-row">
        <Link to={`/products/${product.id}`} className="md:w-72 lg:w-80 flex-shrink-0">
          <div className="relative aspect-square overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.badge && (
              <Badge
                variant={product.badge}
                className="absolute top-3 left-3"
              >
                {product.badge === "sale" ? `-${discount}%` : product.badge}
              </Badge>
            )}
          </div>
        </Link>
        <div className="flex-1 p-6 flex flex-col">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{product.brand}</p>
              <Link to={`/products/${product.id}`}>
                <h3 className="font-display text-xl font-semibold text-foreground hover:text-primary transition-colors">
                  {product.name}
                </h3>
              </Link>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleWishlistToggle}
              className={inWishlist ? "text-primary" : ""}
            >
              <Heart className={`h-5 w-5 ${inWishlist ? "fill-current" : ""}`} />
            </Button>
          </div>

          <p className="text-muted-foreground mt-3 flex-1 line-clamp-2">
            {product.description}
          </p>

          <div className="flex items-center gap-2 mt-4">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="font-medium">{product.rating}</span>
            </div>
            <span className="text-muted-foreground text-sm">
              ({product.reviewCount} reviews)
            </span>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                {formatINR(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-muted-foreground line-through">
                  {formatINR(product.originalPrice)}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate(`/products/${product.id}`)}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
              <Button onClick={handleAddToCart}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
            <Truck className="h-4 w-4" />
            <span>Delivery in {shippingDays} days</span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      variant="product"
      className="group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate(`/products/${product.id}`)}
    >
      <div className="relative aspect-square overflow-hidden rounded-t-xl">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Badges */}
        {product.badge && (
          <Badge
            variant={product.badge}
            className="absolute top-3 left-3 z-10"
          >
            {product.badge === "sale" ? `-${discount}%` : product.badge}
          </Badge>
        )}

        {/* Quick Actions Overlay */}
        <div
          className={`absolute inset-0 bg-foreground/10 flex items-center justify-center gap-2 transition-opacity duration-300 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <Button
            variant="secondary"
            size="icon"
            className="h-10 w-10 rounded-full shadow-lg"
            onClick={handleWishlistToggle}
          >
            <Heart
              className={`h-5 w-5 ${inWishlist ? "fill-primary text-primary" : ""}`}
            />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-10 w-10 rounded-full shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/products/${product.id}`);
            }}
          >
            <Eye className="h-5 w-5" />
          </Button>
          <Button
            variant="default"
            size="icon"
            className="h-10 w-10 rounded-full shadow-lg"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="p-4">
        <p className="text-sm text-muted-foreground mb-1">{product.brand}</p>
        <h3 className="font-display font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
          {product.name}
        </h3>

        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <span className="text-sm font-medium">{product.rating}</span>
          </div>
          <span className="text-muted-foreground text-sm">
            ({product.reviewCount})
          </span>
        </div>

        <div className="flex items-baseline gap-2 mt-3">
          <span className="text-lg font-bold text-foreground">
            {formatINR(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatINR(product.originalPrice)}
            </span>
          )}
        </div>

        {!product.inStock && (
          <Badge variant="outOfStock" className="mt-2">
            Out of Stock
          </Badge>
        )}

        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
          <Truck className="h-3 w-3" />
          <span>Delivery in {shippingDays} days</span>
        </div>
      </div>
    </Card>
  );
}
