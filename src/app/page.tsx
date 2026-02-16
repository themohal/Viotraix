import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PricingCards from "@/components/PricingCards";
import Link from "next/link";

const features = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Instant AI Analysis",
    description: "Upload a photo and get a comprehensive safety audit in under 60 seconds. No scheduling, no waiting.",
    color: "from-emerald-500 to-green-600",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    title: "Violation Detection",
    description: "Identifies fire safety, electrical, ergonomic, slip/trip, chemical, PPE, and structural hazards.",
    color: "from-red-500 to-rose-600",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: "Professional Reports",
    description: "Get detailed reports with severity ratings, fix recommendations, and OSHA/NFPA regulatory references.",
    color: "from-amber-500 to-yellow-600",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Save Thousands",
    description: "Professional safety audits cost $500-2,000+. Get the same insights starting at $4.99 per audit.",
    color: "from-teal-500 to-emerald-600",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    title: "Any Industry",
    description: "Restaurants, construction sites, warehouses, retail stores, offices — we cover all workplace types.",
    color: "from-orange-500 to-amber-600",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Avoid Costly Fines",
    description: "OSHA fines start at $13,000+ per violation. Proactive detection helps you stay compliant and avoid penalties.",
    color: "from-lime-500 to-green-600",
  },
];

const faqs = [
  {
    q: "How does Viotraix work?",
    a: "Simply upload a photo of your workplace. Our AI (powered by GPT-4o Vision) analyzes the image for safety violations, compliance issues, and hazards, then generates a detailed report with scores, violations, and fix recommendations.",
  },
  {
    q: "What types of violations can it detect?",
    a: "Viotraix detects fire safety issues, electrical hazards, ergonomic problems, slip/trip/fall risks, chemical storage violations, missing PPE, structural issues, hygiene concerns, and emergency exit problems.",
  },
  {
    q: "Is this a replacement for professional safety audits?",
    a: "Viotraix is a powerful screening and monitoring tool. While it doesn't replace official OSHA inspections, it helps you identify and fix issues proactively — before inspectors find them.",
  },
  {
    q: "What industries do you support?",
    a: "We support restaurants, construction sites, warehouses, retail stores, offices, and general workplaces. The AI adapts its analysis based on the industry detected in the image.",
  },
  {
    q: "Can I cancel my subscription?",
    a: "Yes, you can cancel anytime. Your subscription will remain active until the end of your current billing period.",
  },
  {
    q: "How accurate is the AI analysis?",
    a: "Our AI is powered by OpenAI's GPT-4o Vision, which is highly capable at identifying visual safety concerns. However, results should be used as a screening tool alongside professional judgment.",
  },
];

const stats = [
  { value: "$13K+", label: "Average OSHA fine per violation" },
  { value: "60s", label: "Average analysis time" },
  { value: "10+", label: "Violation categories detected" },
  { value: "98%", label: "Customer satisfaction" },
];

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden py-24 sm:py-36">
          {/* Animated background orbs */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-emerald-500/20 blur-[128px]" />
            <div className="absolute -bottom-20 right-1/4 h-80 w-80 rounded-full bg-amber-500/15 blur-[100px]" />
            <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500/10 blur-[80px]" />
          </div>
          {/* Grid pattern */}
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-5 py-2 text-sm font-medium text-accent backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              AI-Powered Safety Compliance
            </div>
            <h1 className="mt-8 text-5xl font-extrabold tracking-tight sm:text-7xl">
              Detect Workplace Safety
              <br />
              <span className="bg-gradient-to-r from-accent via-emerald-400 to-accent2 bg-clip-text text-transparent">
                Violations in Seconds
              </span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Upload a photo of your workplace and get an instant AI-powered safety audit.
              Identify OSHA violations, fire hazards, and compliance issues — before
              inspectors do.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/signup" className="btn-primary text-base">
                Get Started Now
              </Link>
              <Link href="/pricing" className="btn-secondary text-base">
                View Pricing
              </Link>
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="border-y border-border/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid grid-cols-2 divide-x divide-border/50 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="px-6 py-8 text-center">
                  <div className="text-3xl font-extrabold bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-16 text-center">
              <span className="inline-block rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
                Features
              </span>
              <h2 className="mt-4 text-3xl font-bold sm:text-5xl">
                Everything you need for
                <br />
                <span className="bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent">
                  workplace safety
                </span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Powerful AI analysis that catches what the human eye might miss
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-7 backdrop-blur-sm transition-all duration-300 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5"
                >
                  <div className="absolute inset-0 -z-10 bg-gradient-to-br from-accent/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} text-white shadow-lg`}>
                    {feature.icon}
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="relative py-24">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-accent/[0.02] via-transparent to-accent2/[0.02]" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-16 text-center">
              <span className="inline-block rounded-full bg-accent2/10 px-4 py-1.5 text-sm font-medium text-accent2">
                How it works
              </span>
              <h2 className="mt-4 text-3xl font-bold sm:text-5xl">
                Three simple steps
              </h2>
              <p className="mt-4 text-muted-foreground">
                From photo to professional audit in under a minute
              </p>
            </div>

            <div className="grid gap-12 sm:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Upload Photo",
                  desc: "Take a photo of your workplace and drag it into Viotraix. We support JPG, PNG, and WebP up to 10MB.",
                  gradient: "from-emerald-500 to-green-600",
                },
                {
                  step: "02",
                  title: "AI Analyzes",
                  desc: "Our GPT-4o Vision AI scans every detail for safety violations, compliance issues, and hazards.",
                  gradient: "from-green-500 to-teal-600",
                },
                {
                  step: "03",
                  title: "Get Report",
                  desc: "Receive a scored audit report with violations, severity levels, fix recommendations, and regulatory references.",
                  gradient: "from-teal-500 to-amber-500",
                },
              ].map((item) => (
                <div key={item.step} className="relative text-center">
                  <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} text-2xl font-extrabold text-white shadow-xl shadow-accent/20`}>
                    {item.step}
                  </div>
                  <h3 className="mt-6 text-xl font-bold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing">
          <PricingCards />
        </section>

        {/* FAQ */}
        <section className="py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="mb-16 text-center">
              <span className="inline-block rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
                FAQ
              </span>
              <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
                Frequently asked questions
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm transition-all hover:border-border-hover"
                >
                  <summary className="flex cursor-pointer items-center justify-between p-6 font-medium">
                    {faq.q}
                    <svg
                      className="h-5 w-5 shrink-0 text-muted transition-transform duration-300 group-open:rotate-180"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </summary>
                  <div className="border-t border-border/50 px-6 py-5 text-sm leading-relaxed text-muted-foreground">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-24">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute left-1/2 top-1/2 h-80 w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[120px]" />
          </div>
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-bold sm:text-5xl">
              Ready to make your
              <br />
              <span className="bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent">
                workplace safer?
              </span>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
              Join businesses that use Viotraix to stay compliant and avoid costly fines.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/signup" className="btn-primary text-base">
                Get Started Now
              </Link>
              <Link href="/pricing" className="btn-secondary text-base">
                View Plans
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
