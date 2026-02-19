"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase";
import LoadingSpinner from "./LoadingSpinner";

const tiers = [
  {
    name: "Single Audit",
    price: "$4.99",
    period: "one-time",
    description: "Perfect for a quick one-off inspection",
    audits: "1 audit",
    features: [
      "Full detailed report",
      "All violation categories",
      "Fix recommendations",
      "Regulatory references",
    ],
    cta: "Buy Single Audit",
    variant: "single",
    popular: false,
    gradient: false,
  },
  {
    name: "Basic",
    price: "$29",
    period: "/mo",
    description: "For small businesses running regular checks",
    audits: "50 audits/mo",
    features: [
      "Full detailed reports",
      "Audit history & search",
      "All violation categories",
      "Fix recommendations",
    ],
    cta: "Get Basic",
    variant: "basic",
    popular: true,
    gradient: true,
  },
  {
    name: "Pro",
    price: "$79",
    period: "/mo",
    description: "For enterprises and multi-site operations",
    audits: "200 audits/mo",
    features: [
      "Everything in Basic",
      "Bulk upload (up to 10 images)",
      "Priority AI processing",
      "PDF export",
      "Analytics dashboard",
      "OSHA, NFPA, FDA references",
    ],
    cta: "Get Pro",
    variant: "pro",
    popular: false,
    gradient: false,
  },
];

export default function PricingCards({ showTitle = true }: { showTitle?: boolean }) {
  const [loadingVariant, setLoadingVariant] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();
  }, []);

  const handleCheckout = async (variant: string) => {
    // Redirect to login if not authenticated
    if (!isLoggedIn) {
      router.push("/login?redirect=pricing");
      return;
    }

    setLoadingVariant(variant);
    try {
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login?redirect=pricing");
        return;
      }

      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          tier: variant,
          type: variant === "single" ? "one_time" : "subscription",
        }),
      });
      const data = await res.json();

      if (res.status === 401) {
        router.push("/login?redirect=pricing");
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch {
      // handled silently
    } finally {
      setLoadingVariant(null);
    }
  };

  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {showTitle && (
          <div className="mb-16 text-center">
            <span className="inline-block rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
              Pricing
            </span>
            <h2 className="mt-4 text-3xl font-bold sm:text-5xl">
              Invest in safety.{" "}
              <span className="bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent">
                Save thousands.
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Professional safety audits cost $500-2,000+ each. Get the same AI-powered insights for a fraction of the price.
            </p>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`group relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 ${
                tier.popular
                  ? "scale-[1.02] lg:scale-105"
                  : "hover:scale-[1.02]"
              }`}
            >
              {/* Glow behind popular card */}
              {tier.popular && (
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-accent via-accent2 to-accent opacity-100" />
              )}

              <div
                className={`relative flex flex-1 flex-col rounded-2xl p-8 ${
                  tier.popular
                    ? "bg-[#061210]"
                    : "border border-border/60 bg-card/80 backdrop-blur-sm hover:border-border-hover"
                }`}
              >
                {tier.popular && (
                  <div className="absolute right-6 top-6 rounded-full bg-gradient-to-r from-accent to-accent2 px-3 py-1 text-xs font-bold text-white shadow-lg shadow-accent/20">
                    Most Popular
                  </div>
                )}

                <h3 className="text-xl font-bold">{tier.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold tracking-tight">{tier.price}</span>
                  {tier.period && (
                    <span className="text-base text-muted-foreground">{tier.period}</span>
                  )}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{tier.description}</p>

                <div className="mt-6 rounded-xl bg-accent/5 border border-accent/10 px-4 py-2.5 text-sm font-semibold text-accent">
                  {tier.audits}
                </div>

                <ul className="mt-6 flex-1 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10">
                        <svg
                          className="h-3 w-3 text-accent"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(tier.variant)}
                  disabled={loadingVariant === tier.variant}
                  className={`mt-8 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold transition-all duration-300 disabled:opacity-50 ${
                    tier.popular
                      ? "bg-gradient-to-r from-accent to-accent2 text-white shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 hover:brightness-110"
                      : "border border-border text-foreground hover:border-accent/50 hover:bg-accent/5 hover:shadow-lg hover:shadow-accent/10"
                  }`}
                >
                  {loadingVariant === tier.variant && <LoadingSpinner size="sm" />}
                  {tier.cta}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
