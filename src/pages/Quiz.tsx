import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, Palette, Home } from "lucide-react";
import { ProductQuiz } from "@/components/quiz/ProductQuiz";
import { StylePersonalityQuiz } from "@/components/quiz/StylePersonalityQuiz";
import { RoomMakeoverPlanner } from "@/components/quiz/RoomMakeoverPlanner";
import { supabase } from "@/integrations/supabase/client";

const Quiz = () => {
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
        <title>Furniture Quizzes - Find Your Perfect Style | Guna Wooden Furniture</title>
        <meta name="description" content="Take our interactive furniture quizzes to discover your style personality, find the perfect piece, or plan a room makeover." />
      </Helmet>
      <Layout>
        <section className="py-24 md:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-5xl font-bold font-serif text-foreground mb-3">
                Interactive Furniture Quizzes
              </h1>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Not sure what to buy? Let our quizzes guide you to the perfect furniture for your home.
              </p>
            </div>

            <Tabs defaultValue="finder" className="max-w-3xl mx-auto">
              <TabsList className="grid w-full grid-cols-3 mb-10">
                <TabsTrigger value="finder" className="gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">Furniture</span> Finder
                </TabsTrigger>
                <TabsTrigger value="style" className="gap-1.5">
                  <Palette className="h-4 w-4" />
                  <span className="hidden sm:inline">Style</span> Personality
                </TabsTrigger>
                <TabsTrigger value="planner" className="gap-1.5">
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Room</span> Planner
                </TabsTrigger>
              </TabsList>

              <TabsContent value="finder">
                <ProductQuiz products={quizProducts} categories={quizCategories} />
              </TabsContent>
              <TabsContent value="style">
                <StylePersonalityQuiz />
              </TabsContent>
              <TabsContent value="planner">
                <RoomMakeoverPlanner />
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </Layout>
    </>
  );
};

export default Quiz;
