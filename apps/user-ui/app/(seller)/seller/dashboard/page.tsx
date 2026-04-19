"use client";

// app/(seller)/seller/dashboard/page.tsx
//
// The OVERVIEW page — first thing a seller sees after login.
// Shows: stats, recent orders, quick actions.
// Data comes from useSellerMe() + future useSellerStats() hook.

import { useSellerMe } from "@/hooks/seller-hook";
import {
  ArrowUpRight,
  Box,
  DollarSign,
  Package,
  Plus,
  ShoppingBag,
  Star,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  color,
}: {
  label: string;
  value: string;
  icon: any;
  trend?: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-white/6 bg-white/2 p-5">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <div className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-1">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">
              {trend}
            </span>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-white/40">{label}</p>
    </div>
  );
}

// ── Quick action card ─────────────────────────────────────────────────────────
function QuickAction({
  label,
  desc,
  href,
  icon: Icon,
}: {
  label: string;
  desc: string;
  href: string;
  icon: any;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-xl border border-white/6 bg-white/2 p-4 transition-all hover:border-white/10 hover:bg-white/4 group"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <Icon className="h-5 w-5 text-emerald-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-white/30 truncate">{desc}</p>
      </div>
      <ArrowUpRight className="h-4 w-4 text-white/20 group-hover:text-white/50 transition-colors" />
    </Link>
  );
}

export default function SellerDashboardPage() {
  const { data: seller } = useSellerMe();

  // Placeholder stats — replace with real API call when you build analytics
  // Pattern: start with hardcoded data, then swap in real data without changing the UI
  const stats = [
    {
      label: "Total Revenue",
      value: "$0.00",
      icon: DollarSign,
      trend: "+0%",
      color: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    },
    {
      label: "Total Orders",
      value: "0",
      icon: ShoppingBag,
      trend: "+0%",
      color: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    },
    {
      label: "Total Products",
      value: "0",
      icon: Box,
      color: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    },
    {
      label: "Avg. Rating",
      value: "—",
      icon: Star,
      color: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* ── Welcome banner ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-emerald-500/10 bg-linear-to-r from-emerald-500/5 to-teal-500/5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">
              Welcome back, {seller?.name?.split(" ")[0] ?? "Seller"} 👋
            </h2>
            <p className="text-sm text-white/40">
              {seller?.shop
                ? `Managing ${seller.shop.name} · ${seller.shop.category}`
                : "Your store is ready to grow"}
            </p>
          </div>
          <Link
            href="/seller/dashboard/products/create"
            className="flex items-center gap-2 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-bold text-black transition-all hover:from-emerald-400 hover:to-teal-400 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </div>
      </div>

      {seller?.shop && !seller?.stripeId && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-amber-300">
                Complete payouts setup
              </h3>
              <p className="mt-1 text-sm text-white/50">
                Connect Stripe to receive payments, payouts, and process live
                orders.
              </p>
            </div>

            <Link
              href="/seller/connect-stripe"
              className="inline-flex items-center justify-center rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-black transition hover:bg-amber-300"
            >
              Connect Stripe
            </Link>
          </div>
        </div>
      )}

      {/* ── Stats grid ─────────────────────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-medium text-white/40 uppercase tracking-widest mb-4">
          Overview
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </div>

      {/* ── Quick actions ───────────────────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-medium text-white/40 uppercase tracking-widest mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <QuickAction
            label="Add New Product"
            desc="List a new item in your store"
            href="/seller/dashboard/products/create"
            icon={Plus}
          />
          <QuickAction
            label="View All Products"
            desc="Manage your inventory"
            href="/seller/dashboard/products"
            icon={Box}
          />
          <QuickAction
            label="View Orders"
            desc="Check and fulfill orders"
            href="/seller/dashboard/orders"
            icon={Package}
          />
          <QuickAction
            label="Shop Settings"
            desc="Update your shop details"
            href="/seller/dashboard/shop"
            icon={Star}
          />
        </div>
      </div>

      {/* ── Recent orders placeholder ───────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-medium text-white/40 uppercase tracking-widest mb-4">
          Recent Orders
        </h3>
        <div className="rounded-2xl border border-white/6 bg-white/2 p-8 text-center">
          <ShoppingBag className="h-10 w-10 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">No orders yet</p>
          <p className="text-xs text-white/20 mt-1">
            Orders will appear here once customers start buying
          </p>
        </div>
      </div>
    </div>
  );
}
