import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useStore } from "@/store/useStore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatINR } from "@/lib/utils";

export default function Cart() {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, clearCart, getCartTotal } = useStore();
  const { user } = useAuth();
  const total = getCartTotal();
  const shipping = total > 999 ? 0 : 99;
  const grandTotal = total + shipping;

  const handleRemove = (productId: string, productName: string) => {
    removeFromCart(productId);
    toast.info(`${productName} removed from cart`);
  };

  if (cart.length === 0) {
    return (
      <>
        <Helmet>
          <title>Shopping Cart | Furnish</title>
        </Helmet>
        <Layout>
          <div className="container mx-auto px-4 py-16 text-center">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
            <h1 className="font-display text-3xl font-bold text-foreground mb-4">
              Your Cart is Empty
            </h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Looks like you haven't added any items yet. Start exploring our collection!
            </p>
            <Button variant="hero" size="lg" asChild>
              <Link to="/products">
                Browse Products
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
        <title>{`Shopping Cart (${cart.length}) | Furnish`}</title>
      </Helmet>
      <Layout>
        <div className="container mx-auto px-4 py-8 md:py-12">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-8">
            Shopping Cart
          </h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <Card key={item.product.id} variant="elevated" className="p-4 md:p-6">
                  <div className="flex gap-4 md:gap-6">
                    <Link
                      to={`/products/${item.product.id}`}
                      className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-lg overflow-hidden"
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">{item.product.brand}</p>
                          <Link to={`/products/${item.product.id}`}>
                            <h3 className="font-display font-semibold text-foreground hover:text-primary transition-colors">
                              {item.product.name}
                            </h3>
                          </Link>
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.product.color} • {item.product.material}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(item.product.id, item.product.name)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>

                      <div className="flex items-end justify-between mt-4">
                        <div className="flex items-center border rounded-lg">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity - 1)
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-10 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity + 1)
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {formatINR(item.product.price * item.quantity)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-sm text-muted-foreground">
                              {formatINR(item.product.price)} each
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              <div className="flex justify-between items-center pt-4">
                <Button variant="ghost" onClick={clearCart}>
                  Clear Cart
                </Button>
                <Link to="/products">
                  <Button variant="outline">Continue Shopping</Button>
                </Link>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <Card variant="elevated" className="p-6 sticky top-32">
                <h2 className="font-display text-xl font-semibold mb-6">Order Summary</h2>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatINR(total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? "Free" : formatINR(shipping)}
                    </span>
                  </div>
                  {total < 999 && (
                    <p className="text-sm text-accent">
                      Add {formatINR(999 - total)} more for free shipping!
                    </p>
                  )}
                </div>

                {/* Coupon */}
                <div className="mt-6">
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Coupon Code
                  </label>
                  <div className="flex gap-2">
                    <Input placeholder="Enter code" />
                    <Button variant="outline">Apply</Button>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="flex justify-between text-lg font-bold mb-6">
                  <span>Total</span>
                  <span>{formatINR(grandTotal)}</span>
                </div>

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    if (!user) {
                      toast.info("Please login to checkout");
                      navigate("/auth?redirect=/checkout");
                    } else {
                      navigate("/checkout");
                    }
                  }}
                >
                  Proceed to Checkout
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Secure checkout powered by Stripe
                </p>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
