"use client";

// app/(seller)/seller/connect-stripe/page.tsx
//
// STEP 3 of the seller journey — Connect Stripe Account
//
// HOW STRIPE CONNECT WORKS (important to understand before building):
//
// 1. Seller clicks "Connect Stripe" button
// 2. Your backend calls: stripe.accountLinks.create({ type: "account_onboarding" })
//    This returns a URL like: https://connect.stripe.com/setup/s/xxx
// 3. You redirect the seller to that URL
// 4. Seller fills their bank details, ID verification etc. on Stripe's page
// 5. Stripe redirects back to YOUR site:
//    - Success: /seller/stripe-callback?success=true
//    - Failure: /seller/stripe-callback?refresh=true (they need to retry)
// 6. Your backend receives the callback, saves stripeId on the Seller model
//
// RIGHT NOW: We build the UI shell.
// The actual Stripe API calls come when we build the payments module.
// This page calls POST /seller/stripe-connect → backend returns { url }
// We redirect to that URL.

import SellerGuard from "@/components/seller/seller-guard";
import { useSellerMe } from "@/hooks/seller-hook";

import {
  ArrowRight,
  BadgeCheck,
  Building,
  CreditCard,
  ExternalLink,
  Shield,
  TruckElectric,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// What Stripe Connect offers sellers — shown as feature bullets
const STRIPE_FEATURES = [
  {
    icon: <CreditCard className="h-4 w-4 text-emerald-400" />,
    title: "Accept payments globally",
    desc: "Cards, bank transfers, and 135+ currencies",
  },
  {
    icon: <Zap className="h-4 w-4 text-emerald-400" />,
    title: "Fast payouts",
    desc: "Funds in your bank account within 2 business days",
  },
  {
    icon: <Shield className="h-4 w-4 text-emerald-400" />,
    title: "Built-in fraud protection",
    desc: "Stripe Radar blocks fraudulent transactions automatically",
  },
  {
    icon: <BadgeCheck className="h-4 w-4 text-emerald-400" />,
    title: "Dashboard & reporting",
    desc: "Full visibility into your revenue and payouts",
  },
];

function ConnectStripeContent() {
  const { data: seller } = useSellerMe();
  const [isConnecting, setIsConnecting] = useState(false);

  // Already connected — show success state instead of the connect button
  const isConnected = !!seller?.stripeId;

  const handleConnectStripe = async () => {
    setIsConnecting(true);
    // try {
    //   // This endpoint doesn't exist yet — we'll build it in the payments module
    //   // For now it will 404, but the UI is ready
    //   // When backend is ready: POST /seller/stripe-connect returns { url: "https://connect.stripe.com/..." }
    //   const response = await clien.post("/seller/stripe-connect");
    //   const { url } = response.data;

    //   // Redirect to Stripe's hosted onboarding page
    //   // We use window.location.href (not router.push) because
    //   // this is an external URL, not an internal Next.js route
    //   window.location.href = url;
    // } catch (error: any) {
    //   toast.error(
    //     error?.response?.data?.message || "Failed to connect Stripe. Try again."
    //   );
    //   setIsConnecting(false);
    // }
  };

  return (
    <div className="min-h-screen bg-[#050810] flex items-center justify-center px-4 py-12 relative overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-15%] right-[5%] w-125 h-125 rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute bottom-[-15%] left-[5%] w-100 h-100 rounded-full bg-violet-500/4 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative w-full max-w-md">

        {/* Logo row */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-linear-to-br from-emerald-400 to-teal-500 px-3 py-1.5 text-sm font-black tracking-tight text-black">
              SHOP
            </span>
            <span className="text-sm font-light tracking-widest text-white/30 uppercase">
              ify
            </span>
          </div>
          <span className="text-xs text-white/20 tracking-widest uppercase font-medium">
            Seller Portal
          </span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-xl p-8">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Building className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] tracking-widest uppercase text-emerald-400/70 font-medium">
                  Step 3 of 3
                </p>
                <h1 className="text-xl font-bold text-white">
                  Connect Stripe
                </h1>
              </div>
            </div>
            <p className="text-sm text-white/40">
              Connect your bank account to receive payments from customers.
            </p>
          </div>

          {/* Progress bar — all 3 steps filled */}
          <div className="flex gap-1.5 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className="h-1 flex-1 rounded-full bg-linear-to-r from-emerald-400 to-teal-400"
              />
            ))}
          </div>

          {isConnected ? (
            // ── Already connected ──────────────────────────────────────────
            <div className="text-center py-4">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <BadgeCheck className="h-8 w-8 text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">
                Stripe Connected!
              </h2>
              <p className="text-sm text-white/40 mb-6">
                Your bank account is linked and you can receive payments.
              </p>
              <a
                href="/seller/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-bold text-black transition-all hover:from-emerald-400 hover:to-teal-400"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          ) : (
            // ── Not connected yet ──────────────────────────────────────────
            <div className="space-y-6">

              {/* Feature list */}
              <div className="space-y-3">
                {STRIPE_FEATURES.map((feature) => (
                  <div
                    key={feature.title}
                    className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/2 p-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                      {feature.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">
                        {feature.title}
                      </p>
                      <p className="text-xs text-white/30 mt-0.5">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stripe branding note */}
              <div className="rounded-xl border border-white/5 bg-white/2 p-4 flex items-start gap-3">
                <Shield className="h-4 w-4 text-white/30 shrink-0 mt-0.5" />
                <p className="text-xs text-white/30 leading-relaxed">
                  You'll be redirected to Stripe's secure onboarding. We never
                  store your bank details — Stripe handles everything.
                </p>
              </div>

              {/* Connect button */}
              <button
                onClick={handleConnectStripe}
                disabled={isConnecting}
                className="w-full rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 py-3 text-sm font-bold text-black transition-all hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isConnecting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                    Redirecting to Stripe...
                  </>
                ) : (
                  <>
                    Connect with Stripe
                    <ExternalLink className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Skip for now — dangerous but necessary for testing */}
              {/* In production you'd want to enforce Stripe before they can list products */}
              <button
                onClick={() => window.location.href = "/seller/dashboard"}
                className="w-full text-sm text-white/20 hover:text-white/40 transition-colors py-2"
              >
                Skip for now (limited access)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConnectStripePage() {
  return (
    <SellerGuard>
      <ConnectStripeContent />
    </SellerGuard>
  );
}