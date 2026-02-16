import { getServiceSupabase } from "./supabase";

const APP_NAME = "Viotraix";
const SUPPORT_EMAIL = "paktechknowledge@gmail.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function buildRenewalEmailHtml(
  userName: string,
  plan: string,
  daysRemaining: number,
  periodEnd: string
): string {
  const endDate = new Date(periodEnd).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const urgency =
    daysRemaining <= 1
      ? "expires tomorrow"
      : `expires in ${daysRemaining} days`;

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #050a09; color: #f0f5f3; padding: 40px 24px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #10b981; font-size: 28px; margin: 0;">${APP_NAME}</h1>
        <p style="color: #8fb8a6; font-size: 14px; margin-top: 4px;">AI-Powered Workplace Safety Inspector</p>
      </div>

      <div style="background: #0a1512; border: 1px solid #152e25; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #f0f5f3; font-size: 20px; margin: 0 0 12px 0;">
          Your subscription ${urgency}
        </h2>
        <p style="color: #8fb8a6; font-size: 14px; line-height: 1.6; margin: 0;">
          Hi ${userName || "there"},
        </p>
        <p style="color: #8fb8a6; font-size: 14px; line-height: 1.6;">
          Your <strong style="color: #10b981;">${plan.charAt(0).toUpperCase() + plan.slice(1)}</strong> plan
          is set to renew on <strong style="color: #f0f5f3;">${endDate}</strong>.
        </p>
        <p style="color: #8fb8a6; font-size: 14px; line-height: 1.6;">
          To ensure uninterrupted access to AI-powered safety audits, please make sure your
          payment method is up to date. If your subscription lapses, you will lose access
          to audit history and new audit capabilities.
        </p>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${APP_URL}/billing" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669, #f59e0b); color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 700; font-size: 14px;">
          Manage Subscription
        </a>
      </div>

      <div style="border-top: 1px solid #152e25; padding-top: 16px; text-align: center;">
        <p style="color: #5e8a78; font-size: 12px; margin: 0;">
          Questions? Contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color: #10b981;">${SUPPORT_EMAIL}</a>
        </p>
        <p style="color: #5e8a78; font-size: 12px; margin-top: 4px;">
          &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
        </p>
      </div>
    </div>
  `;
}

export async function sendRenewalReminder(
  email: string,
  userName: string,
  plan: string,
  daysRemaining: number,
  periodEnd: string
): Promise<boolean> {
  // Use Supabase Edge Functions or a simple SMTP approach
  // For now, we log and use Supabase's built-in email via the admin API
  // In production, integrate with Resend, SendGrid, or similar
  const supabase = getServiceSupabase();

  const subject =
    daysRemaining <= 1
      ? `${APP_NAME}: Your subscription expires tomorrow`
      : `${APP_NAME}: Your subscription expires in ${daysRemaining} days`;

  const html = buildRenewalEmailHtml(userName, plan, daysRemaining, periodEnd);

  // Store the reminder in a notifications table so we don't send duplicates
  const { error } = await supabase.from("email_notifications").insert({
    email,
    subject,
    html_body: html,
    type: `renewal_reminder_${daysRemaining}d`,
    sent_at: new Date().toISOString(),
  });

  if (error) {
    // Table might not exist yet — that's okay, we still attempt to send
    console.error("Failed to log notification:", error.message);
  }

  // Attempt to send via fetch to an email service
  // This is a placeholder — replace with your email provider's API
  try {
    const emailApiKey = process.env.EMAIL_API_KEY;
    const emailFrom = process.env.EMAIL_FROM || `noreply@viotraix.com`;

    if (emailApiKey) {
      // Example: Resend API
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${emailApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${APP_NAME} <${emailFrom}>`,
          to: [email],
          subject,
          html,
        }),
      });
    } else {
      // No email provider configured — log for manual follow-up
      console.log(`[EMAIL REMINDER] To: ${email} | Subject: ${subject}`);
    }

    return true;
  } catch (err) {
    console.error("Failed to send email:", err);
    return false;
  }
}
