"use client";

// app/(seller)/seller/onboarding/page.tsx
//
// STEP 2 of the seller journey — Create your shop
//
// This page is PROTECTED — SellerGuard handles the auth check.
// If seller is not logged in, SellerGuard redirects to /seller/login
// before this page even renders.
//
// WHAT WE COLLECT:
// Required: shop name, category
// Optional: bio, address, opening hours, website
// Images (avatar, cover banner) come AFTER shop creation
// Why? Because file uploads need a shopId to associate with.
// Don't collect what you can't store yet.

import SellerGuard from "@/components/seller/seller-guard";
import { useCreateShop } from "@/hooks/seller-hook";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlignLeft,
  Building2,
  Clock,
  Globe,
  MapPin,
  Store,
  Tag,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// ── Validation schema ─────────────────────────────────────────────────────────
// Mirrors your createShopContract.body from @repo/api-contract
const shopSchema = z.object({
  name: z.string().min(2, "Shop name must be at least 2 characters"),
  category: z.string().min(1, "Please select a category"),
  bio: z.string().max(300, "Bio must be under 300 characters").optional(),
  address: z.string().optional(),
  openingHours: z.string().optional(),
  website: z
    .url("Must be a valid URL (include https://)")
    .optional()
    .or(z.literal("")), // allow empty string
});

type ShopForm = z.infer<typeof shopSchema>;

// ── Shop categories ───────────────────────────────────────────────────────────
const CATEGORIES = [
  "Electronics",
  "Fashion & Clothing",
  "Home & Garden",
  "Beauty & Health",
  "Sports & Outdoors",
  "Books & Education",
  "Toys & Games",
  "Food & Beverages",
  "Jewelry & Accessories",
  "Art & Crafts",
  "Automotive",
  "Pet Supplies",
  "Office & Stationery",
  "Music & Instruments",
  "Photography",
  "Other",
];

