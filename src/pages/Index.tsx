import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { PromoSection } from "@/components/home/PromoSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { ProductQuiz } from "@/components/quiz/ProductQuiz";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const Index = () => {
  const [quizProducts, setQuizProducts] = useState<any[]>([]);
  const [quizCategories, setQuizCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: products }, { data: categories }] = await Promise.all([
        supabase.from("products").select("id, name, price, image_url, category_id, material, slug").eq("is_active", true),
        supabase.from("categories").select("id, slug").eq("is_active", true),
      ]);
      if (products) setQuizProducts(products);
      if (categories) setQuizCategories(categories);
    };
    fetchData();
  }, []);

  return (
    <>
      <Helmet>
        <title>Guna Wooden Furniture - Premium Handcrafted Wood Products</title>
        <meta
          name="description"
          content="Guna Wooden Furniture - Premium handcrafted wooden furniture in Ranipet. Shop teak, rosewood, and sheesham wood products. Free delivery available."
        />
      </Helmet>
      <Layout>
        <HeroSection />
        <FeaturesSection />
        <CategoriesSection />
        <FeaturedProducts
          title="Best Sellers"
          subtitle="Our most loved pieces"
          badge="bestseller"
        />
        <ProductQuiz products={quizProducts} categories={quizCategories} />
        <PromoSection />
        <FeaturedProducts
          title="New Arrivals"
          subtitle="Fresh designs just landed"
          badge="new"
        />
        <TestimonialsSection />
      </Layout>
    </>
  );
};

export default Index;
