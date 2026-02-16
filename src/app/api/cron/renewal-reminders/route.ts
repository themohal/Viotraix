import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { sendRenewalReminder } from "@/lib/email";

// This endpoint should be called by a cron job (e.g., Vercel Cron) once daily
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/renewal-reminders", "schedule": "0 9 * * *" }] }

export async function GET(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    const now = new Date();

    // Calculate target dates
    const fiveDaysFromNow = new Date(now);
    fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
    const fiveDayStart = new Date(fiveDaysFromNow);
    fiveDayStart.setHours(0, 0, 0, 0);
    const fiveDayEnd = new Date(fiveDaysFromNow);
    fiveDayEnd.setHours(23, 59, 59, 999);

    const oneDayFromNow = new Date(now);
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
    const oneDayStart = new Date(oneDayFromNow);
    oneDayStart.setHours(0, 0, 0, 0);
    const oneDayEnd = new Date(oneDayFromNow);
    oneDayEnd.setHours(23, 59, 59, 999);

    let sentCount = 0;

    // 5-day reminders
    const { data: fiveDayUsers } = await supabase
      .from("profiles")
      .select("id, email, full_name, plan, current_period_end")
      .eq("subscription_status", "active")
      .in("plan", ["basic", "pro"])
      .gte("current_period_end", fiveDayStart.toISOString())
      .lte("current_period_end", fiveDayEnd.toISOString());

    if (fiveDayUsers) {
      // Check which users already got the 5-day reminder
      const fiveDayIds = fiveDayUsers.map((u) => u.email);
      const { data: alreadySent } = await supabase
        .from("email_notifications")
        .select("email")
        .in("email", fiveDayIds)
        .eq("type", "renewal_reminder_5d")
        .gte("sent_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());

      const alreadySentEmails = new Set((alreadySent || []).map((n) => n.email));

      for (const user of fiveDayUsers) {
        if (alreadySentEmails.has(user.email)) continue;

        await sendRenewalReminder(
          user.email,
          user.full_name || "",
          user.plan,
          5,
          user.current_period_end
        );
        sentCount++;
      }
    }

    // 1-day reminders
    const { data: oneDayUsers } = await supabase
      .from("profiles")
      .select("id, email, full_name, plan, current_period_end")
      .eq("subscription_status", "active")
      .in("plan", ["basic", "pro"])
      .gte("current_period_end", oneDayStart.toISOString())
      .lte("current_period_end", oneDayEnd.toISOString());

    if (oneDayUsers) {
      const oneDayIds = oneDayUsers.map((u) => u.email);
      const { data: alreadySent } = await supabase
        .from("email_notifications")
        .select("email")
        .in("email", oneDayIds)
        .eq("type", "renewal_reminder_1d")
        .gte("sent_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());

      const alreadySentEmails = new Set((alreadySent || []).map((n) => n.email));

      for (const user of oneDayUsers) {
        if (alreadySentEmails.has(user.email)) continue;

        await sendRenewalReminder(
          user.email,
          user.full_name || "",
          user.plan,
          1,
          user.current_period_end
        );
        sentCount++;
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent: sentCount,
      timestamp: now.toISOString(),
    });
  } catch (err) {
    console.error("Cron renewal-reminders error:", err);
    return NextResponse.json(
      { error: "Failed to process reminders" },
      { status: 500 }
    );
  }
}
