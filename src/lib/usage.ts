import { getServiceSupabase } from "./supabase";

const PLAN_LIMITS: Record<string, number> = {
  basic: 50,
  pro: 200,
};

export async function getUserUsage(userId: string) {
  const supabase = getServiceSupabase();

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, subscription_status, current_period_start, current_period_end")
    .eq("id", userId)
    .single();

  if (!profile) {
    return { canAudit: false, auditsUsed: 0, auditsLimit: 0, plan: "none", expired: false, expiredAt: null };
  }

  const plan = profile.plan || "none";

  // Check if subscription period has expired (regardless of status)
  if (
    (plan === "basic" || plan === "pro") &&
    profile.current_period_end
  ) {
    const periodEnd = new Date(profile.current_period_end);
    if (periodEnd < new Date()) {
      // Period has ended — subscription is expired, user must renew
      return {
        canAudit: false,
        auditsUsed: 0,
        auditsLimit: 0,
        plan: "expired",
        expired: true,
        expiredAt: profile.current_period_end,
      };
    }
  }

  // For expired or past_due statuses, block access
  if (
    profile.subscription_status === "expired" ||
    profile.subscription_status === "past_due"
  ) {
    return {
      canAudit: false,
      auditsUsed: 0,
      auditsLimit: 0,
      plan: "expired",
      expired: true,
      expiredAt: profile.current_period_end,
    };
  }

  const isSubscriptionActive =
    profile.subscription_status === "active" ||
    profile.subscription_status === "cancelled"; // cancelled still active until period end

  // For subscribed users, check usage_tracking
  if (isSubscriptionActive && (plan === "basic" || plan === "pro")) {
    const { data: usage } = await supabase
      .from("usage_tracking")
      .select("audits_used, audits_limit")
      .eq("user_id", userId)
      .gte("period_end", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (usage) {
      return {
        canAudit: usage.audits_used < usage.audits_limit,
        auditsUsed: usage.audits_used,
        auditsLimit: usage.audits_limit,
        plan,
        expired: false,
        expiredAt: profile.current_period_end,
      };
    }

    // No usage record yet — create one
    const limit = PLAN_LIMITS[plan] || 0;
    const periodStart = profile.current_period_start || new Date().toISOString();
    const periodEnd =
      profile.current_period_end ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await supabase.from("usage_tracking").insert({
      user_id: userId,
      period_start: periodStart,
      period_end: periodEnd,
      audits_used: 0,
      audits_limit: limit,
    });

    return { canAudit: true, auditsUsed: 0, auditsLimit: limit, plan, expired: false, expiredAt: periodEnd };
  }

  // Check one-time purchases
  const { data: purchases } = await supabase
    .from("one_time_purchases")
    .select("audits_remaining")
    .eq("user_id", userId)
    .gt("audits_remaining", 0);

  const remainingPurchased = (purchases || []).reduce(
    (sum, p) => sum + p.audits_remaining,
    0
  );

  if (remainingPurchased > 0) {
    return {
      canAudit: true,
      auditsUsed: 0,
      auditsLimit: remainingPurchased,
      plan: "single",
      expired: false,
      expiredAt: null,
    };
  }

  // No active plan or purchases
  return {
    canAudit: false,
    auditsUsed: 0,
    auditsLimit: 0,
    plan: "none",
    expired: false,
    expiredAt: null,
  };
}

export async function incrementUsage(userId: string) {
  const supabase = getServiceSupabase();

  // Try increment subscription usage
  const { data: usage } = await supabase
    .from("usage_tracking")
    .select("id, audits_used")
    .eq("user_id", userId)
    .gte("period_end", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (usage) {
    await supabase
      .from("usage_tracking")
      .update({ audits_used: usage.audits_used + 1 })
      .eq("id", usage.id);
    return;
  }

  // Try decrement one-time purchase
  const { data: purchase } = await supabase
    .from("one_time_purchases")
    .select("id, audits_remaining")
    .eq("user_id", userId)
    .gt("audits_remaining", 0)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (purchase) {
    await supabase
      .from("one_time_purchases")
      .update({ audits_remaining: purchase.audits_remaining - 1 })
      .eq("id", purchase.id);
  }
}
