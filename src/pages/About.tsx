import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { MapPin, Phone, Mail, TreeDeciduous } from "lucide-react";

const About = () => {
  return (
    <>
      <Helmet>
        <title>About Us - Guna Wooden Furniture</title>
        <meta
          name="description"
          content="Guna Wooden Furniture - Premium handcrafted wooden furniture seller in Ranipet. Quality wood products for your home."
        />
      </Helmet>
      <Layout>
        <div className="min-h-screen bg-background">
          {/* Hero Section */}
          <section className="relative py-20 md:py-32 bg-secondary/30">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                  <TreeDeciduous className="h-8 w-8 text-primary" />
                </div>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                  Guna Wooden Furniture
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground">
                  Crafting timeless wooden furniture with passion and precision
                </p>
              </div>
            </div>
          </section>

          {/* About Content */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                  <div>
                    <h2 className="font-display text-3xl font-bold text-foreground mb-6">
                      Our Story
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      Welcome to Guna Wooden Furniture, your trusted destination for premium handcrafted wooden furniture. Based in the heart of Ranipet, we specialize in creating beautiful, durable wooden pieces that bring warmth and elegance to your home.
                    </p>
                    <p className="text-muted-foreground mb-4">
                      Every piece of furniture we create is crafted from carefully selected quality wood, ensuring longevity and natural beauty. Our skilled artisans combine traditional woodworking techniques with modern designs to deliver furniture that stands the test of time.
                    </p>
                    <p className="text-muted-foreground">
                      From classic dining tables to elegant bedroom sets, our collection features a wide range of wooden furniture designed to suit every taste and space.
                    </p>
                  </div>
                  <div className="bg-secondary/50 rounded-2xl p-8">
                    <h3 className="font-display text-xl font-semibold text-foreground mb-4">
                      Why Choose Us?
                    </h3>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                        <span className="text-muted-foreground">100% solid wood construction</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                        <span className="text-muted-foreground">Handcrafted by skilled artisans</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                        <span className="text-muted-foreground">Custom designs available</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                        <span className="text-muted-foreground">Eco-friendly and sustainable materials</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                        <span className="text-muted-foreground">Competitive pricing</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Contact Section */}
                <div className="bg-primary/5 rounded-2xl p-8 md:p-12">
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
                    Contact Us
                  </h2>
                  <div className="grid md:grid-cols-3 gap-8">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">Address</h3>
                      <p className="text-muted-foreground text-sm">
                        123 Thiruvika Street<br />
                        Ranipet - 632401<br />
                        Tamil Nadu, India
                      </p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">Phone</h3>
                      <a 
                        href="tel:+919791459490" 
                        className="text-muted-foreground text-sm hover:text-primary transition-colors"
                      >
                        +91 97914 59490
                      </a>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">Owner</h3>
                      <p className="text-muted-foreground text-sm">
                        Guna
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </Layout>
    </>
  );
};

export default About;
