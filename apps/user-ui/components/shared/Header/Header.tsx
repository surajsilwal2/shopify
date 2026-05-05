"use client";

// components/shared/Header/Header.tsx
//
// WHAT CHANGED FROM BEFORE:
// cartCount and wishlistCount were hardcoded (cartCount = 10)
// Now they come from Zustand store — real live counts
// When user adds to cart anywhere in the app →
// Header badge updates AUTOMATICALLY with no extra code needed
// This is the power of global state

import { useMe } from "@/hooks/auth-hook";
import {useCartStore} from '../../../../../stores/cart-store'
import {
  ChevronDown,
  Heart,
  LogOut,
  Menu,
  Package,
  Search,
  Settings,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLogout } from "@/hooks/auth-hook";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Shop", href: "/shop" },
  { label: "Offers", href: "/offers" },
  { label: "Become a Seller", href: "/seller/register" },
];

function IconButton({
  children,
  onClick,
  badge,
  label,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  badge?: number;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-white/8 hover:text-white"
    >
      {children}
      {badge && badge > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-black">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </button>
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  // ── Zustand selectors ──────────────────────────────────────────────────────
  // IMPORTANT: We use SELECTORS — not the whole store
  // selector = (state) => state.something
  //
  // WHY SELECTORS MATTER:
  // If we did: const store = useCartStore()
  // Header would re-render on EVERY store change (cart, wishlist, any action)
  //
  // With selectors:
  // cartCount only re-renders when cart count changes
  // wishlistCount only re-renders when wishlist length changes
  // They are INDEPENDENT subscriptions
  const cartCount = useCartStore((state) => state.getCartCount());
  const wishlistCount = useCartStore((state) => state.wishlist.length);

  if (pathname.startsWith("/seller")) return null;

  const isAuthPage = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verify-otp",
    "/verify-reset-otp",
  ].includes(pathname);

  const { data: user, isLoading } = useMe(!isAuthPage);
  const { mutate: logout } = useLogout();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    setSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/6 bg-[#080b14]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 px-3 py-1.5 text-sm font-black tracking-tight text-black">
              SHOP
            </span>
            <span className="hidden text-sm font-light tracking-widest text-white/40 uppercase sm:block">
              ify
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm text-slate-400 transition-all hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <IconButton
              label="Search"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <Search className="h-4 w-4" />
            </IconButton>

            {/* Wishlist — show for all users with real count from Zustand */}
            <IconButton
              label="Wishlist"
              badge={wishlistCount}
              onClick={() => router.push("/wishlist")}
            >
              <Heart className="h-4 w-4" />
            </IconButton>

            {/* Cart — always visible, real count from Zustand */}
            <IconButton
              label="Cart"
              badge={cartCount}
              onClick={() => router.push("/cart")}
            >
              <ShoppingCart className="h-4 w-4" />
            </IconButton>

            {/* User section */}
            {isLoading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
            ) : user ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm transition-all hover:bg-white/8"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold text-black">
                    {user.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="hidden text-sm text-slate-300 sm:block">
                    {user.name?.split(" ")[0]}
                  </span>
                  <ChevronDown
                    className={`h-3 w-3 text-slate-500 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-white/8 bg-[#0f1523] p-1.5 shadow-2xl shadow-black/50">
                    <div className="px-3 py-2 mb-1 border-b border-white/6">
                      <p className="text-xs font-semibold text-white">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-400 transition-all hover:bg-white/5 hover:text-white"
                    >
                      <User className="h-3.5 w-3.5" /> Profile
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-400 transition-all hover:bg-white/5 hover:text-white"
                    >
                      <Package className="h-3.5 w-3.5" /> Orders
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-400 transition-all hover:bg-white/5 hover:text-white"
                    >
                      <Settings className="h-3.5 w-3.5" /> Settings
                    </Link>
                    <div className="mt-1 border-t border-white/6 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-400 transition-all hover:bg-red-500/10"
                      >
                        <LogOut className="h-3.5 w-3.5" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-1.5 text-xs font-bold text-black transition-all hover:from-amber-300 hover:to-orange-400"
              >
                Sign In
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="ml-1 flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-white/8 hover:text-white lg:hidden"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="border-t border-white/6 py-3">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-amber-400/40 focus:ring-2 focus:ring-amber-400/10"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </form>
          </div>
        )}

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-white/6 py-3 lg:hidden">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm text-slate-400 transition-all hover:bg-white/5 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
