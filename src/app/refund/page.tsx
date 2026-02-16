import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Viotraix Refund Policy — All digital payments are non-refundable",
};

export default function RefundPage() {
  return (
    <>
      <Navbar />
      <main className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-[300px] w-[500px] rounded-full bg-accent/5 blur-[100px]" />
        <div className="relative">
          <h1 className="mb-8 text-3xl font-bold">Refund Policy</h1>
          <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
            <p className="text-xs text-muted">Last updated: February 2026</p>

            <section className="rounded-2xl border border-danger/30 bg-danger/5 p-6 backdrop-blur-sm">
              <h2 className="mb-2 text-lg font-semibold text-foreground">All Sales Are Final</h2>
              <p>
                All digital and electronic payments made for Viotraix services are
                <strong className="text-foreground"> final and non-refundable</strong>. This is a
                strict no-refund policy that applies to all transactions without exception,
                including but not limited to:
              </p>
              <ul className="mt-3 list-disc pl-5 space-y-1">
                <li>Monthly and annual subscription payments</li>
                <li>Single audit one-time purchases</li>
                <li>Plan upgrades, downgrades, or changes</li>
                <li>Partial billing period charges</li>
                <li>Any other digital or electronic payment made to Viotraix</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
              <h2 className="mb-2 text-lg font-semibold text-foreground">Instant Digital Delivery</h2>
              <p>
                Viotraix is a digital service that begins delivery immediately upon payment.
                By completing a purchase, you consent to instant delivery of the digital service
                and expressly waive any cooling-off period or right of withdrawal, including
                under EU Directive 2011/83/EU, Article 16(m).
              </p>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
              <h2 className="mb-2 text-lg font-semibold text-foreground">Subscription Cancellation</h2>
              <p>
                You may cancel your subscription at any time through your account settings.
                Upon cancellation, you will retain access to subscription features until the end
                of your current billing period. No prorated or partial refunds will be issued
                for the remaining time in a billing period. After the period ends, your account
                will be downgraded and you will lose access to subscription features.
              </p>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
              <h2 className="mb-2 text-lg font-semibold text-foreground">Chargebacks</h2>
              <p>
                Initiating a chargeback or payment dispute with your bank or payment provider
                is considered a breach of our Terms of Service. We maintain detailed server logs
                and timestamps as proof of service delivery. All chargebacks will be contested
                with evidence of digital delivery.
              </p>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
              <h2 className="mb-2 text-lg font-semibold text-foreground">Payment Processing</h2>
              <p>
                All payments are processed through Lemon Squeezy as our Merchant of Record.
                Lemon Squeezy may, at their sole discretion, issue refunds in accordance with
                their own merchant policies. This does not create any obligation on behalf of
                Viotraix to issue refunds.
              </p>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
              <h2 className="mb-2 text-lg font-semibold text-foreground">Contact</h2>
              <p>
                If you experience a technical issue that prevents service delivery, contact us at{" "}
                <a href="mailto:paktechknowledge@gmail.com" className="text-accent hover:underline">
                  paktechknowledge@gmail.com
                </a>
                . While we do not issue refunds, we will make reasonable efforts to resolve
                technical issues and ensure service delivery.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
