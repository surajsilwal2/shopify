"use client";

// app/(seller)/seller/dashboard/layout.tsx
//
// THE SHELL for every seller dashboard page.
// Next.js layouts wrap all child pages automatically.
// So every page under /seller/dashboard/ gets this sidebar + topbar for free.
//


import SellerGuard from "@/components/seller/seller-guard";
import { useSellerMe, useSellerLogout } from "@/hooks/seller-hook";
import {
  BarChart3,
  Box,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  Star,
  Store,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

// ── Navigation config ─────────────────────────────────────────────────────────
// Adding a new page = just add one object here. Nothing else changes.
const NAV_ITEMS = [
  { label: "Overview", href: "/seller/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/seller/dashboard/products", icon: Box },
  { label: "Orders", href: "/seller/dashboard/orders", icon: ShoppingBag },
  { label: "Analytics", href: "/seller/dashboard/analytics", icon: BarChart3 },
  { label: "Reviews", href: "/seller/dashboard/reviews", icon: Star },
  { label: "My Shop", href: "/seller/dashboard/shop", icon: Store },
  { label: "Settings", href: "/seller/dashboard/settings", icon: Settings },
];

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({
  collapsed,
  onToggle,
  onMobileClose,
  isMobile,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
  isMobile: boolean;
}) {
  const pathname = usePathname();
  const { data: seller } = useSellerMe();
  const { mutate: logout } = useSellerLogout();

  // isExpanded: true when sidebar shows labels (either mobile drawer OR desktop not-collapsed)
  const isExpanded = isMobile || !collapsed;

  return (
    <aside
      className={`
        flex flex-col border-r border-white/6 bg-[#070a12] transition-all duration-300
        ${isMobile ? "w-72" : collapsed ? "w-18" : "w-64"}
      `}
    >
      {/* ── Logo row ─────────────────────────────────────────────────────── */}
      <div className="flex h-16 items-center justify-between border-b border-white/6 px-4">
        {isExpanded && (
          <Link href="/" className="flex items-center gap-2">
            <span className="rounded-lg bg-linear-to-br from-emerald-400 to-teal-500 px-2.5 py-1 text-xs font-black text-black">
              SHOP
            </span>
            <span className="text-xs font-light tracking-widest text-white/30 uppercase">
              ify
            </span>
          </Link>
        )}

        {/* Close (mobile) or collapse toggle (desktop) */}
        {isMobile ? (
          <button
            onClick={onMobileClose}
            className="ml-auto text-white/30 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={onToggle}
            className={`flex h-7 w-7 items-center justify-center rounded-lg text-white/30 hover:bg-white/5 hover:text-white transition-all ${collapsed ? "mx-auto" : "ml-auto"}`}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* ── Seller info ───────────────────────────────────────────────────── */}
      {isExpanded ? (
        <div className="mx-3 mt-4 rounded-xl border border-white/6 bg-white/2 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-emerald-400 to-teal-500 text-sm font-bold text-black">
              {seller?.name?.[0]?.toUpperCase() ?? "S"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {seller?.name ?? "Seller"}
              </p>
              <p className="truncate text-xs text-white/30">
                {seller?.shop?.name ?? "No shop"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Collapsed — just show avatar
        <div className="mx-auto mt-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-emerald-400 to-teal-500 text-sm font-bold text-black">
            {seller?.name?.[0]?.toUpperCase() ?? "S"}
          </div>
        </div>
      )}

      {/* ── Nav links ─────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {isExpanded && (
          <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-widest text-white/20">
            Menu
          </p>
        )}

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          // Active detection:
          // Overview uses exact match (don't highlight for all /seller/dashboard/* routes)
          // Others use startsWith (highlight "Products" when on /seller/dashboard/products/create)
          const isActive =
            item.href === "/seller/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={isMobile ? onMobileClose : undefined}
              title={!isExpanded ? item.label : undefined} // tooltip when collapsed
              className={`
                flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150
                ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "text-white/40 hover:bg-white/5 hover:text-white/70"
                }
                ${!isExpanded ? "justify-center px-0" : ""}
              `}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${isActive ? "text-emerald-400" : ""}`}
              />
              {isExpanded && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* ── Logout ───────────────────────────────────────────────────────── */}
      <div className="border-t border-white/6 p-3">
        <button
          onClick={() => logout()}
          title={!isExpanded ? "Logout" : undefined}
          className={`
            flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm
            text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-all
            ${!isExpanded ? "justify-center px-0" : ""}
          `}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {isExpanded && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

// ── Top bar ───────────────────────────────────────────────────────────────────
function TopBar({ onMobileMenuOpen }: { onMobileMenuOpen: () => void }) {
  const pathname = usePathname();
  const { data: seller } = useSellerMe();

  const getPageTitle = () => {
    const item = NAV_ITEMS.find((n) =>
      n.href === "/seller/dashboard"
        ? pathname === n.href
        : pathname.startsWith(n.href),
    );
    return item?.label ?? "Dashboard";
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/6 bg-[#070a12]/80 backdrop-blur-xl px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMobileMenuOpen}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 hover:bg-white/5 hover:text-white transition-all lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
        <h1 className="text-sm font-semibold text-white">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center gap-3">
        {seller?.shop && (
          <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/3 px-3 py-1.5">
            <Package className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs text-white/60">{seller.shop.name}</span>
          </div>
        )}
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-emerald-400 to-teal-500 text-xs font-bold text-black">
          {seller?.name?.[0]?.toUpperCase() ?? "S"}
        </div>
      </div>
    </header>
  );
}

// ── Layout inner ──────────────────────────────────────────────────────────────
function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#050810]">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          onMobileClose={() => {}}
          isMobile={false}
        />
      </div>

      {/* Mobile drawer */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Sidebar
          collapsed={false}
          onToggle={() => {}}
          onMobileClose={() => setMobileOpen(false)}
          isMobile={true}
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onMobileMenuOpen={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
// SellerGuard protects the ENTIRE dashboard — every child page is protected
// by this single guard. You don't need to add SellerGuard to each page.
export default function SellerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SellerGuard>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SellerGuard>
  );
}
