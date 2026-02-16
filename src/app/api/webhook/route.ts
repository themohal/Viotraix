import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import crypto from "crypto";

function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-signature") || "";
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "";

    if (!verifyWebhookSignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta?.event_name;
    const customData = payload.meta?.custom_data;
    const userId = customData?.user_id;

    if (!userId) {
      return NextResponse.json({ error: "No user ID" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const attributes = payload.data?.attributes;

    switch (eventName) {
      case "subscription_created": {
        const variantId = String(attributes?.variant_id);
        const tierFromCustom = customData?.tier;
        let plan = tierFromCustom || "basic";
        if (!tierFromCustom) {
          if (variantId === process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_ID_PRO) {
            plan = "pro";
          }
        }

        await supabase
          .from("profiles")
          .update({
            plan,
            ls_customer_id: String(attributes?.customer_id),
            ls_subscription_id: String(payload.data?.id),
            subscription_status: "active",
            current_period_start: attributes?.created_at,
            current_period_end: attributes?.renews_at,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        // Create usage tracking record
        const limit = plan === "pro" ? 200 : 50;
        await supabase.from("usage_tracking").insert({
          user_id: userId,
          period_start: attributes?.created_at,
          period_end: attributes?.renews_at,
          audits_used: 0,
          audits_limit: limit,
        });

        break;
      }

      case "subscription_payment_success":
      case "subscription_resumed": {
        // Reset usage for new billing period / reactivation
        const { data: profileData } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", userId)
          .single();

        const renewPlan = profileData?.plan || "basic";
        const renewLimit = renewPlan === "pro" ? 200 : 50;

        await supabase
          .from("profiles")
          .update({
            plan: renewPlan === "none" || renewPlan === "expired" ? "basic" : renewPlan,
            subscription_status: "active",
            current_period_start: attributes?.created_at || new Date().toISOString(),
            current_period_end: attributes?.renews_at,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        await supabase.from("usage_tracking").insert({
          user_id: userId,
          period_start: attributes?.created_at || new Date().toISOString(),
          period_end: attributes?.renews_at,
          audits_used: 0,
          audits_limit: renewLimit,
        });

        break;
      }

      case "subscription_cancelled": {
        await supabase
          .from("profiles")
          .update({
            subscription_status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
        break;
      }

      case "subscription_expired": {
        await supabase
          .from("profiles")
          .update({
            subscription_status: "expired",
            plan: "none",
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
        break;
      }

      case "subscription_payment_failed": {
        // Payment failed — mark subscription as past_due
        await supabase
          .from("profiles")
          .update({
            subscription_status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
        break;
      }

      case "order_created": {
        // One-time purchase
        await supabase.from("one_time_purchases").insert({
          user_id: userId,
          ls_order_id: String(payload.data?.id),
          audits_purchased: 1,
          audits_remaining: 1,
        });
        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
