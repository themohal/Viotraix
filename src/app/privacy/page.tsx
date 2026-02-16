import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Viotraix Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-[300px] w-[500px] rounded-full bg-accent2/5 blur-[100px]" />
        <div className="relative">
          <h1 className="mb-8 text-3xl font-bold">Privacy Policy</h1>
          <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
            <p className="text-xs text-muted">Last updated: February 2026</p>

            <section className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
              <h2 className="mb-2 text-lg font-semibold text-foreground">1. Information We Collect</h2>
              <p>
                We collect information you provide when creating an account (name, email),
                images you upload for analysis, and usage data (audit history, subscription
                status). We also collect standard web analytics data.
              </p>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
              <h2 className="mb-2 text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
              <p>
                Your information is used to provide the Service, process payments, improve our AI
                analysis, communicate about your account, and comply with legal obligations.
                Uploaded images are sent to OpenAI for analysis and are subject to OpenAI&apos;s data
                usage policies.
              </p>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
              <h2 className="mb-2 text-lg font-semibold text-foreground">3. Data Storage</h2>
              <p>
                Your data is stored securely using Supabase (PostgreSQL) and Supabase Storage.
                Images are stored in private buckets accessible only to your account. We use
                industry-standard encryption for data in transit and at rest.
              </p>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
              <h2 className="mb-2 text-lg font-semibold text-foreground">4. Third-Party Services</h2>
              <p>
                We use the following third-party services: Supabase (database and authentication),
                OpenAI (AI image analysis), Lemon Squeezy (payment processing), and Vercel
                (hosting). Each has their own privacy policy governing their data practices.
              </p>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
              <h2 className="mb-2 text-lg font-semibold text-foreground">5. Data Retention</h2>
              <p>
                We retain your data for as long as your account is active. You can request
                deletion of your account and associated data at any time by contacting us.
              </p>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
              <h2 className="mb-2 text-lg font-semibold text-foreground">6. Your Rights</h2>
              <p>
                You have the right to access, correct, or delete your personal data. You can
                export your audit data at any time from your account settings.
              </p>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
              <h2 className="mb-2 text-lg font-semibold text-foreground">7. Contact</h2>
              <p>
                For privacy-related inquiries, contact us at{" "}
                <a href="mailto:paktechknowledge@gmail.com" className="text-accent hover:underline">
                  paktechknowledge@gmail.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
