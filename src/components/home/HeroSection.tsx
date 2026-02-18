import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-living-room.jpg";
import { useLanguage } from "@/contexts/LanguageContext";

export function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Modern living room with cream sectional sofa"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl">
          <span
            className="inline-block text-sm font-medium text-primary mb-4 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            {t("hero.tagline")}
          </span>
          <h1
            className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-tight mb-6 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            {t("hero.title1")}
            <br />
            <span className="text-primary">{t("hero.title2")}</span>
          </h1>
          <p
            className="text-lg md:text-xl text-muted-foreground max-w-lg mb-8 animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            {t("hero.description")}
          </p>
          <div
            className="flex flex-col sm:flex-row gap-4 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            <Button variant="hero" size="xl" asChild>
              <Link to="/products">
                {t("hero.shop")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <Link to="/about">{t("hero.learn")}</Link>
            </Button>
          </div>

          {/* Stats */}
          <div
            className="flex gap-8 mt-12 animate-fade-in"
            style={{ animationDelay: "0.5s" }}
          >
            <div>
              <p className="font-display text-3xl font-bold text-foreground">100+</p>
              <p className="text-sm text-muted-foreground">{t("hero.stat1")}</p>
            </div>
            <div>
              <p className="font-display text-3xl font-bold text-foreground">5k+</p>
              <p className="text-sm text-muted-foreground">{t("hero.stat2")}</p>
            </div>
            <div>
              <p className="font-display text-3xl font-bold text-foreground">15+</p>
              <p className="text-sm text-muted-foreground">{t("hero.stat3")}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