// ── Inner page content ────────────────────────────────────────────────────────
// Separated from the export so SellerGuard wraps it cleanly
function OnboardingContent() {
  const { mutate: create, isPending } = useCreateShop();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ShopForm>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      bio: "",
      address: "",
      openingHours: "",
      website: "",
    },
  });

  // Watch bio to show character count
  const bioValue = watch("bio") ?? "";

  const onSubmit = (data: ShopForm) => {
    // Remove empty optional fields before sending to API
    // Why? Because sending empty strings to backend could fail validation
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== "" && v !== undefined),
    ) as ShopForm;
    create(cleaned);
  };

  return (
    <div className="min-h-screen bg-[#050810] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-125 h-125 rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-100 h-100 rounded-full bg-teal-500/4 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative w-full max-w-lg">
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
                <Store className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] tracking-widest uppercase text-emerald-400/70 font-medium">
                  Step 2 of 3
                </p>
                <h1 className="text-xl font-bold text-white">
                  Set Up Your Shop
                </h1>
              </div>
            </div>
            <p className="text-sm text-white/40">
              Tell customers about your store. You can update these details
              later.
            </p>
          </div>

          {/* Progress bar — step 2 active */}
          <div className="flex gap-1.5 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  s <= 2
                    ? "bg-linear-to-r from-emerald-400 to-teal-400"
                    : "bg-white/10"
                }`}
              />
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Shop name + category in a row on larger screens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Shop Name */}
              <FieldGroup
                label="Shop Name"
                icon={<Building2 className="h-4 w-4" />}
                error={errors.name?.message}
                required
              >
                <input
                  {...register("name")}
                  placeholder="My Awesome Store"
                  className={inputClass(!!errors.name)}
                />
              </FieldGroup>

              {/* Category */}
              <FieldGroup
                label="Category"
                icon={<Tag className="h-4 w-4" />}
                error={errors.category?.message}
                required
              >
                <select
                  {...register("category")}
                  className={`${inputClass(!!errors.category)} appearance-none cursor-pointer`}
                >
                  <option value="" className="bg-[#0f1523]">
                    Select category
                  </option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-[#0f1523]">
                      {c}
                    </option>
                  ))}
                </select>
              </FieldGroup>
            </div>

            {/* Bio */}
            <FieldGroup
              label="Shop Bio"
              icon={<AlignLeft className="h-4 w-4" />}
              error={errors.bio?.message}
            >
              {/* textarea — note: register works on textarea too */}
              <div className="relative">
                <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-white/20 pointer-events-none" />
                <textarea
                  {...register("bio")}
                  placeholder="Tell customers what makes your shop special..."
                  rows={3}
                  className={`
                    w-full rounded-xl border bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white
                    placeholder:text-white/20 outline-none transition-all duration-200 resize-none
                    ${
                      errors.bio
                        ? "border-red-500/50 focus:border-red-500/70"
                        : "border-white/10 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/10"
                    }
                  `}
                />
                {/* Character counter */}
                <span
                  className={`absolute bottom-2 right-3 text-[10px] ${
                    bioValue.length > 280 ? "text-red-400" : "text-white/20"
                  }`}
                >
                  {bioValue.length}/300
                </span>
              </div>
            </FieldGroup>

            {/* Address */}
            <FieldGroup
              label="Address"
              icon={<MapPin className="h-4 w-4" />}
              error={errors.address?.message}
            >
              <input
                {...register("address")}
                placeholder="123 Main St, City, Country"
                className={inputClass(!!errors.address)}
              />
            </FieldGroup>

            {/* Opening hours + website in a row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldGroup
                label="Opening Hours"
                icon={<Clock className="h-4 w-4" />}
                error={errors.openingHours?.message}
              >
                <input
                  {...register("openingHours")}
                  placeholder="Mon-Fri 9am-6pm"
                  className={inputClass(!!errors.openingHours)}
                />
              </FieldGroup>

              <FieldGroup
                label="Website"
                icon={<Globe className="h-4 w-4" />}
                error={errors.website?.message}
              >
                <input
                  {...register("website")}
                  placeholder="https://mystore.com"
                  className={inputClass(!!errors.website)}
                />
              </FieldGroup>
            </div>

            {/* What comes next — info box */}
            {/* Setting expectations reduces drop-off */}
            <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4">
              <p className="text-xs text-emerald-400/80 font-medium mb-1">
                What happens next?
              </p>
              <p className="text-xs text-white/40 leading-relaxed">
                After creating your shop, you'll connect your Stripe account to
                receive payments. This takes about 2 minutes.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 py-3 text-sm font-bold text-black transition-all hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                  Creating shop...
                </span>
              ) : (
                "Create Shop & Continue →"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Page export — wrapped in SellerGuard ──────────────────────────────────────
// The guard runs BEFORE OnboardingContent renders
// If seller isn't logged in → redirect happens inside the guard
// If seller already has a shop → guard redirects to /seller/connect-stripe
export default function SellerOnboardingPage() {
  return (
    <SellerGuard>
      <OnboardingContent />
    </SellerGuard>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function FieldGroup({
  label,
  icon,
  error,
  required,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-medium uppercase tracking-widest text-white/40 flex items-center gap-1">
        {label}
        {required && <span className="text-emerald-400">*</span>}
      </label>
      {/* 
        For textarea we DON'T wrap in relative div with icon 
        because the icon is positioned inside the textarea itself.
        For regular inputs we use the relative wrapper pattern.
      */}
      <div className="relative flex items-center">
        {/* Only show icon for non-textarea children */}
        {!isTextArea(children) && (
          <span className="absolute left-3 text-white/20 pointer-events-none z-10">
            {icon}
          </span>
        )}
        {children}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// Helper to detect if children is a textarea (to skip icon overlay)
function isTextArea(children: React.ReactNode): boolean {
  if (!children) return false;
  const child = Array.isArray(children) ? children[0] : children;
  return (
    child &&
    typeof child === "object" &&
    "props" in child &&
    (child as any).props?.children?.type === "textarea"
  );
}

function inputClass(hasError: boolean) {
  return `
    w-full rounded-xl border bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white
    placeholder:text-white/20 outline-none transition-all duration-200
    ${
      hasError
        ? "border-red-500/50 focus:border-red-500/70 focus:ring-2 focus:ring-red-500/10"
        : "border-white/10 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/10"
    }
  `;
}
