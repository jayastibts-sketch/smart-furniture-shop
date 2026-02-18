import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data, error } = await resend.emails.send({
      from: "Guna Woodcraft <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to the Guna Woodcraft Family! 🌿",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Welcome to Guna Woodcraft</title>
        </head>
        <body style="margin:0;padding:0;background-color:#f9f6f2;font-family:'Georgia',serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f6f2;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color:#c2440a;padding:36px 48px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:bold;letter-spacing:1px;">Guna Woodcraft</h1>
                      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;letter-spacing:2px;text-transform:uppercase;">Premium Handcrafted Wooden Furniture</p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:48px 48px 32px;">
                      <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:24px;">Welcome to our family! 🙏</h2>
                      <p style="margin:0 0 20px;color:#555555;font-size:16px;line-height:1.7;">
                        Thank you for subscribing to the Guna Woodcraft newsletter. We're thrilled to have you with us!
                      </p>
                      <p style="margin:0 0 20px;color:#555555;font-size:16px;line-height:1.7;">
                        As a subscriber, you'll be the <strong>first to know</strong> about:
                      </p>
                      <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                        <tr>
                          <td style="padding:8px 0;color:#555555;font-size:15px;">🪵 &nbsp; New handcrafted furniture collections</td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0;color:#555555;font-size:15px;">🎁 &nbsp; Exclusive subscriber-only discounts</td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0;color:#555555;font-size:15px;">✨ &nbsp; Limited edition & seasonal pieces</td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0;color:#555555;font-size:15px;">🚚 &nbsp; Free delivery on all orders</td>
                        </tr>
                      </table>

                      <!-- CTA Button -->
                      <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                        <tr>
                          <td style="background-color:#c2440a;border-radius:8px;">
                            <a href="https://10e308e0-5d54-49ec-aec3-802a69cbac32.lovableproject.com/products"
                               style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;letter-spacing:0.5px;">
                              Shop Our Collection →
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin:0;color:#888888;font-size:14px;line-height:1.6;">
                        Have questions? We're always happy to help. Just reply to this email or contact us at
                        <a href="tel:+919791459490" style="color:#c2440a;">+91 97914 59490</a>.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#f5f0eb;padding:24px 48px;text-align:center;border-top:1px solid #e8e0d5;">
                      <p style="margin:0 0 6px;color:#888888;font-size:13px;">
                        Guna Woodcraft · 123 Thiruvika Street, Ranipet - 632401, Tamil Nadu, India
                      </p>
                      <p style="margin:0;color:#aaaaaa;font-size:12px;">
                        You're receiving this because you subscribed at gunawoodcraft.com.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to send welcome email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: data?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
