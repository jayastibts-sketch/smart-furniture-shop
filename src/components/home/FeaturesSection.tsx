import { Truck, Shield, RotateCcw, Headphones } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function FeaturesSection() {
  const { t } = useLanguage();

  const features = [
    {
      icon: Truck,
      title: t("features.shipping.title"),
      description: t("features.shipping.desc"),
    },
    {
      icon: Shield,
      title: t("features.payment.title"),
      description: t("features.payment.desc"),
    },
    {
      icon: RotateCcw,
      title: t("features.returns.title"),
      description: t("features.returns.desc"),
    },
    {
      icon: Headphones,
      title: t("features.support.title"),
      description: t("features.support.desc"),
    },
  ];

  return (
    <section className="py-12 md:py-16 border-y border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
