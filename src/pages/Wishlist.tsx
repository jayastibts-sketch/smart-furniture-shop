import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Heart, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";

export default function Wishlist() {
  const { wishlist, removeFromWishlist, moveToCart } = useStore();

  const handleMoveToCart = (productId: string, productName: string) => {
    moveToCart(productId);
    toast.success(`${productName} moved to cart`);
  };

  const handleRemove = (productId: string, productName: string) => {
    removeFromWishlist(productId);
    toast.info(`${productName} removed from wishlist`);
  };

  if (wishlist.length === 0) {
    return (
      <>
        <Helmet>
          <title>Wishlist | Furnish</title>
        </Helmet>
        <Layout>
          <div className="container mx-auto px-4 py-16 text-center">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
            <h1 className="font-display text-3xl font-bold text-foreground mb-4">
              Your Wishlist is Empty
            </h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Save your favorite items to your wishlist and they'll appear here.
            </p>
            <Button variant="hero" size="lg" asChild>
              <Link to="/products">
                Start Shopping
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </Layout>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`Wishlist (${wishlist.length}) | Furnish`}</title>
      </Helmet>
      <Layout>
        <div className="container mx-auto px-4 py-8 md:py-12">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-8">
            My Wishlist
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((item) => (
              <Card key={item.product.id} variant="product" className="group">
                <Link to={`/products/${item.product.id}`}>
                  <div className="relative aspect-square overflow-hidden rounded-t-xl">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </Link>
                <div className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">
                    {item.product.brand}
                  </p>
                  <Link to={`/products/${item.product.id}`}>
                    <h3 className="font-display font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
                      {item.product.name}
                    </h3>
                  </Link>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-lg font-bold text-foreground">
                      ${item.product.price.toLocaleString()}
                    </span>
                    {item.product.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        ${item.product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        handleMoveToCart(item.product.id, item.product.name)
                      }
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Move to Cart
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => handleRemove(item.product.id, item.product.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    </>
  );
}
