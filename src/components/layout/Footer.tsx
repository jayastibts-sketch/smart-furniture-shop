import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().trim().email("Please enter a valid email address").max(255);

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: result.data });

      if (error) {
        if (error.code === "23505") {
          toast.info("You're already subscribed to our newsletter!");
        } else {
          throw error;
        }
      } else {
        setIsSubscribed(true);
        setEmail("");
        toast.success("Successfully subscribed! Welcome to the Guna family 🎉");
        // Fire and forget welcome email – don't block the UI on this
        supabase.functions.invoke("send-newsletter-welcome", {
          body: { email: result.data },
        }).catch((err) => console.error("Welcome email error:", err));
      }
    } catch (err) {
      console.error("Newsletter subscription error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  const footerLinks = {
    shop: [
      { label: t("footer.shop.living"), href: "/products?category=living" },
      { label: t("footer.shop.bedroom"), href: "/products?category=bedroom" },
      { label: t("footer.shop.dining"), href: "/products?category=dining" },
      { label: t("footer.shop.office"), href: "/products?category=office" },
      { label: t("footer.shop.new"), href: "/products?sort=newest" },
      { label: t("footer.shop.sale"), href: "/products?sale=true" },
    ],
    customer: [
      { label: t("footer.customer.account"), href: "/account" },
      { label: t("footer.customer.tracking"), href: "/orders" },
      { label: t("footer.customer.wishlist"), href: "/wishlist" },
      { label: t("footer.customer.delivery"), href: "/delivery" },
      { label: t("footer.customer.returns"), href: "/returns" },
      { label: t("footer.customer.faq"), href: "/faq" },
    ],
    company: [
      { label: t("footer.company.about"), href: "/about" },
      { label: t("footer.company.careers"), href: "/careers" },
      { label: t("footer.company.press"), href: "/press" },
      { label: t("footer.company.sustainability"), href: "/sustainability" },
      { label: t("footer.company.contact"), href: "/contact" },
    ],
  };

  return (
    <footer className="bg-secondary/50 border-t border-border">
      {/* Newsletter Section */}
      <div className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="font-display text-2xl md:text-3xl font-bold mb-3">
              {t("footer.newsletter.title")}
            </h3>
            <p className="text-primary-foreground/80 mb-6">
              {t("footer.newsletter.desc")}
            </p>
            {isSubscribed ? (
              <div className="flex items-center justify-center gap-2 text-primary-foreground">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">You're subscribed! Thank you 🙏</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder={t("footer.newsletter.placeholder")}
                  className="bg-primary-foreground text-foreground border-0"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <Button type="submit" variant="secondary" className="whitespace-nowrap" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Subscribing...
                    </>
                  ) : (
                    t("footer.newsletter.button")
                  )}
                </Button>
              </form>
            )}

          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block mb-4">
              <span className="font-display text-2xl font-bold text-foreground">
                Guna Wooden Furniture
              </span>
            </Link>
            <p className="text-muted-foreground mb-6 max-w-sm">
              {t("footer.brand.desc")}
            </p>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-primary" />
                <span>123 Thiruvika Street, Ranipet - 632401</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-primary" />
                <span>+91 97914 59490</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-primary" />
                <span>Owner: Guna</span>
              </div>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t("footer.shop")}</h4>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t("footer.customer")}</h4>
            <ul className="space-y-3">
              {footerLinks.customer.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t("footer.company")}</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary">
              {t("footer.privacy")}
            </Link>
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary">
              {t("footer.terms")}
            </Link>
          </div>

          <p className="text-sm text-muted-foreground">
            © {currentYear} Guna Wooden Furniture. {t("footer.rights")}.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Linkedin className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
