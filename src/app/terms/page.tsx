import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Viotraix Terms of Service",
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-[300px] w-[500px] rounded-full bg-accent/5 blur-[100px]" />
        <div className="relative">
          <h1 className="mb-8 text-3xl font-bold">Terms of Service</h1>
          <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
            <p className="text-xs text-muted">Last updated: February 2026</p>

            <section className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
              <h2 className="mb-2 text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p>
                By accessing or using Viotraix (&quot;the Service&quot;), you agree to be bound by these
                Terms of Service. If you do not agree, do not use the Service.
              </p>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
              <h2 className="mb-2 text-lg font-semibold text-foreground">2. Description of Service</h2>
              <p>
                Viotraix provides AI-powered visual compliance and safety inspection tools for
                workplaces. Users upload photos which are analyzed by artificial intelligence to
                detect potential safety violations and compliance issues. All services are
                delivered digitally and electronically.
              </p>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
              <h2 className="mb-2 text-lg font-semibold text-foreground">3. Disclaimer</h2>
              <p>
                Viotraix is a screening and monitoring tool. It does NOT replace professional
                safety audits, OSHA inspections, or certified safety consultants. Results are
                AI-generated assessments and should be used as supplementary guidance only.
                Viotraix is not liable for any violations, fines, or incidents that may occur.
              </p>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
              <h2 className="mb-2 text-lg font-semibold text-foreground">4. User Accounts</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials
                and for all activities under your account. You must provide accurate information
                when creating an account.
              </p>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
              <h2 className="mb-2 text-lg font-semibold text-foreground">5. Acceptable Use</h2>
              <p>
                You agree not to misuse the Service, including uploading illegal content,
                attempting to reverse-engineer the AI system, or using the Service for any
                unlawful purpose.
              </p>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
              <h2 className="mb-2 text-lg font-semibold text-foreground">6. Payments, Billing &amp; Subscriptions</h2>
              <p>
                Paid plans are billed monthly or as one-time purchases via our payment processor
                (Lemon Squeezy). Prices are in USD and may change with notice. Subscriptions
                auto-renew unless cancelled before the end of the current billing period. You will
                receive email reminders 5 days and 1 day before your subscription renewal date.
              </p>
              <p className="mt-3">
                Upon cancellation, your subscription remains active until the end of the current
                billing period. After the period ends, access to subscription features will be
                revoked and your plan will be downgraded.
              </p>
            </section>

            <section className="rounded-2xl border border-danger/30 bg-danger/5 p-6 backdrop-blur-sm">
              <h2 className="mb-2 text-lg font-semibold text-foreground">7. No Refunds — All Digital Payments Are Final</h2>
              <p>
                All payments made for Viotraix services — including subscriptions, one-time
                audit purchases, and any other digital or electronic transactions — are
                <strong className="text-foreground"> final and non-refundable</strong>. This
                includes, without limitation:
              </p>
              <ul className="mt-3 list-disc pl-5 space-y-1">
                <li>Monthly and annual subscription payments</li>
                <li>Single audit purchases</li>
                <li>Plan upgrades or downgrades</li>
                <li>Any partial billing period charges</li>
                <li>All other digital or electronic payments</li>
              </ul>
              <p className="mt-3">
                By completing a purchase, you acknowledge and agree that you are purchasing a
                digital service that is delivered immediately upon payment. You expressly waive
                any right to a refund, chargeback, or reversal of payment. Initiating a
                chargeback or payment dispute is considered a breach of these Terms.
              </p>
              <p className="mt-3">
                Lemon Squeezy acts as our Merchant of Record and may, at their sole discretion,
                issue refunds in accordance with their own policies.
              </p>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
              <h2 className="mb-2 text-lg font-semibold text-foreground">8. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, Viotraix shall not be liable for any
                indirect, incidental, special, or consequential damages arising from use of the
                Service. Total liability is limited to the amount paid for the specific
                transaction giving rise to the claim.
              </p>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
              <h2 className="mb-2 text-lg font-semibold text-foreground">9. AI Content Acknowledgment</h2>
              <p>
                All audit reports and safety assessments are generated by artificial intelligence.
                Results may vary and should not be considered professional safety advice.
                Viotraix does not guarantee the accuracy, completeness, or reliability of
                AI-generated content.
              </p>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
              <h2 className="mb-2 text-lg font-semibold text-foreground">10. Changes to Terms</h2>
              <p>
                We may update these Terms from time to time. Continued use of the Service after
                changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
              <h2 className="mb-2 text-lg font-semibold text-foreground">11. Contact</h2>
              <p>
                For questions about these Terms, contact us at{" "}
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
