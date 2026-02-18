import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OrderStatusEmailRequest {
  orderNumber: string;
  newStatus: string;
}

const getStatusMessage = (status: string): { subject: string; message: string } => {
  switch (status) {
    case "processing":
      return {
        subject: "Your order is being processed",
        message: "Great news! We've started processing your order. We're preparing your items with care.",
      };
    case "shipped":
      return {
        subject: "Your order has been shipped!",
        message: "Exciting news! Your order is on its way to you. You can expect delivery within 3-5 business days.",
      };
    case "delivered":
      return {
        subject: "Your order has been delivered!",
        message: "Your order has been successfully delivered. We hope you love your new furniture!",
      };
    case "cancelled":
      return {
        subject: "Your order has been cancelled",
        message: "Your order has been cancelled. If you have any questions, please contact our support team.",
      };
    default:
      return {
        subject: "Order status update",
        message: `Your order status has been updated to: ${status}`,
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Use service role client to verify the user from the token
    const supabaseServiceClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify the user using getUser with the token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseServiceClient.auth.getUser(token);
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user has admin role using service client
    const { data: roleData } = await supabaseServiceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { orderNumber, newStatus }: OrderStatusEmailRequest = await req.json();

    if (!orderNumber || !newStatus) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: orderNumber and newStatus" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch order details from database using service role client (already created above)
    const { data: order, error: orderError } = await supabaseServiceClient
      .from("orders")
      .select("id, order_number, total, user_id")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch customer profile
    const { data: profile } = await supabaseServiceClient
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", order.user_id)
      .maybeSingle();

    if (!profile?.email) {
      return new Response(
        JSON.stringify({ error: "Customer email not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { subject, message } = getStatusMessage(newStatus);
    const customerName = profile.full_name || "Customer";

    const emailResponse = await resend.emails.send({
      from: "Furnish Store <onboarding@resend.dev>",
      to: [profile.email],
      subject: `${subject} - Order #${orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #8B7355 0%, #6B5B45 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 28px;">Furnish</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">Premium Furniture Store</p>
          </div>
          
          <div style="background: #fff; padding: 30px; border: 1px solid #e5e5e5; border-top: none;">
            <h2 style="color: #333; margin-top: 0;">Hello ${customerName}!</h2>
            
            <p style="font-size: 16px;">${message}</p>
            
            <div style="background: #f8f8f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px; color: #555;">Order Details</h3>
              <p style="margin: 5px 0;"><strong>Order Number:</strong> ${orderNumber}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #8B7355; font-weight: bold; text-transform: capitalize;">${newStatus}</span></p>
              <p style="margin: 5px 0;"><strong>Total:</strong> ₹${Number(order.total).toLocaleString()}</p>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              If you have any questions about your order, please don't hesitate to contact our customer support team.
            </p>
          </div>
          
          <div style="background: #333; color: #fff; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="margin: 0; font-size: 14px;">Thank you for shopping with Furnish!</p>
            <p style="margin: 5px 0 0; font-size: 12px; color: #999;">© 2024 Furnish. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
