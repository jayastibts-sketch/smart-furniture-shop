import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch product catalog for context
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: products } = await supabase
      .from("products")
      .select("name, price, material, slug, description, in_stock")
      .eq("is_active", true)
      .limit(50);

    const { data: categories } = await supabase
      .from("categories")
      .select("name, slug, description")
      .eq("is_active", true);

    const productCatalog = products?.map(p => 
      `- ${p.name}: ₹${p.price.toLocaleString("en-IN")} | ${p.material || "Wood"} | ${p.in_stock ? "In Stock" : "Out of Stock"} | /products/${p.slug}`
    ).join("\n") || "No products available";

    const categoriesList = categories?.map(c => `- ${c.name}: ${c.description}`).join("\n") || "";

    const systemPrompt = `You are the Guna Woodcraft AI Assistant — a friendly, knowledgeable furniture expert for a premium handcrafted wooden furniture store based in Ranipet, India.

YOUR CAPABILITIES:
1. **Product Recommendations**: Help customers find the right furniture based on their needs, room, budget, and style preferences.
2. **Product Information**: Answer questions about materials (teak, rosewood, sheesham, mango wood), dimensions, pricing, and availability.
3. **Order Support**: Guide customers on order tracking (they can visit /order/ORDER-NUMBER), shipping (free delivery in Ranipet), and returns.
4. **FAQ Answers**: Respond to common questions about delivery times (7-12 days depending on category), payment methods, customization options, and care instructions.
5. **Style Advice**: Offer interior design tips and wood care guidance.

PRODUCT CATALOG:
${productCatalog}

CATEGORIES:
${categoriesList}

STORE INFO:
- Store: Guna Woodcraft, Ranipet, Tamil Nadu
- Free delivery in Ranipet area
- All furniture is handcrafted from solid wood
- Payment: COD and online payment accepted
- Customization available on request
- Contact page: /contact

RULES:
- Keep responses concise (2-4 sentences for simple questions, more for recommendations).
- Always recommend specific products with prices when relevant.
- Use ₹ for prices and format with Indian numbering (e.g., ₹45,000).
- Be warm, helpful, and professional. Use occasional emojis.
- If asked about something unrelated to furniture/home decor, politely redirect.
- When recommending products, include the product page link like: [Product Name](/products/slug)
- Never make up products that aren't in the catalog.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "I'm getting too many requests right now. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service credits exhausted. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
