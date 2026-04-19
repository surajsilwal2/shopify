"use client";

import { useMe } from "@/hooks/auth-hook";
import {
  Heart,
  Menu,
  Search,
  ShoppingCart,
  X,
  ChevronDown,
  LogOut,
  User,
  Package,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useLogout } from "@/hooks/auth-hook";

// ─── Nav links — easy to extend later ────────────────────────────────────────
// Keeping this as a constant outside the component means it won't be
// recreated on every render
const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Shop", href: "/shop" },
  { label: "Offers", href: "/offers" },
  { label: "Become a Seller", href: "/seller/register" },
];

// ─── Small reusable icon button ───────────────────────────────────────────────
// Extract this so we don't repeat the same className 4 times
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
      {/* Badge — only renders if count > 0 */}
      {badge && badge > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-black">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </button>
  );
}

// ─── Main Header ──────────────────────────────────────────────────────────────
export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname.startsWith("/seller")) return null;
  
  // Check if we're on an auth page - skip useMe() query on these pages
  const isAuthPage = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verify-otp",
    "/verify-reset-otp",
  ].includes(pathname);
  
  // Only query user data if NOT on auth page - use enabled option
  const { data: user, isLoading } = useMe(!isAuthPage);
  const { mutate: logout } = useLogout();

  // Separate pieces of UI state — each controls one thing
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Don't show user-related UI on auth pages
  const shouldShowUserSection = !isAuthPage;

  // Placeholder counts — replace with real hooks when you build cart/wishlist
  const cartCount = 10;
  const wishlistCount = 10;

  // Close user dropdown when clicking outside
  // This is a common pattern — attach a listener to the document
  const userMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // 2. Check if our Box (ref) exists AND if it DOES NOT contain the clicked thing
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(
          e.target as Node, // 1. Identify what was clicked (the Target))
        )
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
    // sticky so it stays visible while scrolling
    // backdrop-blur gives the frosted glass effect
    <header className="sticky top-0 z-50 border-b border-white/6 bg-[#080b14]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="rounded-xl bg-linear-to-br from-amber-400 to-orange-500 px-3 py-1.5 text-sm font-black tracking-tight text-black">
              SHOP
            </span>
            <span className="hidden text-sm font-light tracking-widest text-white/40 uppercase sm:block">
              ify
            </span>
          </Link>

          {/* ── Desktop Nav ── */}
          {/* hidden on mobile, flex on lg screens */}
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

          {/* ── Right Side Actions ── */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <IconButton
              label="Search"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <Search className="h-4 w-4" />
            </IconButton>

            {/* Wishlist — only show when logged in */}
            {user && (
              <IconButton label="Wishlist" badge={wishlistCount}>
                <Heart className="h-4 w-4" />
              </IconButton>
            )}

            {/* Cart — always visible */}
            <IconButton label="Cart" badge={cartCount}>
              <ShoppingCart className="h-4 w-4" />
            </IconButton>

            {/* ── User Section ── */}
            {isLoading ? (
              // Skeleton while checking auth — prevents layout shift
              <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
            ) : user ? (
              // ── Logged in — show avatar + dropdown ──
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm transition-all hover:bg-white/8"
                >
                  {/* Avatar circle with user initial */}
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-br from-amber-400 to-orange-500 text-xs font-bold text-black">
                    {user.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="hidden text-sm text-slate-300 sm:block">
                    {/* Show first name only */}
                    {user.name?.split(" ")[0]}
                  </span>
                  <ChevronDown
                    className={`h-3 w-3 text-slate-500 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-white/8 bg-[#0f1523] p-1.5 shadow-2xl shadow-black/50">
                    {/* User info at top */}
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
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-400 transition-all hover:bg-red-500/10"
                      >
                        <LogOut className="h-3.5 w-3.5 pointer-events-none" />{" "}
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // ── Guest — show login button ──
              <Link
                href="/login"
                className="rounded-xl bg-linear-to-r from-amber-400 to-orange-500 px-4 py-1.5 text-xs font-bold text-black transition-all hover:from-amber-300 hover:to-orange-400"
              >
                Sign In
              </Link>
            )}

            {/* Mobile hamburger — only on small screens */}
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

        {/* ── Search Bar — slides down when open ── */}
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
              {/* Clear button */}
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

        {/* ── Mobile Menu ── */}
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
